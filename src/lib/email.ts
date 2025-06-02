import nodemailer from "nodemailer"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  static async sendEmail(options: EmailOptions) {
    if (!process.env.SMTP_HOST) {
      console.log("Email not configured, skipping send:", options.subject)
      return
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@barsan.com",
        ...options,
      })
      console.log("Email sent successfully to:", options.to)
    } catch (error) {
      console.error("Failed to send email:", error)
      throw error
    }
  }

  static async sendReservationConfirmation(
    email: string,
    reservationData: {
      reservationNumber: string
      guestName: string
      cafeName: string
      date: string
      time: string
      guests: number
    },
  ) {
    const html = `
      <h2>การจองสำเร็จ - ${reservationData.cafeName}</h2>
      <p>เรียน คุณ${reservationData.guestName}</p>
      <p>ขขอบคุณที่ทำการจองโต๊ะกับเรา</p>
      
      <h3>รายละเอียดการจอง:</h3>
      <ul>
        <li><strong>หมายเลขการจอง:</strong> ${reservationData.reservationNumber}</li>
        <li><strong>ร้าน:</strong> ${reservationData.cafeName}</li>
        <li><strong>วันที่:</strong> ${reservationData.date}</li>
        <li><strong>เวลา:</strong> ${reservationData.time}</li>
        <li><strong>จำนวนท่าน:</strong> ${reservationData.guests} ท่าน</li>
      </ul>
      
      <p>กรุณามาถึงร้านก่อนเวลา 5-10 นาที</p>
      <p>หากต้องการยกเลิกการจอง กรุณาแจ้งล่วงหน้าอย่างน้อย 2 ชั่วโมง</p>
    `

    await this.sendEmail({
      to: email,
      subject: `ยืนยันการจอง - ${reservationData.cafeName} (${reservationData.reservationNumber})`,
      html,
    })
  }

  static async sendReservationCancellation(
    email: string,
    reservationData: {
      reservationNumber: string
      guestName: string
      cafeName: string
    },
  ) {
    const html = `
      <h2>การยกเลิกการ��อง - ${reservationData.cafeName}</h2>
      <p>เรียน คุณ${reservationData.guestName}</p>
      <p>การจองหมายเลข ${reservationData.reservationNumber} ได้ถูกยกเลิกเรียบร้อยแล้ว</p>
      <p>หวังว่าจะได้ต้อนรับท่านในโอกาสต่อไป</p>
    `

    await this.sendEmail({
      to: email,
      subject: `ยกเลิกการจอง - ${reservationData.cafeName} (${reservationData.reservationNumber})`,
      html,
    })
  }
}
