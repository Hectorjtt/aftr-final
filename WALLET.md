# Agregar a Apple Wallet

Los clientes con tickets aprobados pueden usar el botón **"Agregar a Wallet"** en la página **Mis Tickets**. Para que funcione, debes configurar los certificados de Apple en el servidor.

## Requisitos

- Cuenta de Apple Developer (para crear Pass Type ID y certificados).
- Certificado de firma (.pem) y su clave privada.
- Certificado WWDR de Apple.

## Mostrar el botón

El botón **"Agregar a Wallet"** está oculto por defecto. Para mostrarlo, añade:

```
NEXT_PUBLIC_WALLET_ENABLED=true
```

## Variables de entorno (certificados)

Añade estas variables en tu entorno (por ejemplo en Vercel o `.env.local`):

| Variable | Descripción |
|----------|-------------|
| `WALLET_PASS_TYPE_ID` | Pass Type ID (ej: `pass.com.aftr.ticket`) |
| `WALLET_TEAM_ID` | Team ID de tu cuenta Apple Developer |
| `WALLET_ORG_NAME` | Nombre de la organización (opcional, por defecto usa la marca del evento) |
| `WALLET_SIGNER_CERT` | Contenido del certificado .pem en **base64** |
| `WALLET_SIGNER_KEY` | Contenido de la clave privada .pem en **base64** |
| `WALLET_WWDR` | Contenido del certificado WWDR de Apple en **base64** |

Para convertir archivos a base64 (en terminal):

```bash
base64 -i certificado.pem | tr -d '\n'  # pegar el resultado en WALLET_SIGNER_CERT
base64 -i clave.pem | tr -d '\n'        # pegar en WALLET_SIGNER_KEY
```

## Documentación Apple

- [PassKit Package Format Reference](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/)
- [Creating a Pass](https://developer.apple.com/documentation/walletpasses/creating_the_source_for_a_pass)
