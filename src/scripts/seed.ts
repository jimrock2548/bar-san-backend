import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/utils"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create cafes
  const barsan = await prisma.cafe.upsert({
    where: { name: "BarSan" },
    update: {},
    create: {
      name: "BarSan",
      displayName: "BarSan.",
      description: "Modern cocktail bar with sophisticated atmosphere",
      address: "123 Sukhumvit Road, Bangkok",
      phone: "02-123-4567",
      email: "info@barsan.com",
      openingHours: {
        monday: { open: "17:00", close: "02:00" },
        tuesday: { open: "17:00", close: "02:00" },
        wednesday: { open: "17:00", close: "02:00" },
        thursday: { open: "17:00", close: "02:00" },
        friday: { open: "17:00", close: "02:00" },
        saturday: { open: "17:00", close: "02:00" },
        sunday: { open: "17:00", close: "02:00" },
      },
    },
  })

  const noir = await prisma.cafe.upsert({
    where: { name: "NOIR" },
    update: {},
    create: {
      name: "NOIR",
      displayName: "N O I R",
      description: "Dark and mysterious cocktail lounge",
      address: "456 Thonglor Road, Bangkok",
      phone: "02-765-4321",
      email: "info@noir.com",
      openingHours: {
        monday: { open: "18:00", close: "02:00" },
        tuesday: { open: "18:00", close: "02:00" },
        wednesday: { open: "18:00", close: "02:00" },
        thursday: { open: "18:00", close: "02:00" },
        friday: { open: "18:00", close: "03:00" },
        saturday: { open: "18:00", close: "03:00" },
        sunday: { open: "18:00", close: "02:00" },
      },
    },
  })

  // Create zones for BarSan
  const barsanZoneA = await prisma.zone.upsert({
    where: { cafeId_name: { cafeId: barsan.id, name: "Zone A" } },
    update: {},
    create: {
      cafeId: barsan.id,
      name: "Zone A",
      description: "Window seating area",
      capacity: 20,
      sortOrder: 1,
    },
  })

  const barsanZoneB = await prisma.zone.upsert({
    where: { cafeId_name: { cafeId: barsan.id, name: "Zone B" } },
    update: {},
    create: {
      cafeId: barsan.id,
      name: "Zone B",
      description: "Central dining area",
      capacity: 30,
      sortOrder: 2,
    },
  })

  // Create zones for NOIR
  const noirBarCounter = await prisma.zone.upsert({
    where: { cafeId_name: { cafeId: noir.id, name: "Bar Counter" } },
    update: {},
    create: {
      cafeId: noir.id,
      name: "Bar Counter",
      description: "Bar seating area",
      capacity: 12,
      sortOrder: 1,
    },
  })

  const noirCoupleTable = await prisma.zone.upsert({
    where: { cafeId_name: { cafeId: noir.id, name: "Couple Table" } },
    update: {},
    create: {
      cafeId: noir.id,
      name: "Couple Table",
      description: "Intimate seating for couples",
      capacity: 16,
      sortOrder: 2,
    },
  })

  const noirLargeGroup = await prisma.zone.upsert({
    where: { cafeId_name: { cafeId: noir.id, name: "Large Group" } },
    update: {},
    create: {
      cafeId: noir.id,
      name: "Large Group",
      description: "Tables for larger parties",
      capacity: 24,
      sortOrder: 3,
    },
  })

  // Create tables for BarSan
  const barsanTables = [
    { number: 1, seats: 2, zone: barsanZoneA, location: "ริมหน้าต่าง" },
    { number: 2, seats: 2, zone: barsanZoneA, location: "ริมหน้าต่าง" },
    { number: 3, seats: 4, zone: barsanZoneB, location: "กลางร้าน" },
    { number: 4, seats: 4, zone: barsanZoneB, location: "กลางร้าน" },
    { number: 5, seats: 6, zone: barsanZoneB, location: "มุมร้าน" },
  ]

  for (const table of barsanTables) {
    await prisma.table.upsert({
      where: { cafeId_number: { cafeId: barsan.id, number: table.number } },
      update: {},
      create: {
        cafeId: barsan.id,
        zoneId: table.zone.id,
        number: table.number,
        seats: table.seats,
        minGuests: 1,
        maxGuests: table.seats,
        location: table.location,
        features: table.location === "ริมหน้าต่าง" ? ["window_view"] : [],
        status: "available",
      },
    })
  }

  // Create tables for NOIR
  const noirTables = [
    { number: 1, seats: 2, zone: noirBarCounter, location: "Bar Counter" },
    { number: 2, seats: 2, zone: noirBarCounter, location: "Bar Counter" },
    { number: 3, seats: 4, zone: noirCoupleTable, location: "Couple Table" },
    { number: 4, seats: 4, zone: noirCoupleTable, location: "Couple Table" },
    { number: 5, seats: 6, zone: noirLargeGroup, location: "Large Group" },
    { number: 6, seats: 8, zone: noirLargeGroup, location: "Large Group" },
  ]

  for (const table of noirTables) {
    await prisma.table.upsert({
      where: { cafeId_number: { cafeId: noir.id, number: table.number } },
      update: {},
      create: {
        cafeId: noir.id,
        zoneId: table.zone.id,
        number: table.number,
        seats: table.seats,
        minGuests: 1,
        maxGuests: table.seats,
        location: table.location,
        features:
          table.location === "Bar Counter" ? ["bar_seating"] : table.location === "Couple Table" ? ["private"] : [],
        status: "available",
      },
    })
  }

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: {
      name: "super_admin",
      displayName: "Super Admin",
      description: "Full system access",
      permissions: {
        dashboard: { view: true, edit: true },
        reservations: { view: true, edit: true, delete: true },
        tables: { view: true, edit: true, delete: true },
        users: { view: true, edit: true, delete: true },
        admins: { view: true, edit: true, delete: true },
        roles: { view: true, edit: true, delete: true },
        logs: { view: true },
      },
      isSystem: true,
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Admin",
      description: "Cafe administration access",
      permissions: {
        dashboard: { view: true, edit: true },
        reservations: { view: true, edit: true, delete: true },
        tables: { view: true, edit: true },
        users: { view: true, edit: false },
        admins: { view: false },
        roles: { view: false },
        logs: { view: true },
      },
      isSystem: true,
    },
  })

  const staffRole = await prisma.role.upsert({
    where: { name: "staff" },
    update: {},
    create: {
      name: "staff",
      displayName: "Staff",
      description: "Basic staff access",
      permissions: {
        dashboard: { view: true, edit: false },
        reservations: { view: true, edit: true, delete: false },
        tables: { view: true, edit: false },
        users: { view: false },
        admins: { view: false },
        roles: { view: false },
        logs: { view: false },
      },
      isSystem: true,
    },
  })

  // Create admin users
  const superAdminPassword = await hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || "admin123456")

  const superAdmin = await prisma.admin.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      email: process.env.SUPER_ADMIN_EMAIL || "admin@barsan.com",
      passwordHash: superAdminPassword,
      fullName: "Super Administrator",
    },
  })

  const barsanAdmin = await prisma.admin.upsert({
    where: { username: "admin.barsan" },
    update: {},
    create: {
      username: "admin.barsan",
      email: "admin@barsan.com",
      passwordHash: superAdminPassword,
      fullName: "BarSan Admin",
    },
  })

  const noirAdmin = await prisma.admin.upsert({
    where: { username: "admin.noir" },
    update: {},
    create: {
      username: "admin.noir",
      email: "admin@noir.com",
      passwordHash: superAdminPassword,
      fullName: "NOIR Admin",
    },
  })

  // Assign roles
  await prisma.adminRole.upsert({
    where: {
      adminId_roleId_cafeId: {
        adminId: superAdmin.id,
        roleId: superAdminRole.id,
        cafeId: barsan.id,
      },
    },
    update: {},
    create: {
      adminId: superAdmin.id,
      roleId: superAdminRole.id,
      cafeId: barsan.id,
    },
  })

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId_cafeId: {
        adminId: superAdmin.id,
        roleId: superAdminRole.id,
        cafeId: noir.id,
      },
    },
    update: {},
    create: {
      adminId: superAdmin.id,
      roleId: superAdminRole.id,
      cafeId: noir.id,
    },
  })

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId_cafeId: {
        adminId: barsanAdmin.id,
        roleId: adminRole.id,
        cafeId: barsan.id,
      },
    },
    update: {},
    create: {
      adminId: barsanAdmin.id,
      roleId: adminRole.id,
      cafeId: barsan.id,
    },
  })

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId_cafeId: {
        adminId: noirAdmin.id,
        roleId: adminRole.id,
        cafeId: noir.id,
      },
    },
    update: {},
    create: {
      adminId: noirAdmin.id,
      roleId: adminRole.id,
      cafeId: noir.id,
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Admin Accounts Created:")
  console.log("- Username: superadmin | Password: admin123456 | Access: Both cafes")
  console.log("- Username: admin.barsan | Password: admin123456 | Access: BarSan only")
  console.log("- Username: admin.noir | Password: admin123456 | Access: NOIR only")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
