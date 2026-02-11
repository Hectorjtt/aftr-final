# 🚀 Guía Rápida: Configurar Variables de Entorno en Vercel

## El Error que Estás Viendo

```
Error: supabaseUrl is required.
```

Esto significa que las variables de entorno de Supabase no están configuradas en Vercel.

## Solución Paso a Paso

### Paso 1: Obtener tus Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) en el menú lateral
4. Haz clic en **API**
5. Encontrarás:
   - **Project URL** → Ejemplo: `https://abcdefghijklmnop.supabase.co`
   - **anon public** key → Una clave larga que empieza con `eyJ...`

### Paso 2: Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Selecciona tu proyecto **AFTR**
3. Ve a **Settings** (en el menú superior)
4. En el menú lateral, haz clic en **Environment Variables**
5. Haz clic en el botón **Add New** o **+**

#### Agregar Primera Variable:

- **Name (Key):** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Pega tu **Project URL** de Supabase (ej: `https://abcdefghijklmnop.supabase.co`)
- **Environment:** Marca las tres opciones:
  - ✅ Production
  - ✅ Preview  
  - ✅ Development
- Haz clic en **Save**

#### Agregar Segunda Variable:

- **Name (Key):** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Pega tu **anon public** key de Supabase (la clave larga)
- **Environment:** Marca las tres opciones:
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- Haz clic en **Save**

### Paso 3: Redesplegar

Después de agregar las variables, necesitas redesplegar:

1. Ve a la pestaña **Deployments** (en el menú superior)
2. Encuentra el último deployment (el que falló)
3. Haz clic en los **3 puntos (...)** a la derecha
4. Selecciona **Redeploy**
5. Confirma haciendo clic en **Redeploy** nuevamente
6. Espera a que termine el build (1-2 minutos)

### Paso 4: Verificar

Una vez que el deploy termine exitosamente:

1. Haz clic en el enlace de tu sitio (ej: `aftr.vercel.app`)
2. Deberías ver tu página funcionando
3. Prueba hacer login/registro para verificar que Supabase funciona

## ✅ Checklist

- [ ] Obtuve mi Project URL de Supabase
- [ ] Obtuve mi anon public key de Supabase
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_URL` en Vercel
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel
- [ ] Marqué las variables para Production, Preview y Development
- [ ] Hice Redeploy del proyecto
- [ ] El build terminó exitosamente
- [ ] El sitio funciona correctamente

## 🆘 Si Aún Tienes Problemas

1. **Verifica que las variables estén correctas:**
   - `NEXT_PUBLIC_SUPABASE_URL` debe empezar con `https://`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` debe ser una cadena larga que empieza con `eyJ`

2. **Verifica que no haya espacios extra:**
   - Copia y pega directamente, sin espacios antes o después

3. **Asegúrate de hacer Redeploy:**
   - Las variables nuevas no se aplican a deployments anteriores automáticamente

4. **Revisa los logs del build:**
   - En Vercel, ve a Deployments > Haz clic en el deployment > Verás los logs
   - Busca errores específicos

## 📝 Nota Importante

Las variables que empiezan con `NEXT_PUBLIC_` son **públicas** y se incluyen en el código del navegador. Esto es normal y seguro para Supabase porque:
- La clave `anon` está diseñada para ser pública
- Supabase usa Row Level Security (RLS) para proteger los datos
- Solo los usuarios autenticados pueden acceder a datos sensibles


