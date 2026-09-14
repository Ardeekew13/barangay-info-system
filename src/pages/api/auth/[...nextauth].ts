import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/backend/models/User";
import LoginAudit from "@/backend/models/LoginAudit";

// Brute-force protection: after this many wrong passwords in a row, the
// account is locked for LOCK_DURATION_MS regardless of whether the next
// attempt has the right password.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: any): string {
  const xff = req?.headers?.["x-forwarded-for"];
  if (xff) {
    return Array.isArray(xff) ? xff[0] : String(xff).split(",")[0].trim();
  }
  const realIp = req?.headers?.["x-real-ip"];
  if (realIp) return Array.isArray(realIp) ? realIp[0] : String(realIp);
  return "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        await connectDB();

        const ip = getClientIp(req);
        const userAgent = String(req?.headers?.["user-agent"] || "");
        const usernameInput = credentials.username.toLowerCase().trim();

        const logAttempt = (fields: Record<string, any>) =>
          LoginAudit.create({
            username: usernameInput,
            ip,
            userAgent,
            ...fields,
          }).catch(() => {
            // Never let audit logging break the login flow itself
          });

        const user = await User.findOne({ username: usernameInput });

        if (!user) {
          await logAttempt({ success: false, reason: "invalid_username" });
          throw new Error("Invalid username or password");
        }

        if (!user.isActive) {
          await logAttempt({ userId: user._id, success: false, reason: "inactive_account" });
          throw new Error("Invalid username or password");
        }

        // Already locked from previous failed attempts?
        if (user.lockUntil && user.lockUntil > new Date()) {
          await logAttempt({ userId: user._id, success: false, reason: "account_locked" });
          const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
          throw new Error(
            `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
          );
        }

        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

          let reason = "invalid_password";
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
            reason = "account_locked";
          }

          await user.save();
          await logAttempt({ userId: user._id, success: false, reason });
          throw new Error("Invalid username or password");
        }

        // Successful login — clear any lockout state
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        await logAttempt({ userId: user._id, success: true, reason: "success" });

        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
