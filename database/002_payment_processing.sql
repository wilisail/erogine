-- A network timeout is not proof that a payment failed. Preserve that uncertainty.
ALTER TABLE erogine.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE erogine.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'CANCELED', 'FAILED'));
