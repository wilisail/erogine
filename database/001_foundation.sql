-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "erogine";

-- CreateTable
CREATE TABLE "erogine"."users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erogine"."auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erogine"."auth_refresh_tokens" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erogine"."orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checkout_key" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "total_cents" INTEGER NOT NULL,
    "paypal_order_id" VARCHAR(64),
    "paypal_capture_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erogine"."order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "erogine"."users"("email");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "erogine"."auth_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_token_hash_key" ON "erogine"."auth_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_session_id_idx" ON "erogine"."auth_refresh_tokens"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkout_key_key" ON "erogine"."orders"("checkout_key");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paypal_order_id_key" ON "erogine"."orders"("paypal_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paypal_capture_id_key" ON "erogine"."orders"("paypal_capture_id");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "erogine"."orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "erogine"."order_items"("order_id");

-- AddForeignKey
ALTER TABLE "erogine"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "erogine"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erogine"."auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "erogine"."auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erogine"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "erogine"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erogine"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "erogine"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Private application schema: only the server runtime role has access.
REVOKE ALL ON SCHEMA erogine FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA erogine TO erogine_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erogine TO erogine_app;

ALTER TABLE erogine.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING','PAID','CANCELED','FAILED'));
ALTER TABLE erogine.orders ADD CONSTRAINT orders_currency_check CHECK (currency = 'USD');
ALTER TABLE erogine.orders ADD CONSTRAINT orders_total_check CHECK (total_cents >= 0);
ALTER TABLE erogine.order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity BETWEEN 1 AND 99);
ALTER TABLE erogine.order_items ADD CONSTRAINT order_items_price_check CHECK (unit_price_cents >= 0);

ALTER TABLE erogine.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY erogine_server_only ON erogine.users TO erogine_app USING (true) WITH CHECK (true);
ALTER TABLE erogine.auth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY erogine_server_only ON erogine.auth_sessions TO erogine_app USING (true) WITH CHECK (true);
ALTER TABLE erogine.auth_refresh_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY erogine_server_only ON erogine.auth_refresh_tokens TO erogine_app USING (true) WITH CHECK (true);
ALTER TABLE erogine.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY erogine_server_only ON erogine.orders TO erogine_app USING (true) WITH CHECK (true);
ALTER TABLE erogine.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY erogine_server_only ON erogine.order_items TO erogine_app USING (true) WITH CHECK (true);
