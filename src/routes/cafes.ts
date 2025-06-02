import { Elysia } from "elysia"
import { prisma } from "../lib/prisma"
import { isTimeSlotAvailable } from "../lib/utils"

export const cafeRoutes = new Elysia({ prefix: "/cafes" })

  // Get all active cafes
  .get("/", async () => {
    const cafes = await prisma.cafe.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        address: true,
        phone: true,
        website: true,
        image: true,
        openingHours: true,
      },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      cafes,
    }
  })

  // Get cafe details
  .get("/:cafeId", async ({ params }) => {
    const cafe = await prisma.cafe.findFirst({
      where: {
        id: params.cafeId,
        isActive: true,
      },
      include: {
        zones: {
          where: { isActive: true },
          include: {
            tables: {
              where: { isActive: true },
              select: {
                id: true,
                number: true,
                seats: true,
                minGuests: true,
                maxGuests: true,
                features: true,
                status: true,
              },
              orderBy: { number: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!cafe) {
      throw new Error("Cafe not found")
    }

    return {
      success: true,
      cafe,
    }
  })

  // Get available time slots for a specific date
  .get("/:cafeId/availability", async ({ params, query }) => {
    const { date, guests } = query

    if (!date) {
      throw new Error("Date is required")
    }

    const guestCount = guests ? Number.parseInt(guests.toString()) : 1

    // Get cafe with opening hours
    const cafe = await prisma.cafe.findFirst({
      where: {
        id: params.cafeId,
        isActive: true,
      },
    })

    if (!cafe) {
      throw new Error("Cafe not found")
    }

    // Get existing reservations for the date
    const existingReservations = await prisma.reservation.findMany({
      where: {
        cafeId: params.cafeId,
        date: new Date(date.toString()),
        status: { in: ["pending", "confirmed", "seated"] },
      },
      select: { time: true, duration: true },
    })

    // Get suitable tables
    const suitableTables = await prisma.table.findMany({
      where: {
        cafeId: params.cafeId,
        isActive: true,
        status: "available",
        minGuests: { lte: guestCount },
        maxGuests: { gte: guestCount },
      },
      include: {
        zone: {
          select: { name: true },
        },
      },
    })

    // Generate time slots (example: 17:00 - 23:00, 30-minute intervals)
    const timeSlots = []
    for (let hour = 17; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 23 && minute > 0) break // Stop at 23:00

        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const isAvailable = isTimeSlotAvailable(time, 120, existingReservations)

        timeSlots.push({
          time,
          available: isAvailable && suitableTables.length > 0,
          availableTables: isAvailable ? suitableTables.length : 0,
        })
      }
    }

    return {
      success: true,
      date: date.toString(),
      guests: guestCount,
      timeSlots,
      zones:
        cafe.zones?.map((zone) => ({
          id: zone.id,
          name: zone.name,
          availableTables: suitableTables.filter((t) => t.zone.name === zone.name).length,
        })) || [],
    }
  })

  // Get tables for a specific zone
  .get("/:cafeId/zones/:zoneId/tables", async ({ params, query }) => {
    const { date, time, guests } = query

    const guestCount = guests ? Number.parseInt(guests.toString()) : 1

    const where: any = {
      cafeId: params.cafeId,
      zoneId: params.zoneId,
      isActive: true,
      minGuests: { lte: guestCount },
      maxGuests: { gte: guestCount },
    }

    // If date and time provided, check availability
    if (date && time) {
      const existingReservations = await prisma.reservation.findMany({
        where: {
          cafeId: params.cafeId,
          date: new Date(date.toString()),
          time: time.toString(),
          status: { in: ["pending", "confirmed", "seated"] },
        },
        select: { tableId: true },
      })

      const bookedTableIds = existingReservations.filter((r) => r.tableId).map((r) => r.tableId)

      if (bookedTableIds.length > 0) {
        where.id = { notIn: bookedTableIds }
      }
    }

    const tables = await prisma.table.findMany({
      where,
      include: {
        zone: {
          select: { name: true },
        },
      },
      orderBy: { number: "asc" },
    })

    return {
      success: true,
      tables: tables.map((table) => ({
        id: table.id,
        number: table.number,
        seats: table.seats,
        minGuests: table.minGuests,
        maxGuests: table.maxGuests,
        location: table.location,
        features: table.features,
        zone: table.zone.name,
        available: table.status === "available",
      })),
    }
  })
