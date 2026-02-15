# Qué pasaba con Vercel y GitHub

## El problema

El código **sí estaba en GitHub** (tu `main` y `origin/main` coincidían en el commit `b97ebe7`).  
Lo que fallaba era el **build en Vercel**:

- La página `/compra/success` usa `useSearchParams()`.
- En **Next.js 16** esa página debe estar dentro de un **Suspense**.
- Al no estarlo, el build fallaba al generar las páginas.
- Cuando el build falla, **Vercel no actualiza el sitio** y sigue mostrando el **último despliegue que sí terminó bien** (una versión antigua, sin pago con tarjeta ni el “Aceptar” del escáner).

Por eso en local veías todo bien y en Vercel parecía que no se subían los cambios.

## Lo que se corrigió

En `app/compra/success/page.tsx` se envolvió el contenido que usa `useSearchParams()` en un `<Suspense>`, así el build de Next.js puede completarse y Vercel puede desplegar la versión nueva.

## Qué hacer ahora

1. **Hacer commit y push** del cambio de `app/compra/success/page.tsx`:
   ```bash
   git add app/compra/success/page.tsx
   git commit -m "fix: Suspense en compra/success para que el build pase en Vercel"
   git push origin main
   ```

2. En **Vercel**:
   - Se lanzará un nuevo deployment al hacer push.
   - Revisa la pestaña **Deployments**: el último debe pasar a **Ready** (build exitoso).
   - Si algún deployment falla, entra a **View build logs** para ver el error.

3. Cuando el deployment esté **Ready**, abre tu URL de producción (o la de preview del último commit) y haz un **refresco forzado** (Ctrl+Shift+R o Cmd+Shift+R) para no cargar caché antigua.

Después de esto deberías ver en producción tanto el **pago con tarjeta** como el **“Aceptar”** en el escáner QR.
