import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  events: {
    // signIn 이벤트는 DB 저장 완료 후 실행됨 (callback과 달리)
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile && user.id) {
        const p = profile as {
          id: string;
          username?: string;
          avatar: string | null;
          banner: string | null;
        };

        const avatarUrl = p.avatar
          ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png?size=256`
          : null;
        const bannerUrl = p.banner
          ? `https://cdn.discordapp.com/banners/${p.id}/${p.banner}.png?size=600`
          : null;

        const isAdmin = p.id === process.env.ADMIN_DISCORD_ID;

        // Set default username to Discord ID (globally unique, no collision possible)
        const current = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true } });
        const usernameUpdate = current?.username ? undefined : { username: p.id };

        await prisma.user.update({
          where: { id: user.id },
          data: {
            discordId: p.id,
            ...(avatarUrl && { image: avatarUrl }),
            banner: bannerUrl,
            ...(isAdmin && { role: "ADMIN" }),
            ...usernameUpdate,
          },
        });
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
