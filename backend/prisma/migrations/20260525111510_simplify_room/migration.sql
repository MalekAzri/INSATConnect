/*
  Warnings:

  - You are about to drop the column `subject` on the `Room` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
