-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'LAWYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJETCED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportedItemType" AS ENUM ('DOCUMENT', 'ARTICLE', 'TEMPLATE', 'CHAT_MESSAGE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "role" "Role" NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "firebaseId" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone_number" TEXT,
    "business_name" TEXT,
    "business_industry" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "preferences" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lawyers" (
    "lawyer_id" INTEGER NOT NULL,
    "profile_bio" TEXT,
    "specialization" TEXT[],
    "credentials_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_document_url" TEXT,
    "rating" DECIMAL(2,1),
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("lawyer_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "document_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "document_title" TEXT NOT NULL,
    "analysis_outline" JSONB,
    "key_clauses" JSONB,
    "key_points" JSONB,
    "risk_assessment" JSONB,
    "original_filename" TEXT,
    "file_type" TEXT,
    "stored" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userUser_id" INTEGER,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "ai_chats" (
    "chat_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "document_id" INTEGER,
    "session_id" UUID NOT NULL,
    "user_message" TEXT NOT NULL,
    "ai_response" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "chats" (
    "chat_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lawyer_id" INTEGER NOT NULL,
    "status" "ChatStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "message_id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "message_text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "legal_articles" (
    "article_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_url" TEXT,
    "published_date" TIMESTAMP(3),
    "category" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_articles_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "legal_education_resources" (
    "resource_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_url" TEXT NOT NULL,
    "resource_type" TEXT,
    "topic" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_education_resources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "consultation_notes" (
    "note_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lawyer_id" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "related_document_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("note_id")
);

-- CreateTable
CREATE TABLE "lawyer_ratings" (
    "rating_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lawyer_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lawyer_ratings_pkey" PRIMARY KEY ("rating_id")
);

-- CreateTable
CREATE TABLE "admin_reports" (
    "report_id" SERIAL NOT NULL,
    "reported_by_user_id" INTEGER,
    "reported_item_type" "ReportedItemType" NOT NULL,
    "reported_item_id" INTEGER,
    "report_reason" TEXT,
    "report_status" TEXT DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseId_key" ON "users"("firebaseId");

-- AddForeignKey
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("lawyer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_related_document_id_fkey" FOREIGN KEY ("related_document_id") REFERENCES "documents"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_ratings" ADD CONSTRAINT "lawyer_ratings_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("lawyer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_ratings" ADD CONSTRAINT "lawyer_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_reports" ADD CONSTRAINT "admin_reports_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
