import { Elysia, t } from "elysia"
import { prisma } from "../lib/prisma"
import { authMiddleware } from "../middleware/auth"
import { hashPassword, sanitizeString } from "../lib/utils"

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)

  // Update user profile
  .put(
    "/profile",
    async ({ user, body }) => {
      const { fullName, phone, preferences } = body

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: fullName ? sanitizeString(fullName) : undefined,
          phone: phone ? phone.replace(/[-\s]/g, "") : undefined,
          preferences: preferences || undefined,
        },
      })

      return {
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
          image: updatedUser.image,
          preferences: updatedUser.preferences,
          isVerified: updatedUser.isVerified,
        },
      }
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String({ minLength: 2 })),
        phone: t.Optional(t.String({ minLength: 9 })),
        preferences: t.Optional(t.Any()),
      }),
    },
  )

  // Change password (for email/password accounts)
  .put(
    "/password",
    async ({ user, body }) => {
      const { currentPassword, newPassword } = body

      // Check if user has a password (not OAuth-only account)
      if (!user.passwordHash) {
        throw new Error("This account uses social login. Password change not available.")
      }

      const bcrypt = require("bcryptjs")
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash)

      if (!isValidPassword) {
        throw new Error("Current password is incorrect")
      }

      const hashedNewPassword = await hashPassword(newPassword)

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedNewPassword },
      })

      return {
        success: true,
        message: "Password updated successfully",
      }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 6 }),
      }),
    },
  )

  // Get user notifications
  .get("/notifications", async ({ user, query }) => {
    const { limit = 20, offset = 0, unreadOnly } = query

    const where: any = { userId: user.id }
    if (unreadOnly === "true") {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit.toString()),
      skip: Number.parseInt(offset.toString()),
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return {
      success: true,
      notifications,
      unreadCount,
    }
  })

  // Mark notification as read
  .put("/notifications/:notificationId/read", async ({ user, params }) => {
    await prisma.notification.updateMany({
      where: {
        id: params.notificationId,
        userId: user.id,
      },
      data: { isRead: true },
    })

    return {
      success: true,
      message: "Notification marked as read",
    }
  })

  // Mark all notifications as read
  .put("/notifications/read-all", async ({ user }) => {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })

    return {
      success: true,
      message: "All notifications marked as read",
    }
  })

  // Delete account
  .delete(
    "/account",
    async ({ user, body }) => {
      const { password, confirmText } = body

      if (confirmText !== "DELETE MY ACCOUNT") {
        throw new Error("Confirmation text does not match")
      }

      // Verify password if account has one
      if (user.passwordHash) {
        const bcrypt = require("bcryptjs")
        const isValidPassword = await bcrypt.compare(password, user.passwordHash)

        if (!isValidPassword) {
          throw new Error("Password is incorrect")
        }
      }

      // Cancel all future reservations
      await prisma.reservation.updateMany({
        where: {
          userId: user.id,
          date: { gte: new Date() },
          status: { in: ["pending", "confirmed"] },
        },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      })

      // Delete user account (cascade will handle related records)
      await prisma.user.delete({
        where: { id: user.id },
      })

      return {
        success: true,
        message: "Account deleted successfully",
      }
    },
    {
      body: t.Object({
        password: t.Optional(t.String()),
        confirmText: t.String(),
      }),
    },
  )
