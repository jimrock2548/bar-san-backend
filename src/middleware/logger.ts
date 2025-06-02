import { Elysia } from "elysia"

export const logger = new Elysia()
  .onRequest(({ request, path }) => {
    const timestamp = new Date().toISOString()
    const method = request.method
    const url = path
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    console.log(`[${timestamp}] ${method} ${url} - ${ip}`)
  })
  .onResponse(({ request, path, set }) => {
    const timestamp = new Date().toISOString()
    const method = request.method
    const url = path
    const status = set.status || 200

    console.log(`[${timestamp}] ${method} ${url} - ${status}`)
  })
