import { Injectable, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { User } from '../schemas/user.schema';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    ) {}

  onModuleInit() {
    if (getApps().length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          initializeApp({
            credential: cert(serviceAccount),
          });
          return;
        } catch (e) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
        }
      }
      initializeApp();
    }
  }

  generateToken(user: any) {
    const payload = { id: user._id, role: user.role };
    return this.jwtService.sign(payload);
  }

  async login(email: string, password?: string) {
    const normalizedEmail = String(email || '').toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new BadRequestException('Your account has been blocked.');
    }

    if (password) {
      if (!user.passwordHash) {
        throw new BadRequestException('Account not verified. Request an OTP.');
      }
      
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Invalid credentials');
      }

      return {
        token: this.generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          walletBalance: user.walletBalance,
        },
      };
    } else {
      throw new BadRequestException('Password required');
    }
  }

  async adminLogin(email: string, password?: string) {
    const normalizedEmail = String(email || '').toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user || user.role !== 'admin') {
      throw new BadRequestException('Invalid admin credentials');
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Invalid admin credentials');
      }

      return {
        token: this.generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          walletBalance: user.walletBalance,
        },
      };
    } else {
      throw new BadRequestException('Password required');
    }
  }

  async googleLogin(idToken: string) {
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const email = decodedToken.email?.toLowerCase();
      
      if (!email) {
        throw new BadRequestException('Invalid Firebase Token: No email found');
      }

      let user = await this.userModel.findOne({ email });

      if (user && user.isBlocked) {
        throw new BadRequestException('Your account has been blocked.');
      }

      if (!user) {
        user = new this.userModel({
          email,
          name: decodedToken.name || email.split('@')[0],
          isVerified: true,
          googleId: decodedToken.uid,
          googleUid: decodedToken.uid,
        });
        await user.save();
      } else if (!user.googleId) {
        user.googleId = decodedToken.uid;
        user.googleUid = decodedToken.uid;
        user.isVerified = true;
        await user.save();
      }

      return {
        token: this.generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          walletBalance: user.walletBalance,
        },
      };
    } catch (error) {
      throw new BadRequestException('Firebase Authentication failed: ' + error.message);
    }
  }

  async completeOnboarding(userId: string, data: { phone: string; role: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.phone = data.phone;
    if (['student', 'faculty', 'staff', 'guest'].includes(data.role)) {
      user.role = data.role;
    }
    await user.save();

    return {
      token: this.generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance,
      },
    };
  }

  // Simplified OTP logic (we will port the full Mailer/WhatsApp logic shortly)
  async requestOtp(data: { name: string; email: string; phone: string; role?: string }) {
    const { name, email, phone, role = 'student' } = data;

    if (!name || !email || !phone) {
      throw new BadRequestException('Name, email, and phone are required');
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await this.userModel.findOne({ email: normalizedEmail });
    if (existing?.role === 'admin') {
      throw new ConflictException('Use the admin login for this account');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otpCode, 10);

    const user = await this.userModel.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name,
          email: normalizedEmail,
          phone,
          role,
          otp: {
            codeHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await this.notificationsService.sendOtp(user.name, user.email, user.phone, otpCode);

    return { message: 'OTP sent successfully. Please check your WhatsApp/Email.' };
  }

  async verifyOtp(data: { email: string; code: string; password?: string }) {
    const { email, code, password } = data;
    const user = await this.userModel.findOne({ email: String(email || '').toLowerCase() });

    if (!user || !user.otp?.codeHash) {
      throw new BadRequestException('Request a fresh OTP first');
    }

    if (user.otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired. Request a new code.');
    }

    const isMatch = await bcrypt.compare(code, user.otp.codeHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect OTP');
    }

    if (password) {
      if (password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    user.isVerified = true;
    user.otp = undefined as any;
    await user.save();

    return {
      token: this.generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance,
      },
    };
  }
}
