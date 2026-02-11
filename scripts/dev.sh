#!/bin/bash

# Script para iniciar el servidor de desarrollo limpiando el puerto 3000 primero

echo "🧹 Limpiando puerto 3000..."

# Detener cualquier proceso usando el puerto 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Detener procesos de Next.js
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null

# Limpiar archivos de lock si existen
rm -rf .next/dev/lock 2>/dev/null

# Esperar un momento
sleep 1

# Verificar que el puerto esté libre
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Advertencia: El puerto 3000 aún está en uso. Intentando limpiar de nuevo..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  sleep 1
fi

echo "✅ Puerto 3000 limpio. Iniciando servidor..."
echo ""

# Iniciar el servidor con hot reload habilitado
# Fast Refresh está habilitado por defecto en Next.js
exec npx next dev -p 3000 --turbo

