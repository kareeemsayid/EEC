-- Create missing tables for EEC platform (PostgreSQL)
-- These tables support notifications, activity logging, and pinned items

-- UserNotifications table
CREATE TABLE IF NOT EXISTS "UserNotifications" (
    id SERIAL PRIMARY KEY,
    "userEmail" VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    "linkUrl" VARCHAR(500) NULL,
    "readAt" TIMESTAMP WITH TIME ZONE NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(50) DEFAULT 'system',
    title VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS "IX_UserNotifications_Email" ON "UserNotifications"("userEmail");
CREATE INDEX IF NOT EXISTS "IX_UserNotifications_CreatedAt" ON "UserNotifications"("createdAt" DESC);

-- ActivityLog table for tracking user actions
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    id SERIAL PRIMARY KEY,
    "userEmail" VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NULL,
    "entityId" VARCHAR(100) NULL,
    details TEXT NULL,
    "ipAddress" VARCHAR(50) NULL,
    "userAgent" VARCHAR(500) NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_ActivityLog_Email" ON "ActivityLog"("userEmail");
CREATE INDEX IF NOT EXISTS "IX_ActivityLog_CreatedAt" ON "ActivityLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_ActivityLog_Entity" ON "ActivityLog"("entityType", "entityId");

-- PinnedItems table
CREATE TABLE IF NOT EXISTS "PinnedItems" (
    id SERIAL PRIMARY KEY,
    "userEmail" VARCHAR(255) NOT NULL,
    "itemType" VARCHAR(20) NOT NULL,
    "itemId" INTEGER NOT NULL,
    "pinnedDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "UQ_PinnedItems_User_Item" UNIQUE("userEmail", "itemType", "itemId")
);

CREATE INDEX IF NOT EXISTS "IX_PinnedItems_Email" ON "PinnedItems"("userEmail");

-- RelocationSequence table for tracking relocation ID sequences
CREATE TABLE IF NOT EXISTS "RelocationSequence" (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(10) DEFAULT 'RELOC',
    "lastNumber" INTEGER DEFAULT 0,
    year INTEGER NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sequence if not exists
INSERT INTO "RelocationSequence" (prefix, "lastNumber", year) 
SELECT 'RELOC', 0, EXTRACT(YEAR FROM NOW())
WHERE NOT EXISTS (SELECT 1 FROM "RelocationSequence" WHERE prefix = 'RELOC');

-- CaseUpdates table for case timeline
CREATE TABLE IF NOT EXISTS "CaseUpdates" (
    id SERIAL PRIMARY KEY,
    "caseId" INTEGER NULL,
    "caseNumber" VARCHAR(50) NULL,
    "updateType" VARCHAR(100) NOT NULL,
    "updatedBy" VARCHAR(255) NULL,
    "updatedByEmail" VARCHAR(255) NULL,
    "updateDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updateNotes" TEXT NULL
);

CREATE INDEX IF NOT EXISTS "IX_CaseUpdates_CaseId" ON "CaseUpdates"("caseId");
CREATE INDEX IF NOT EXISTS "IX_CaseUpdates_CaseNumber" ON "CaseUpdates"("caseNumber");
CREATE INDEX IF NOT EXISTS "IX_CaseUpdates_Date" ON "CaseUpdates"("updateDate" DESC);
