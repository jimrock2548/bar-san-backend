import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { prisma } from "../lib/prisma"
import { adminAuthMiddleware } from "../middleware/auth"
import { comparePassword } from "../lib/utils"

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )

  // Admin login
  .post(
    "/login",
    async ({ body, jwt, setCookie }) => {
      const { username, password } = body

      const admin = await prisma.admin.findFirst({
        where: {
          OR: [{ username }, { email: username }],
          isActive: true,
        },
        include: {
          roles: {
            include: {
              role: true,
              cafe: true,
            },
          },
        },
      })

      if (!admin) {
        throw new Error("Invalid credentials")
      }

      const isValidPassword = await comparePassword(password, admin.passwordHash)
      if (!isValidPassword) {
        throw new Error("Invalid credentials")
      }

      const token = await jwt.sign({
        adminId: admin.id,
        username: admin.username,
        type: "admin",
      })

      // Update last login
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      })

      // Create session
      await prisma.adminSession.create({
        data: {
          adminId: admin.id,
          sessionToken: token,
          ipAddress: "127.0.0.1",
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        },
      })

      setCookie("admin-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60,
      })

      return {
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          roles: admin.roles.map((ar) => ({
            role: ar.role.name,
            cafe: ar.cafe.name,
            permissions: ar.role.permissions,
          })),
        },
        token,
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )

  // Protected admin routes
  .use(adminAuthMiddleware)

  // Get admin dashboard data
  .get("/dashboard/:cafeId", async ({ admin, params }) => {
    const cafeId = params.cafeId

    // Check if admin has access to this cafe
    const hasAccess = admin.roles.some((role) => role.cafe.id === cafeId)
    if (!hasAccess) {
      throw new Error("Access denied to this cafe")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's stats
    const [todayReservations, pendingReservations, availableTables, totalTables] = await Promise.all([
      prisma.reservation.count({
        where: {
          cafeId,
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.reservation.count({
        where: {
          cafeId,
          status: "pending",
        },
      }),
      prisma.table.count({
        where: {
          cafeId,
          isActive: true,
          status: "available",
        },
      }),
      prisma.table.count({
        where: {
          cafeId,
          isActive: true,
        },
      }),
    ])

    // Get recent reservations
    const recentReservations = await prisma.reservation.findMany({
      where: { cafeId },
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return {
      success: true,
      stats: {
        todayReservations,
        pendingReservations,
        availableTables,
        totalTables,
      },
      recentReservations: recentReservations.map((r) => ({
        id: r.id,
        reservationNumber: r.reservationNumber,
        guestName: r.guestName,
        date: r.date,
        time: r.time,
        guests: r.guests,
        status: r.status,
        table: r.table
          ? {
              number: r.table.number,
              zone: r.table.zone.name,
            }
          : null,
        createdAt: r.createdAt,
      })),
    }
  })

  // Get all reservations for admin
  .get("/reservations/:cafeId", async ({ admin, params, query }) => {
    const cafeId = params.cafeId
    const { status, date, limit = 50, offset = 0 } = query

    // Check access
    const hasAccess = admin.roles.some((role) => role.cafe.id === cafeId)
    if (!hasAccess) {
      throw new Error("Access denied to this cafe")
    }

    const where: any = { cafeId }

    if (status) {
      where.status = status
    }

    if (date) {
      const targetDate = new Date(date.toString())
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      where.date = {
        gte: targetDate,
        lt: nextDay,
      }
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit.toString()),
      skip: Number.parseInt(offset.toString()),
    })

    const total = await prisma.reservation.count({ where })

    return {
      success: true,
      reservations: reservations.map((r) => ({
        id: r.id,
        reservationNumber: r.reservationNumber,
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        date: r.date,
        time: r.time,
        guests: r.guests,
        status: r.status,
        specialRequests: r.specialRequests,
        table: r.table
          ? {
              id: r.table.id,
              number: r.table.number,
              zone: r.table.zone.name,
            }
          : null,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        limit: Number.parseInt(limit.toString()),
        offset: Number.parseInt(offset.toString()),
      },
    }
  })

  // Update reservation status
  .put(
    "/reservations/:reservationId",
    async ({ admin, params, body }) => {
      const { status, tableId, notes } = body

      const reservation = await prisma.reservation.findUnique({
        where: { id: params.reservationId },
        include: { cafe: true },
      })

      if (!reservation) {
        throw new Error("Reservation not found")
      }

      // Check access
      const hasAccess = admin.roles.some((role) => role.cafe.id === reservation.cafeId)
      if (!hasAccess) {
        throw new Error("Access denied")
      }

      const updateData: any = { status, notes }

      if (status === "confirmed" && !reservation.confirmedAt) {
        updateData.confirmedAt = new Date()
      }

      if (status === "seated" && !reservation.seatedAt) {
        updateData.seatedAt = new Date()
      }

      if (status === "completed" && !reservation.completedAt) {
        updateData.completedAt = new Date()
      }

      if (status === "cancelled" && !reservation.cancelledAt) {
        updateData.cancelledAt = new Date()
      }

      if (tableId) {
        updateData.tableId = tableId
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id: params.reservationId },
        data: updateData,
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          adminId: admin.id,
          cafeId: reservation.cafeId,
          action: "update",
          entity: "reservation",
          entityId: reservation.id,
          description: `Updated reservation ${reservation.reservationNumber} status to ${status}`,
          metadata: { oldStatus: reservation.status, newStatus: status },
        },
      })

      return {
        success: true,
        reservation: updatedReservation,
      }
    },
    {
      body: t.Object({
        status: t.String(),
        tableId: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )

  // Get tables for admin
  .get("/tables/:cafeId", async ({ admin, params }) => {
    const cafeId = params.cafeId

    // Check access
    const hasAccess = admin.roles.some((role) => role.cafe.id === cafeId)
    if (!hasAccess) {
      throw new Error("Access denied to this cafe")
    }

    const tables = await prisma.table.findMany({
      where: { cafeId },
      include: {
        zone: true,
      },
      orderBy: [{ zone: { sortOrder: "asc" } }, { number: "asc" }],
    })

    return {
      success: true,
      tables: tables.map((t) => ({
        id: t.id,
        number: t.number,
        seats: t.seats,
        minGuests: t.minGuests,
        maxGuests: t.maxGuests,
        location: t.location,
        features: t.features,
        status: t.status,
        isActive: t.isActive,
        zone: {
          id: t.zone.id,
          name: t.zone.name,
        },
      })),
    }
  })

  // Admin logout
  .post("/logout", async ({ cookie, jwt, setCookie }) => {
    const token = cookie["admin-token"]

    if (token) {
      try {
        const payload = await jwt.verify(token)

        await prisma.adminSession.deleteMany({
          where: { sessionToken: token },
        })
      } catch (error) {
        // Token invalid, continue with logout
      }
    }

    setCookie("admin-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    })

    return { success: true, message: "Logged out successfully" }
  })
