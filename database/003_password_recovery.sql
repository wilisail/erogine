-- Reset links are issued only by an authenticated operator after an account-owner
-- request. The public application can consume a link, but cannot issue one.
CREATE TABLE "erogine"."auth_password_resets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    CONSTRAINT "auth_password_resets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "auth_password_resets_user_id_fkey" FOREIGN KEY ("user_id")
      REFERENCES "erogine"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "auth_password_resets_token_hash_key"
  ON "erogine"."auth_password_resets"("token_hash");
CREATE INDEX "auth_password_resets_user_id_idx"
  ON "erogine"."auth_password_resets"("user_id");
ALTER TABLE "erogine"."auth_password_resets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "erogine"."auth_password_resets" FROM PUBLIC, anon, authenticated;
