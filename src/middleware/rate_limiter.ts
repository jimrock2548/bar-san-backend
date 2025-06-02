import { Elysia } from "elysia"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export const rateLimiter = new Elysia().derive(({ request, set }) => {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  const windowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900000") // 15 minutes
  const maxRequests = Number.parseInt(process.env.RATE_LIMIT_MAX || "100")

  // Clean up old entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })

  // Check current IP
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs,
    }
  } else {
    store[ip].count++
  }

  // Check if limit exceeded
  if (store[ip].count > maxRequests) {
    set.status = 429
    throw new Error("Too many requests")
  }

  return {}
})
