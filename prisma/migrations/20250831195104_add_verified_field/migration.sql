-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "address" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "verifiedUser" TEXT NOT NULL DEFAULT 'No'
);
INSERT INTO "new_User" ("address", "city", "email", "id", "name", "password", "phone", "postalCode", "role") SELECT "address", "city", "email", "id", "name", "password", "phone", "postalCode", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
