-- CreateEnum
CREATE TYPE "FinanceGroupRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "finance_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_group_members" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FinanceGroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_group_members_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateIndex
CREATE INDEX "finance_groups_ownerId_idx" ON "finance_groups"("ownerId");

-- CreateIndex
CREATE INDEX "finance_group_members_userId_idx" ON "finance_group_members"("userId");

-- AddForeignKey
ALTER TABLE "finance_groups" ADD CONSTRAINT "finance_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_group_members" ADD CONSTRAINT "finance_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "finance_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_group_members" ADD CONSTRAINT "finance_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
