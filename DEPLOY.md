# Guía de Despliegue

## Opciones de Despliegue

### Opción 1: Vercel (Recomendado para Next.js) ⭐

Vercel es la plataforma creada por el equipo de Next.js, por lo que es la más fácil y optimizada.

#### Pasos:

1. **Conectar Repositorio en Vercel**:
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Haz clic en "Add New..." > "Project"
   - Conecta tu repositorio de GitHub (Hectorjtt/AFTR)
   - Vercel detectará automáticamente que es Next.js

2. **⚠️ IMPORTANTE: Configurar Variables de Entorno ANTES del primer deploy**:
   
   **PASO CRÍTICO - Haz esto ANTES de hacer clic en "Deploy":**
   
   - En la pantalla de configuración del proyecto, busca la sección **"Environment Variables"**
   - Haz clic en "Add" o el botón "+"
   - Agrega estas dos variables:
     
     **Variable 1:**
     - Key: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `https://tu-proyecto.supabase.co` (reemplaza con tu URL real)
     - Environments: ✅ Production, ✅ Preview, ✅ Development
     
     **Variable 2:**
     - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Value: `tu-clave-anonima-aqui` (reemplaza con tu clave real)
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - Haz clic en "Save" después de agregar cada variable

3. **Desplegar**:
   - Haz clic en "Deploy"
   - Espera a que termine el build (puede tardar 1-2 minutos)
   - Si ves un error sobre variables de entorno, vuelve al paso 2

4. **Verificar el Despliegue**:
   - Una vez completado, verás una URL como `tu-proyecto.vercel.app`
   - Haz clic para abrir tu sitio
   - Si todo está bien, deberías ver tu página funcionando

#### 🔧 Si el Build Falla con Error de Variables de Entorno:

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** > **Environment Variables**
3. Verifica que ambas variables estén configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**
5. Si las agregaste después del primer deploy, ve a **Deployments** y haz clic en los 3 puntos (...) del último deployment > **Redeploy**

---

### Opción 2: Netlify

#### Pasos:

1. **Crear cuenta en Netlify** en [netlify.com](https://netlify.com)

2. **Conectar repositorio**:
   - Si tienes el código en GitHub/GitLab/Bitbucket, conéctalo desde el dashboard
   - O arrastra la carpeta desde la interfaz web

3. **Configurar Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next` (Netlify lo detecta automáticamente con el plugin)

4. **Configurar Variables de Entorno**:
   En Site settings > Environment variables, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anónima de Supabase

5. **Instalar plugin de Next.js** (si no se instala automáticamente):
   - En el dashboard, ve a Plugins
   - Busca "@netlify/plugin-nextjs" e instálalo

6. **Desplegar**: Netlify desplegará automáticamente en cada push a la rama principal

---

## Variables de Entorno Necesarias

Asegúrate de configurar estas variables en tu plataforma de despliegue:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

**⚠️ IMPORTANTE**: Estas variables deben empezar con `NEXT_PUBLIC_` para que estén disponibles en el navegador.

---

## Verificar el Despliegue

Después de desplegar:

1. ✅ Verifica que la página carga correctamente
2. ✅ Prueba el login/registro
3. ✅ Prueba el scanner QR desde un celular (debe pedir permisos de cámara)
4. ✅ Verifica que los tickets se pueden escanear
5. ✅ Verifica que un QR no se puede escanear dos veces

---

## Notas sobre el Scanner QR

- ✅ Funciona en dispositivos móviles (celular/tablet)
- ✅ Requiere permisos de cámara
- ✅ Protegido contra escaneos duplicados (un QR solo se puede usar una vez)
- ✅ Muestra mensaje claro si el ticket ya fue utilizado
- ✅ Permite escanear múltiples tickets seguidos sin reiniciar

---

## Solución de Problemas

### Error: "supabaseUrl is required" o "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Este es el error más común. Solución:**

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** > **Environment Variables**
3. Verifica que tengas estas dos variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (con tu URL completa de Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (con tu clave anónima)
4. Asegúrate de que estén habilitadas para **Production**, **Preview** y **Development**
5. Si las agregaste después del deploy, necesitas **Redeploy**:
   - Ve a **Deployments**
   - Haz clic en los 3 puntos (...) del último deployment
   - Selecciona **Redeploy**
6. Espera a que termine el nuevo build

**Para obtener tus credenciales de Supabase:**
- Ve a tu proyecto en [supabase.com](https://supabase.com)
- Ve a **Settings** > **API**
- Copia:
  - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### El scanner no funciona en el celular
- Verifica que el sitio esté usando HTTPS (requerido para acceder a la cámara)
- Asegúrate de dar permisos de cámara cuando el navegador lo solicite

### Build falla
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de usar Node.js 18 o superior

