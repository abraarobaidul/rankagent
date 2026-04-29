import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Credentials provider for internal team use (email + password or magic code)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // For MVP: accept any email from the demo org, or match demo credentials
        const demoEmail = process.env.DEMO_EMAIL ?? "demo@rankagent.io";
        const demoPassword = process.env.DEMO_PASSWORD ?? "rankagent2025";

        if (
          credentials.email === demoEmail &&
          credentials.password === demoPassword
        ) {
          // Find or auto-provision the demo user
          let user = await prisma.user.findUnique({
            where: { email: demoEmail },
          });

          if (!user) {
            // Auto-provision demo org + user on first login
            const org = await prisma.organization.upsert({
              where: { slug: "demo-org" },
              update: {},
              create: { name: "Demo Organization", slug: "demo-org" },
            });
            user = await prisma.user.create({
              data: {
                email: demoEmail,
                name: "Demo User",
                role: "OWNER",
                organizationId: org.id,
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch org id for the user
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { organizationId: true, role: true },
        });
        if (dbUser) {
          token.organizationId = dbUser.organizationId;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { organizationId?: string }).organizationId =
          token.organizationId as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
