-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'coach', 'admin');

-- CreateEnum
CREATE TYPE "EmotionType" AS ENUM ('ANXIOUS', 'SAD', 'ANGRY', 'LONELY', 'OVERWHELMED', 'HOPEFUL', 'NUMB', 'CONFUSED');

-- CreateEnum
CREATE TYPE "IntensityLevel" AS ENUM ('low', 'med', 'high');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('en', 'hi', 'gu');

-- CreateEnum
CREATE TYPE "FlagLevel" AS ENUM ('safe', 'concerning', 'crisis');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('HEAR_YOU', 'NOT_ALONE', 'STRENGTH', 'WILL_PASS');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('pending', 'active', 'completed', 'declined');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'busy', 'away');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'resource');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name_pool" TEXT[],
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" VARCHAR(280) NOT NULL,
    "display_name" TEXT NOT NULL,
    "emotion" "EmotionType" NOT NULL,
    "intensity" "IntensityLevel" NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_level" "FlagLevel" NOT NULL DEFAULT 'safe',
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reaction_type" "ReactionType" NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bio" VARCHAR(200) NOT NULL,
    "specializations" TEXT[],
    "languages" TEXT[],
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'available',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "sessions_count" INTEGER NOT NULL DEFAULT 0,
    "invite_token" TEXT,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'pending',
    "context_message" TEXT,
    "rating" INTEGER,
    "coach_notes" TEXT DEFAULT '',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionJournal" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emotion" "EmotionType" NOT NULL,
    "intensity" "IntensityLevel" NOT NULL,
    "post_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_post_id_user_id_key" ON "Reaction"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_user_id_key" ON "Coach"("user_id");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionJournal" ADD CONSTRAINT "EmotionJournal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionJournal" ADD CONSTRAINT "EmotionJournal_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
