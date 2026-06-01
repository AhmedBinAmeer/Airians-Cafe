import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET || "dev-airians-cafe-secret",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}
