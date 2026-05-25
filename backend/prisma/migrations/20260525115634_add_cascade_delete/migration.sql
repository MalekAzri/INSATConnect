-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Homework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Homework_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Homework" ("deadline", "description", "id", "roomId", "title") SELECT "deadline", "description", "id", "roomId", "title" FROM "Homework";
DROP TABLE "Homework";
ALTER TABLE "new_Homework" RENAME TO "Homework";
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'announcement',
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Post_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "id", "roomId", "type") SELECT "content", "id", "roomId", "type" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
