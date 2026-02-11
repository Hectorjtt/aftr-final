# Conectar esta carpeta al repo de GitHub (y que Vercel siga desplegando)

Descargaste el proyecto en ZIP, así que esta carpeta **no tiene Git**. Sigue estos pasos para enlazarla al mismo repo y branch.

---

## 1. Abrir la terminal en esta carpeta

```bash
cd /Users/hectirjtt/Downloads/AFTR-vercel-react-server-components-cve-vu-apz7b2
```

---

## 2. Inicializar Git y conectar con el repo

Copia y pega estos comandos **uno por uno** (o todos si prefieres):

```bash
# Inicializar Git en esta carpeta
git init

# Añadir el repositorio de GitHub como "origin"
git remote add origin https://github.com/Hectorjtt/AFTR.git

# Guardar el estado actual como primer commit
git add .
git commit -m "Proyecto retomado - estado actual"

# Traer la rama main del remoto
git fetch origin

# Usar la rama main y enlazarla al remoto
git branch -M main
git pull origin main --allow-unrelated-histories
```

Si `git pull` pide mensaje de merge, guarda y cierra el editor (en vim: `:wq`). Si hay conflictos, Git te avisará y tendrás que resolverlos en los archivos que indique.

---

## 3. Subir los cambios a GitHub

```bash
git push -u origin main
```

- Si pide usuario/contraseña: en GitHub ya no se usa la contraseña de la cuenta; usa un **Personal Access Token** (ver `SOLUCION-GITHUB.md`).
- O configura el remote por SSH:  
  `git remote set-url origin git@github.com:Hectorjtt/AFTR.git`  
  y luego `git push -u origin main`.

---

## 4. A partir de ahora

Cada vez que quieras que se actualice el deploy en Vercel:

```bash
git add .
git commit -m "Descripción de lo que cambiaste"
git push
```

Vercel, al estar conectado a **Hectorjtt/AFTR** en la rama **main**, desplegará automáticamente con cada `git push` a `main`.

---

## Resumen

| Paso | Comando / acción |
|------|-------------------|
| 1 | `git init` |
| 2 | `git remote add origin https://github.com/Hectorjtt/AFTR.git` |
| 3 | `git add .` → `git commit -m "Proyecto retomado - estado actual"` |
| 4 | `git fetch origin` |
| 5 | `git branch -M main` → `git pull origin main --allow-unrelated-histories` |
| 6 | `git push -u origin main` |

Si algo falla (por ejemplo en el `pull` o en el `push`), copia el mensaje de error y lo revisamos.
