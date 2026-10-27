import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./db";
import { UserModel } from "./models/User";

// The demo accounts need no password, so anyone who can reach this login can
// pick any role. They are off unless explicitly enabled (local dev, or a
// throwaway demo deployment with a test database and Stripe test keys).
// NEXT_PUBLIC_ so the login page can hide the demo buttons when it is off.
export const DEMO_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  image: null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Demo accounts for testing without Google OAuth
    ...(DEMO_LOGIN_ENABLED ? [CredentialsProvider({
      name: "Demo Account",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const role = credentials?.role || "cashier";

        const demoAccounts: Record<string, DemoAccount> = {
          admin: {
            id: "demo-admin",
            name: "Admin User",
            email: "admin@quickserve.demo",
            role: "admin",
            image: null,
          },
          manager: {
            id: "demo-manager",
            name: "Manager User",
            email: "manager@quickserve.demo",
            role: "manager",
            image: null,
          },
          cashier: {
            id: "demo-cashier",
            name: "Cashier User",
            email: "cashier@quickserve.demo",
            role: "cashier",
            image: null,
          },
          kitchen: {
            id: "demo-kitchen",
            name: "Kitchen Staff",
            email: "kitchen@quickserve.demo",
            role: "kitchen",
            image: null,
          },
        };

        return demoAccounts[role] || null;
      },
    })] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          // Find or create user
          const existingUser = await UserModel.findOne({
            email: user.email,
          });

          if (existingUser) {
            existingUser.lastLogin = new Date();
            await existingUser.save();
          } else {
            // First user becomes admin, rest become cashier
            const userCount = await UserModel.countDocuments();
            await UserModel.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: userCount === 0 ? "admin" : "cashier",
              lastLogin: new Date(),
            });
          }
        } catch (error) {
          console.error("SignIn error:", error);
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // For demo accounts, role is on the user object
        if ((user as any).role) {
          token.role = (user as any).role;
        }

        // For Google accounts, fetch role from DB
        if (account?.provider === "google") {
          try {
            await connectDB();
            const dbUser = await UserModel.findOne({
              email: user.email,
            });
            token.role = dbUser?.role || "cashier";
            token.dbId = dbUser?._id?.toString();
          } catch {
            token.role = "cashier";
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "cashier";
        (session.user as any).dbId = token.dbId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // A shift's worth: staff sign in again each day instead of staying
    // signed in for the 30-day default.
    maxAge: 12 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
