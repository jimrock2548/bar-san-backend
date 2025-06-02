import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanup() {
  console.log("🧹 Starting cleanup...")

  // Clean up expired temporary reservations
  const expiredTempReservations = await prisma.temporaryReservation.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  console.log(`🗑️  Deleted ${expiredTempReservations.count} expired temporary reservations`)

  // Clean up expired sessions
  const expiredUserSessions = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  const expiredAdminSessions = await prisma.adminSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  console.log(`🗑️  Deleted ${expiredUserSessions.count} expired user sessions`)
  console.log(`🗑️  Deleted ${expiredAdminSessions.count} expired admin sessions`)

  // Clean up expired verification tokens
  const expiredTokens = await prisma.verificationToken.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  })

  console.log(`🗑️  Deleted ${expiredTokens.count} expired verification tokens`)

  // Clean up old notifications (older than 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const oldNotifications = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      isRead: true,
    },
  })

  console.log(`🗑️  Deleted ${oldNotifications.count} old read notifications`)

  console.log("✅ Cleanup completed!")
}

cleanup()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
