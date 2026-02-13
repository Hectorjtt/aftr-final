-- Añade columnas email y phone a la tabla user_roles
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase (Dashboard → SQL Editor)

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Opcional: comentarios para documentar las columnas
COMMENT ON COLUMN public.user_roles.email IS 'Correo con el que se registró el usuario';
COMMENT ON COLUMN public.user_roles.phone IS 'Teléfono del usuario';
