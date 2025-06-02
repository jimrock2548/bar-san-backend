import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"
import { staticPlugin } from "@elysiajs/static"

// Routes
import { authRoutes } from "./routes/auth"
import { adminRoutes } from "./routes/admin"
import { reservationRoutes } from "./routes/reservations"
import { cafeRoutes } from "./routes/cafes"
import { userRoutes } from "./routes/users"

// Middleware
import { errorHandler } from "./middleware/error-handler"
import { rateLimiter } from "./middleware/rate-limiter"
import { logger } from "./middleware/logger"

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "BarSan & NOIR API",
          version: "1.0.0",
          description: "Table booking system API for BarSan and NOIR restaurants",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Reservations", description: "Reservation management" },
          { name: "Cafes", description: "Cafe and table management" },
          { name: "Admin", description: "Admin panel endpoints" },
          { name: "Users", description: "User management" },
        ],
      },
    }),
  )
  .use(
    staticPlugin({
      assets: "uploads",
      prefix: "/uploads",
    }),
  )
  .use(logger)
  .use(rateLimiter)
  .use(errorHandler)

  // Health check
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }))

  // API Routes
  .group("/api", (app) => app.use(authRoutes).use(adminRoutes).use(reservationRoutes).use(cafeRoutes).use(userRoutes))

  .listen(process.env.PORT || 3001)

console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3001}`)
console.log(`📚 API Documentation: http://localhost:${process.env.PORT || 3001}/swagger`)
