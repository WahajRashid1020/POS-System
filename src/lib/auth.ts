import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./db";
import { UserModel } from "./models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Demo accounts for testing without Google OAuth
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const role = credentials?.role || "cashier";

        const demoAccounts: Record<string, any> = {
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
    }),
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
