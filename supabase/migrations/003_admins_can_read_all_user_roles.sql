-- Los admins pueden leer todas las filas de user_roles (para ver teléfono/email en el panel de aprobaciones)

DROP POLICY IF EXISTS "Admins can read all" ON public.user_roles;
CREATE POLICY "Admins can read all"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
