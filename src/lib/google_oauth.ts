import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export class GoogleOAuthService {
  static getAuthUrl(state?: string) {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ]

    return client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state || "default",
      prompt: "consent",
    })
  }

  static async getTokens(code: string) {
    const { tokens } = await client.getToken(code)
    return tokens
  }

  static async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)

    if (!response.ok) {
      throw new Error("Failed to fetch user info from Google")
    }

    return response.json()
  }

  static async verifyIdToken(idToken: string) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    return ticket.getPayload()
  }
}
