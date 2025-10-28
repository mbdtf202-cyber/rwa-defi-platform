-- Add custody transactions table
CREATE TABLE IF NOT EXISTS "custody_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fireblocks_id" TEXT NOT NULL UNIQUE,
    "asset_id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tx_hash" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create indexes
CREATE INDEX "custody_transactions_fireblocks_id_idx" ON "custody_transactions"("fireblocks_id");
CREATE INDEX "custody_transactions_status_idx" ON "custody_transactions"("status");
CREATE INDEX "custody_transactions_created_at_idx" ON "custody_transactions"("created_at");
