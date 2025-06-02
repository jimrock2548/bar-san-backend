import { Elysia } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { prisma } from "../lib/prisma"

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .derive(async ({ cookie, jwt }) => {
    const token = cookie["auth-token"]

    if (!token) {
      throw new Error("Unauthorized")
    }

    try {
      const payload = await jwt.verify(token)

      if (payload.type !== "user") {
        throw new Error("Invalid token type")
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          accounts: {
            select: {
              provider: true,
              type: true,
            },
          },
        },
      })

      if (!user) {
        throw new Error("User not found")
      }

      return { user }
    } catch (error) {
      throw new Error("Unauthorized")
    }
  })

export const adminAuthMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .derive(async ({ cookie, jwt }) => {
    const token = cookie["admin-token"]

    if (!token) {
      throw new Error("Unauthorized")
    }

    try {
      const payload = await jwt.verify(token)

      if (payload.type !== "admin") {
        throw new Error("Invalid token type")
      }

      const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        include: {
          roles: {
            include: {
              role: true,
              cafe: true,
            },
          },
        },
      })

      if (!admin || !admin.isActive) {
        throw new Error("Admin not found or inactive")
      }

      return { admin }
    } catch (error) {
      throw new Error("Unauthorized")
    }
  })
