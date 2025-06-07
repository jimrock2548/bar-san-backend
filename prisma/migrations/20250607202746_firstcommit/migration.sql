-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email'
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "full_name" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "password_hash" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "image" TEXT,
    "opening_hours" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL,
    "min_guests" INTEGER NOT NULL DEFAULT 1,
    "max_guests" INTEGER NOT NULL,
    "location" TEXT,
    "features" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'available',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_reservations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "cafe_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "zone_id" TEXT,
    "table_id" TEXT,
    "session_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "reservation_number" TEXT NOT NULL,
    "user_id" TEXT,
    "cafe_id" TEXT NOT NULL,
    "table_id" TEXT,
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_phone" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 120,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "special_requests" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "confirmed_at" TIMESTAMP(3),
    "seated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "cafe_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "cafe_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "cafes_name_key" ON "cafes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zones_cafe_id_name_key" ON "zones"("cafe_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tables_cafe_id_number_key" ON "tables"("cafe_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reservation_number_key" ON "reservations"("reservation_number");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_session_token_key" ON "admin_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_admin_id_role_id_cafe_id_key" ON "admin_roles"("admin_id", "role_id", "cafe_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_reservations" ADD CONSTRAINT "temporary_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_reservations" ADD CONSTRAINT "temporary_reservations_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
