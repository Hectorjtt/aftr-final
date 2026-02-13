-- 1) Trigger: cada vez que se crea un usuario en Auth, se crea su fila en user_roles
--    Así la fila siempre existe aunque el cliente no pueda hacer INSERT por RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, email)
  VALUES (NEW.id, 'client', NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger en auth.users (se ejecuta al registrar un usuario)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2) RLS: activar y dar permisos para que cada usuario pueda leer y actualizar su propia fila

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede ver su propia fila (necesario para isAdmin, etc.)
DROP POLICY IF EXISTS "Users can read own row" ON public.user_roles;
CREATE POLICY "Users can read own row"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Cada usuario puede actualizar su propia fila (para guardar teléfono tras registro)
DROP POLICY IF EXISTS "Users can update own row" ON public.user_roles;
CREATE POLICY "Users can update own row"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Por si no usas el trigger: cada usuario puede insertar su propia fila (solo su user_id)
DROP POLICY IF EXISTS "Users can insert own row" ON public.user_roles;
CREATE POLICY "Users can insert own row"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Si quieres que los admins vean todas las filas, descomenta y ajusta el nombre de la política:
-- DROP POLICY IF EXISTS "Admins can read all" ON public.user_roles;
-- CREATE POLICY "Admins can read all"
--   ON public.user_roles FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.user_roles ur
--       WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
--     )
--   );
