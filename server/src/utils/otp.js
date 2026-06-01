import bcrypt from "bcryptjs";

export function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

export async function compareOtp(code, hash) {
  if (!code || !hash) return false;
  return bcrypt.compare(String(code), hash);
}
