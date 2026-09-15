import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema, pinLoginSchema } from "@/lib/validation/auth";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.isActive) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "pin",
      name: "PIN",
      credentials: {
        userId: {},
        pin: {},
      },
      authorize: async (credentials) => {
        const parsed = pinLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { userId, pin } = parsed.data;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive || user.role !== "TEACHER" || !user.pinHash) return null;
        if (user.pinLockedUntil && user.pinLockedUntil > new Date()) return null;

        const pinValid = await bcrypt.compare(pin, user.pinHash);
        if (!pinValid) {
          const attempts = user.pinFailedAttempts + 1;
          const locked = attempts >= PIN_MAX_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              pinFailedAttempts: locked ? 0 : attempts,
              pinLockedUntil: locked
                ? new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000)
                : null,
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { pinFailedAttempts: 0, pinLockedUntil: null },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
