import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { SignJWT, jwtVerify } from "jose";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: { strategy: "jwt" },
  jwt: {
    async encode({ token, secret }) {
      const key = new TextEncoder().encode(secret as string);
      return new SignJWT(token as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(key);
    },
    async decode({ token, secret }) {
      if (!token) return null;
      const key = new TextEncoder().encode(secret as string);
      const { payload } = await jwtVerify(token, key);
      return payload as JWT;
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
