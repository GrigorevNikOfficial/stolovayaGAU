CREATE TABLE "users"(
    "id" BIGINT NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "mail" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "users" ADD PRIMARY KEY("id");
ALTER TABLE
    "users" ADD CONSTRAINT "users_phone_unique" UNIQUE("phone");
ALTER TABLE
    "users" ADD CONSTRAINT "users_mail_unique" UNIQUE("mail");
CREATE TABLE "orders"(
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_amount" DECIMAL(10, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NULL
);
ALTER TABLE
    "orders" ADD PRIMARY KEY("id");
CREATE TABLE "deliveries"(
    "id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "tracking_number" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "delivery_date" TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NULL
);
ALTER TABLE
    "deliveries" ADD PRIMARY KEY("id");
ALTER TABLE
    "deliveries" ADD CONSTRAINT "deliveries_order_id_unique" UNIQUE("order_id");
ALTER TABLE
    "deliveries" ADD CONSTRAINT "deliveries_tracking_number_unique" UNIQUE("tracking_number");
CREATE TABLE "order_items"(
    "id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "item_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT '1'
);
ALTER TABLE
    "order_items" ADD CONSTRAINT "order_items_order_id_item_id_unique" UNIQUE("order_id", "item_id");
ALTER TABLE
    "order_items" ADD PRIMARY KEY("id");
CREATE TABLE "items"(
    "id" BIGINT NOT NULL,
    "uniq_nom" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "category" VARCHAR(100) NULL,
    "cal" BIGINT NULL,
    "number_pribors" BIGINT NULL,
    "time_create" TIMESTAMP(0) WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    "image_url" VARCHAR(500) NULL
);
ALTER TABLE
    "items" ADD PRIMARY KEY("id");
ALTER TABLE
    "items" ADD CONSTRAINT "items_uniq_nom_unique" UNIQUE("uniq_nom");
ALTER TABLE
    "orders" ADD CONSTRAINT "orders_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "deliveries" ADD CONSTRAINT "deliveries_order_id_foreign" FOREIGN KEY("order_id") REFERENCES "orders"("id");
ALTER TABLE
    "order_items" ADD CONSTRAINT "order_items_order_id_foreign" FOREIGN KEY("order_id") REFERENCES "orders"("id");
ALTER TABLE
    "order_items" ADD CONSTRAINT "order_items_item_id_foreign" FOREIGN KEY("item_id") REFERENCES "items"("id");