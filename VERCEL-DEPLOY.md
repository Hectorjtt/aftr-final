# Cómo actualizar Producción en Vercel

## Situación

- **GitHub** tiene el código correcto (commit `06ba8ae` con el fix de Suspense y todo lo nuevo).
- **Vercel Producción** sigue en el commit antiguo `1d7dd04` (por eso ves "Ready Stale" y "2d ago").

## Opción A: Promover el deployment correcto (si ya existe)

1. Entra a tu proyecto en **Vercel** → pestaña **Deployments**.
2. Busca un deployment cuyo **commit** sea **06ba8ae** o **b97ebe7** (no 1d7dd04).
3. Si ese deployment está en estado **Ready** (verde):
   - Abre los tres puntos **⋯** de ese deployment.
   - Elige **"Promote to Production"** (o "Assign to Production").
4. Así Producción pasará a usar ese build y verás pago con tarjeta y "Aceptar" en el escáner.

## Opción B: Forzar un deployment nuevo desde GitHub

1. En **Vercel** → **Deployments**.
2. Arriba, botón **"Redeploy"** o **"Create Deployment"**.
3. Elige la rama **main** y confirma. Eso lanzará un build con el último commit (`06ba8ae`).
4. Cuando el nuevo deployment esté **Ready**, si no se asigna solo a Producción, repite el paso 3 de la Opción A para ese deployment.

## Opción C: Comprobar la conexión GitHub ↔ Vercel

1. **Vercel** → tu proyecto → **Settings** → **Git**.
2. Comprueba que el repositorio conectado sea el correcto (`Hectorjtt/aftr-final` o el que uses).
3. En **Production Branch** debe estar **main**.
4. Si quieres, haz un **push vacío** para disparar un nuevo deploy:
   ```bash
   git commit --allow-empty -m "trigger vercel deploy"
   git push origin main
   ```

## Después de actualizar

- Abre tu URL de producción (ej. `aftr-final.vercel.app`).
- Haz **refresco forzado**: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac), o prueba en ventana de incógnito.
- Deberías ver el pago con tarjeta y el "Aceptar" en el escáner QR.
