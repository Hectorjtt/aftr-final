# Pago con tarjeta (Stripe)

En el flujo de compra, el usuario puede elegir **Transferencia bancaria** o **Pago con tarjeta**. Si elige tarjeta, se usa Stripe Checkout (página de pago de Stripe) y al volver se crea la solicitud en estado pendiente para que el admin apruebe como cualquier otra.

## Requisitos

1. **Cuenta en [Stripe](https://stripe.com)** (modo prueba para desarrollo).
2. **Migración de base de datos**  
   Ejecuta las migraciones de Supabase para tener las columnas `payment_method` y `stripe_session_id` en `purchase_requests`:
   - `005_add_payment_method_to_purchase_requests.sql`

## Variables de entorno: STRIPE_SECRET_KEY

### ¿Qué es?

Es la **clave secreta** de tu cuenta de Stripe. Sirve para que tu servidor (Next.js) pueda crear sesiones de pago y verificar que un pago se completó. **Nunca** debe estar en el frontend ni en el repositorio público; solo en el servidor y en variables de entorno.

### Cómo obtenerla

1. **Entra a Stripe**  
   - Si no tienes cuenta: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)  
   - Si ya tienes: [https://dashboard.stripe.com](https://dashboard.stripe.com) e inicia sesión.

2. **Abre la sección de claves API**  
   - En el menú lateral: **Developers** (Desarrolladores).  
   - Luego **API keys**.

3. **Elige la clave que necesitas**  
   - **Para pruebas (desarrollo):** en la parte superior suele decir “Test mode” (modo prueba). Ahí verás:
     - **Publishable key** (empieza con `pk_test_...`) → no la uses para esto.
     - **Secret key** → haz clic en **Reveal test key** y copia la que empieza por **`sk_test_...`**.  
     Esa es tu **STRIPE_SECRET_KEY** para desarrollo.

   - **Para producción (pagos reales):** activa “Live mode” en la misma página y copia la **Secret key** que empieza por **`sk_live_...`**. Esa será tu **STRIPE_SECRET_KEY** en producción.

### Dónde ponerla

1. **En tu máquina (desarrollo)**  
   - En la **raíz del proyecto** (donde está `package.json`) crea o edita el archivo **`.env.local`**.  
   - Añade una sola línea (sustituye por tu clave real):

   ```bash
 
   ```

   - Sin comillas, sin espacios alrededor del `=`.  
   - Guarda el archivo.  
   - **Reinicia el servidor de Next.js** (`npm run dev` o `yarn dev`) para que lea la nueva variable.

2. **En producción (Vercel, Railway, etc.)**  
   - En el panel de tu hosting, entra a **Settings → Environment variables** (o “Variables de entorno”).  
   - Crea una variable:
     - **Nombre:** `STRIPE_SECRET_KEY`  
     - **Valor:** tu clave **live** `sk_live_...` (no la de test).  
   - Guarda y vuelve a desplegar si hace falta.

### Clave publicable (opcional)

Si en el futuro usas Stripe en el navegador (por ejemplo Stripe.js), añade también:

- **Nombre:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Valor:** la clave que empieza por `pk_live_...` (producción) o `pk_test_...` (pruebas).

Para el flujo actual (solo Checkout con redirección) basta con `STRIPE_SECRET_KEY`.

### Resumen

| Dónde        | Variable             | Valor        |
|-------------|----------------------|-------------|
| `.env.local` (desarrollo) | `STRIPE_SECRET_KEY` | `sk_test_...` o `sk_live_...` |
| Hosting (producción)     | `STRIPE_SECRET_KEY` | `sk_live_...` |
| Opcional (producción)    | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

### Importante

**Nunca** subas las claves a GitHub ni las pegues en el código. Solo en `.env.local` (que está en `.gitignore`) y en las variables de entorno del hosting (Vercel, etc.).

