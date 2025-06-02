import { Elysia, t } from "elysia"
import { prisma } from "../lib/prisma"
import { authMiddleware } from "../middleware/auth"
import {
  generateReservationNumber,
  isValidTimeSlot,
  isTimeSlotAvailable,
  validateEmail,
  validatePhone,
  sanitizeString,
} from "../lib/utils"
import { EmailService } from "../lib/email"

export const reservationRoutes = new Elysia({ prefix: "/reservations" })

  // Create temporary reservation (15-minute hold)
  .post(
    "/temp",
    async ({ body }) => {
      const { cafeId, date, time, guests, zoneId, sessionId } = body

      if (!isValidTimeSlot(time)) {
        throw new Error("Invalid time format")
      }

      // Check if cafe exists and is active
      const cafe = await prisma.cafe.findFirst({
        where: { id: cafeId, isActive: true },
      })

      if (!cafe) {
        throw new Error("Cafe not found or inactive")
      }

      // Check for existing temp reservation with same session
      await prisma.temporaryReservation.deleteMany({
        where: { sessionId },
      })

      // Create temporary reservation
      const tempReservation = await prisma.temporaryReservation.create({
        data: {
          cafeId,
          date: new Date(date),
          time,
          guests,
          zoneId,
          sessionId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      })

      return {
        success: true,
        tempReservation: {
          id: tempReservation.id,
          expiresAt: tempReservation.expiresAt,
        },
      }
    },
    {
      body: t.Object({
        cafeId: t.String(),
        date: t.String(),
        time: t.String(),
        guests: t.Number({ minimum: 1, maximum: 20 }),
        zoneId: t.Optional(t.String()),
        sessionId: t.String(),
      }),
    },
  )

  // Create actual reservation
  .post(
    "/",
    async ({ body }) => {
      const { tempReservationId, guestName, guestEmail, guestPhone, specialRequests, userId } = body

      if (!validateEmail(guestEmail)) {
        throw new Error("Invalid email format")
      }

      if (!validatePhone(guestPhone)) {
        throw new Error("Invalid phone format")
      }

      // Get temporary reservation
      const tempReservation = await prisma.temporaryReservation.findUnique({
        where: { id: tempReservationId },
        include: { cafe: true },
      })

      if (!tempReservation) {
        throw new Error("Temporary reservation not found or expired")
      }

      if (tempReservation.expiresAt < new Date()) {
        await prisma.temporaryReservation.delete({
          where: { id: tempReservationId },
        })
        throw new Error("Temporary reservation expired")
      }

      // Check for conflicts with existing reservations
      const existingReservations = await prisma.reservation.findMany({
        where: {
          cafeId: tempReservation.cafeId,
          date: tempReservation.date,
          status: { in: ["pending", "confirmed", "seated"] },
        },
        select: { time: true, duration: true },
      })

      if (!isTimeSlotAvailable(tempReservation.time, 120, existingReservations)) {
        throw new Error("Time slot no longer available")
      }

      // Create reservation
      const reservationNumber = generateReservationNumber()

      const reservation = await prisma.reservation.create({
        data: {
          reservationNumber,
          userId: userId || null,
          cafeId: tempReservation.cafeId,
          guestName: sanitizeString(guestName),
          guestEmail: guestEmail.toLowerCase(),
          guestPhone: guestPhone.replace(/[-\s]/g, ""),
          date: tempReservation.date,
          time: tempReservation.time,
          guests: tempReservation.guests,
          specialRequests: specialRequests ? sanitizeString(specialRequests) : null,
          status: "pending",
        },
        include: {
          cafe: true,
        },
      })

      // Delete temporary reservation
      await prisma.temporaryReservation.delete({
        where: { id: tempReservationId },
      })

      // Send confirmation email
      try {
        await EmailService.sendReservationConfirmation(guestEmail, {
          reservationNumber,
          guestName,
          cafeName: reservation.cafe.displayName,
          date: reservation.date.toLocaleDateString("th-TH"),
          time: reservation.time,
          guests: reservation.guests,
        })
      } catch (error) {
        console.error("Failed to send confirmation email:", error)
      }

      return {
        success: true,
        reservation: {
          id: reservation.id,
          reservationNumber: reservation.reservationNumber,
          status: reservation.status,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
          cafe: {
            name: reservation.cafe.name,
            displayName: reservation.cafe.displayName,
          },
        },
      }
    },
    {
      body: t.Object({
        tempReservationId: t.String(),
        guestName: t.String({ minLength: 2 }),
        guestEmail: t.String({ format: "email" }),
        guestPhone: t.String({ minLength: 9 }),
        specialRequests: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
    },
  )

  // Get user's reservations
  .use(authMiddleware)
  .get("/my", async ({ user, query }) => {
    const { status, limit = 10, offset = 0 } = query

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        cafe: {
          select: {
            name: true,
            displayName: true,
            address: true,
            phone: true,
          },
        },
        table: {
          select: {
            number: true,
            zone: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit.toString()),
      skip: Number.parseInt(offset.toString()),
    })

    return {
      success: true,
      reservations: reservations.map((r) => ({
        id: r.id,
        reservationNumber: r.reservationNumber,
        status: r.status,
        date: r.date,
        time: r.time,
        guests: r.guests,
        specialRequests: r.specialRequests,
        cafe: r.cafe,
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

  // Get reservation by number
  .get("/:reservationNumber", async ({ params }) => {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationNumber: params.reservationNumber },
      include: {
        cafe: {
          select: {
            name: true,
            displayName: true,
            address: true,
            phone: true,
          },
        },
        table: {
          select: {
            number: true,
            zone: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    return {
      success: true,
      reservation: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        guestPhone: reservation.guestPhone,
        status: reservation.status,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        specialRequests: reservation.specialRequests,
        cafe: reservation.cafe,
        table: reservation.table
          ? {
              number: reservation.table.number,
              zone: reservation.table.zone.name,
            }
          : null,
        createdAt: reservation.createdAt,
      },
    }
  })

  // Cancel reservation
  .delete(
    "/:reservationNumber",
    async ({ params, body }) => {
      const { email } = body

      const reservation = await prisma.reservation.findFirst({
        where: {
          reservationNumber: params.reservationNumber,
          guestEmail: email.toLowerCase(),
          status: { in: ["pending", "confirmed"] },
        },
        include: { cafe: true },
      })

      if (!reservation) {
        throw new Error("Reservation not found or cannot be cancelled")
      }

      // Check if cancellation is allowed (at least 2 hours before)
      const reservationDateTime = new Date(reservation.date)
      const [hours, minutes] = reservation.time.split(":").map(Number)
      reservationDateTime.setHours(hours, minutes)

      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)

      if (reservationDateTime < twoHoursFromNow) {
        throw new Error("Cannot cancel reservation less than 2 hours before the scheduled time")
      }

      // Update reservation status
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      })

      // Send cancellation email
      try {
        await EmailService.sendReservationCancellation(reservation.guestEmail, {
          reservationNumber: reservation.reservationNumber,
          guestName: reservation.guestName,
          cafeName: reservation.cafe.displayName,
        })
      } catch (error) {
        console.error("Failed to send cancellation email:", error)
      }

      return {
        success: true,
        message: "Reservation cancelled successfully",
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    },
  )
