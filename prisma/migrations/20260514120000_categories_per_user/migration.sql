-- DropIndex
DROP INDEX "Category_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_code_key" ON "Category"("userId", "code");
