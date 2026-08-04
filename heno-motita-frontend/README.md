# Heno Motita Frontend

Cliente React para la API de Heno Motita. Implementa inicio de sesión JWT y el panel administrativo de encargados, cuadrillas e historial de alumnos.

## Configuración

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` debe contener únicamente la URL pública de la API, incluido `/api/v1`. Nunca coloques contraseñas, tokens, secretos de JWT o credenciales de Cloudinary en archivos `VITE_*`.

Para publicar el frontend, agrega su origen exacto, sin ruta final, en `CORS_ALLOWED_ORIGINS` del servicio de Render. Por ejemplo: `https://app.ejemplo.com`.

## Verificación

```bash
npm run lint
npm run build
npm audit --omit=dev
```

GitHub Actions ejecuta lint, build y `npm audit --audit-level=high` en cada push a `main` y pull request. Dependabot propone actualizaciones semanales de dependencias.

## Seguridad

- El token de acceso se conserva solo durante la sesión del navegador y se elimina tras cerrar sesión o recibir `401`.
- Las peticiones tienen un límite de 15 segundos y no registran tokens ni contraseñas.
- El HTML aplica una política CSP que limita conexiones a la API publicada. Si se cambia `VITE_API_URL`, actualiza también `connect-src` en `index.html`.
- Los encabezados HTTP adicionales, como HSTS, `X-Content-Type-Options` y `frame-ancestors`, deben configurarse en el hosting/CDN, ya que Vite genera archivos estáticos.
