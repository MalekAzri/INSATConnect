-- CreateTable
CREATE TABLE IF NOT EXISTS "Publication" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AcademicCalendarConfig" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GradeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherName" TEXT NOT NULL,
    "teacherEmail" TEXT,
    "targetYear" TEXT NOT NULL,
    "semester" TEXT,
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "targetYear" TEXT,
    "data" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
