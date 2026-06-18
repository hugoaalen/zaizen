# Seguridad de ZaiZen

## Versiones soportadas

La rama principal y el último despliegue de producción reciben correcciones de
seguridad. No se mantienen versiones antiguas.

## Configuración obligatoria de Supabase

En **Authentication > Providers > Email**:

- Activa la confirmación de email.
- Configura una longitud mínima de contraseña de 12 caracteres.
- Activa la protección frente a contraseñas filtradas si está disponible en tu
  plan.
- Desactiva los inicios de sesión anónimos.

En **Authentication > Attack Protection**:

- Configura límites de frecuencia para registro, login, recuperación y OTP.
- Activa CAPTCHA con Cloudflare Turnstile o hCaptcha en registro, login y
  recuperación cuando la aplicación tenga usuarios públicos.

En **Authentication > URL Configuration**:

- Usa la URL HTTPS exacta de producción como Site URL.
- Mantén únicamente las URLs de redirección necesarias para producción y
  desarrollo local.
- No utilices comodines amplios en producción.

En **Database**:

- Aplica todas las migraciones de `supabase/migrations`.
- Ejecuta de nuevo Security Advisor y Performance Advisor.
- Revisa que todas las tablas públicas tengan RLS habilitada y políticas.
- Activa copias de seguridad y Point-in-Time Recovery cuando el plan lo permita.

## Variables y claves

- `VITE_SUPABASE_URL` es pública.
- `VITE_SUPABASE_ANON_KEY` debe contener una clave `anon` o `sb_publishable_`.
- Las claves `service_role`, `sb_secret_` y credenciales de base de datos nunca
  deben aparecer en frontend, Git, logs, capturas ni variables `VITE_*`.
- Si una clave privilegiada se expone, revócala inmediatamente y revisa logs,
  usuarios, funciones y cambios de datos.

## Verificación antes de desplegar

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run security:audit
```

Después del despliegue:

1. Comprueba las cabeceras CSP, HSTS y `X-Content-Type-Options`.
2. Prueba registro, recuperación, Google OAuth y cierre de sesión.
3. Verifica con dos usuarios que ninguno puede consultar o modificar datos del
   otro.
4. Comprueba que cerrar sesión elimina los datos financieros offline.
5. Ejecuta Security Advisor de Supabase sin avisos críticos.

## Comunicación responsable

No publiques vulnerabilidades con datos reales. Comunícalas de forma privada al
mantenedor incluyendo impacto, pasos mínimos de reproducción y una propuesta de
corrección cuando sea posible. Evita acceder, modificar o descargar información
de otros usuarios durante una prueba.
