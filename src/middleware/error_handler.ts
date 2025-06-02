import { Elysia } from "elysia"

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  console.error("Error:", error)

  switch (code) {
    case "VALIDATION":
      set.status = 400
      return {
        success: false,
        error: "Validation Error",
        message: error.message,
        details: error.validator?.Errors ? Array.from(error.validator.Errors) : undefined,
      }

    case "NOT_FOUND":
      set.status = 404
      return {
        success: false,
        error: "Not Found",
        message: "The requested resource was not found",
      }

    case "PARSE":
      set.status = 400
      return {
        success: false,
        error: "Parse Error",
        message: "Invalid request format",
      }

    default:
      // Handle custom errors
      if (error.message.includes("Invalid credentials")) {
        set.status = 401
        return {
          success: false,
          error: "Authentication Error",
          message: "Invalid credentials",
        }
      }

      if (error.message.includes("Unauthorized")) {
        set.status = 401
        return {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        }
      }

      if (error.message.includes("Forbidden")) {
        set.status = 403
        return {
          success: false,
          error: "Forbidden",
          message: "Insufficient permissions",
        }
      }

      if (error.message.includes("already exists")) {
        set.status = 409
        return {
          success: false,
          error: "Conflict",
          message: error.message,
        }
      }

      // Default server error
      set.status = 500
      return {
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
      }
  }
})
