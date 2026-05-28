-- CreateTable
CREATE TABLE "AcademicDate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicDate_key_key" ON "AcademicDate"("key");
