/*
  Warnings:

  - You are about to drop the `Teacher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Teacher_email_key";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "targetUserId" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Teacher";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeworkSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentName" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AcademicCalendarConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dsRemise" TEXT NOT NULL,
    "examRemise" TEXT NOT NULL,
    "dsAffichage" TEXT NOT NULL,
    "examAffichage" TEXT NOT NULL,
    "sem1Deliberation" TEXT NOT NULL,
    "sem2Deliberation" TEXT NOT NULL,
    "deliberationFinale" TEXT NOT NULL,
    "s1_ds" TEXT,
    "s1_exam" TEXT,
    "s1_grades_ds" TEXT,
    "s1_publish_ds" TEXT,
    "s1_grades_exam" TEXT,
    "s1_publish_exam" TEXT,
    "s1_delib" TEXT,
    "s2_ds" TEXT,
    "s2_exam" TEXT,
    "s2_grades_ds" TEXT,
    "s2_publish_ds" TEXT,
    "s2_grades_exam" TEXT,
    "s2_publish_exam" TEXT,
    "s2_delib" TEXT,
    "end_year" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AcademicCalendarConfig" ("createdAt", "deliberationFinale", "dsAffichage", "dsRemise", "end_year", "examAffichage", "examRemise", "id", "s1_delib", "s1_ds", "s1_exam", "s1_grades_ds", "s1_grades_exam", "s1_publish_ds", "s1_publish_exam", "s2_delib", "s2_ds", "s2_exam", "s2_grades_ds", "s2_grades_exam", "s2_publish_ds", "s2_publish_exam", "sem1Deliberation", "sem2Deliberation", "updatedAt", "updatedBy") SELECT "createdAt", "deliberationFinale", "dsAffichage", "dsRemise", "end_year", "examAffichage", "examRemise", "id", "s1_delib", "s1_ds", "s1_exam", "s1_grades_ds", "s1_grades_exam", "s1_publish_ds", "s1_publish_exam", "s2_delib", "s2_ds", "s2_exam", "s2_grades_ds", "s2_grades_exam", "s2_publish_ds", "s2_publish_exam", "sem1Deliberation", "sem2Deliberation", "updatedAt", "updatedBy" FROM "AcademicCalendarConfig";
DROP TABLE "AcademicCalendarConfig";
ALTER TABLE "new_AcademicCalendarConfig" RENAME TO "AcademicCalendarConfig";
CREATE TABLE "new_GradeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherName" TEXT NOT NULL,
    "teacherEmail" TEXT,
    "targetYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "examType" TEXT NOT NULL DEFAULT 'DS',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "entries" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "publishedBy" TEXT,
    "publishedAt" DATETIME,
    "publicationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GradeSubmission" ("createdAt", "entries", "id", "publicationId", "publishedAt", "publishedBy", "semester", "status", "summary", "targetYear", "teacherEmail", "teacherName", "title", "updatedAt", "validatedAt", "validatedBy") SELECT "createdAt", "entries", "id", "publicationId", "publishedAt", "publishedBy", coalesce("semester", '') AS "semester", "status", "summary", "targetYear", "teacherEmail", "teacherName", "title", "updatedAt", "validatedAt", "validatedBy" FROM "GradeSubmission";
DROP TABLE "GradeSubmission";
ALTER TABLE "new_GradeSubmission" RENAME TO "GradeSubmission";
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'announcement',
    "author" TEXT NOT NULL DEFAULT '',
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Post_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "id", "roomId", "type") SELECT "content", "id", "roomId", "type" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE TABLE "new_Publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "targetYear" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSizeBytes" INTEGER,
    "grades" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Publication" ("author", "category", "content", "createdAt", "fileName", "filePath", "fileSizeBytes", "grades", "id", "targetYear", "title", "updatedAt") SELECT "author", "category", "content", "createdAt", "fileName", "filePath", "fileSizeBytes", "grades", "id", "targetYear", "title", "updatedAt" FROM "Publication";
DROP TABLE "Publication";
ALTER TABLE "new_Publication" RENAME TO "Publication";
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "targetYear" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL
);
INSERT INTO "new_Room" ("id", "name", "targetYear", "teacherId") SELECT "id", "name", "targetYear", "teacherId" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
