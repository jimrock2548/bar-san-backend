import { format, addMinutes } from "date-fns"
import { th } from "date-fns/locale"

export function generateReservationNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `RSV${timestamp}${random}`
}

export function formatThaiDate(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: th })
}

export function isValidTimeSlot(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, mins, 0, 0)
  const newDate = addMinutes(date, minutes)
  return format(newDate, "HH:mm")
}

export function isTimeSlotAvailable(
  requestedTime: string,
  duration: number,
  existingReservations: Array<{ time: string; duration: number }>,
): boolean {
  const requestedStart = timeToMinutes(requestedTime)
  const requestedEnd = requestedStart + duration

  for (const reservation of existingReservations) {
    const existingStart = timeToMinutes(reservation.time)
    const existingEnd = existingStart + reservation.duration

    // Check for overlap
    if (
      (requestedStart >= existingStart && requestedStart < existingEnd) ||
      (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
      (requestedStart <= existingStart && requestedEnd >= existingEnd)
    ) {
      return false
    }
  }

  return true
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{9,10}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ""))
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "")
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function hashPassword(password: string): Promise<string> {
  const bcrypt = require("bcryptjs")
  return bcrypt.hash(password, 10)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require("bcryptjs")
  return bcrypt.compare(password, hash)
}
