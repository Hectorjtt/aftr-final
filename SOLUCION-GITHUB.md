# Solución para el Error de Push a GitHub

## El Problema
El error `HTTP 400` generalmente ocurre porque GitHub ya no acepta contraseñas para autenticación. Necesitas usar un **Personal Access Token** o **SSH**.

## Solución 1: Usar Personal Access Token (Más Fácil) ⭐

### Paso 1: Crear un Token en GitHub

1. Ve a GitHub.com y haz clic en tu foto de perfil (arriba derecha)
2. Ve a **Settings** (Configuración)
3. En el menú lateral, ve a **Developer settings**
4. Haz clic en **Personal access tokens** > **Tokens (classic)**
5. Haz clic en **Generate new token** > **Generate new token (classic)**
6. Dale un nombre como "AFTR Project"
7. Selecciona los permisos:
   - ✅ `repo` (todos los permisos de repositorio)
8. Haz clic en **Generate token**
9. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)

### Paso 2: Usar el Token para Push

```bash
# Opción A: Usar el token en la URL (temporal)
git remote set-url origin https://TU_TOKEN@github.com/Hectorjtt/AFTR.git
git push -u origin main

# Opción B: Git te pedirá usuario y contraseña
# Usuario: Hectorjtt
# Contraseña: Pega tu token aquí (NO tu contraseña de GitHub)
git push -u origin main
```

---

## Solución 2: Usar SSH (Más Seguro)

### Paso 1: Generar Clave SSH (si no tienes una)

```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
# Presiona Enter para aceptar la ubicación por defecto
# Opcional: agrega una contraseña para mayor seguridad
```

### Paso 2: Copiar la Clave Pública

```bash
cat ~/.ssh/id_ed25519.pub
# Copia todo el contenido que aparece
```

### Paso 3: Agregar la Clave a GitHub

1. Ve a GitHub.com > Settings > **SSH and GPG keys**
2. Haz clic en **New SSH key**
3. Dale un título (ej: "Mi MacBook")
4. Pega la clave pública
5. Haz clic en **Add SSH key**

### Paso 4: Cambiar el Remote a SSH

```bash
git remote set-url origin git@github.com:Hectorjtt/AFTR.git
git push -u origin main
```

---

## Solución 3: Verificar y Reintentar

Si el repositorio ya tiene contenido, primero haz pull:

```bash
# Verificar qué hay en el remoto
git fetch origin

# Si hay contenido diferente, hacer merge
git pull origin main --allow-unrelated-histories

# Luego hacer push
git push -u origin main
```

---

## Solución Rápida (Si Solo Quieres Probar)

Si solo quieres subir el código rápido para desplegar, puedes:

1. **Usar GitHub Desktop** (interfaz gráfica, más fácil)
2. **Subir manualmente** arrastrando la carpeta en GitHub.com
3. **Usar Vercel/Netlify directamente** desde GitHub Desktop o CLI

---

## Verificar que Funcionó

Después del push exitoso, deberías ver:
```
Enumerating objects: 133, done.
Counting objects: 100% (133/133), done.
Writing objects: 100% (133/133), done.
To https://github.com/Hectorjtt/AFTR.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Nota sobre Archivos Grandes

Si tienes archivos muy grandes (>50MB), GitHub puede rechazarlos. En ese caso:
- Usa Git LFS (Large File Storage)
- O comprime las imágenes antes de subirlas


