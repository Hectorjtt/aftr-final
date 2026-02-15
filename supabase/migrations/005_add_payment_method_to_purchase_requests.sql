-- Método de pago: 'transfer' (transferencia) o 'card' (tarjeta Stripe)
ALTER TABLE public.purchase_requests
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'transfer';

COMMENT ON COLUMN public.purchase_requests.payment_method IS 'transfer = transferencia bancaria, card = pago con tarjeta Stripe';

-- Para idempotencia: no crear dos solicitudes por la misma sesión Stripe
ALTER TABLE public.purchase_requests
ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;

COMMENT ON COLUMN public.purchase_requests.stripe_session_id IS 'Stripe Checkout Session ID cuando payment_method = card';
