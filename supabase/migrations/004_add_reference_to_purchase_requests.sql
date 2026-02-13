-- Referencia única de 5 dígitos para cada transferencia
ALTER TABLE public.purchase_requests
ADD COLUMN IF NOT EXISTS reference text;

CREATE UNIQUE INDEX IF NOT EXISTS purchase_requests_reference_key
  ON public.purchase_requests (reference)
  WHERE reference IS NOT NULL;

COMMENT ON COLUMN public.purchase_requests.reference IS 'Referencia de 5 dígitos para la transferencia (única por solicitud)';
