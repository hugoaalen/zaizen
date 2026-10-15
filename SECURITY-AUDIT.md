# Revision de seguridad - 2026-10-15

## Alcance y limites

Revision estatica dirigida a dependencias, autenticacion, exportaciones CSV/JSON,
cache offline, service worker, configuracion de despliegue, politicas SQL,
workflow y busqueda heuristica de secretos en el historial Git disponible.
No constituye una certificacion ni una prueba de penetracion exhaustiva.
No se accedio a datos de usuarios ni se ejecuto SQL remoto.

La API publica de GitHub confirma que main apunta al mismo commit local
5a136acddee7fb64349b13666adf4fc49161c1b7 y que Quality #29 fallo.
No se pudo verificar configuracion privada, alertas de secretos, colaboradores,
credenciales de despliegue, Supabase en vivo ni cabeceras efectivas de produccion.
El escaneo historico cubrio 272 blobs de texto; no analizo secretos en binarios,
OCR de capturas antiguas, objetos no alcanzables ni ramas no disponibles localmente.

## Hallazgos

### Alta: dependencias de desarrollo vulnerables (corregido)

brace-expansion 1.1.18 presenta tres avisos de denegacion de servicio; la version
1.1.20 mostrada como solucion en la captura NO corrige los tres. Se fija 1.1.21
para la rama 1.x mediante overrides y se actualiza el lockfile.
source-map-js 1.2.1 presenta otro aviso alto; se fija 1.2.2.
Todas las rutas detectadas pertenecen a herramientas de desarrollo (ESLint/Vite),
no a dependencias de ejecucion del navegador. No demuestran acceso a cuentas.

Referencias:
- https://github.com/advisories/GHSA-q2hr-2g5m-vwhr
- https://github.com/advisories/GHSA-qhr7-859c-m2p7
- https://github.com/advisories/GHSA-6j4f-fj2g-mc7p
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q

### Media: rama principal sin proteccion (pendiente remoto)

La API de branches/main devuelve protected=false y comprobaciones obligatorias
desactivadas. Quality puede fallar sin impedir un push directo; este workflow no
es en si mismo el despliegue. Configurar ruleset/proteccion que requiera PR y
Quality / validate antes de fusionar. Comprobar tambien que el proveedor de
hosting no publique cambios que no hayan superado validacion.
No se modificaron ajustes remotos.

### Media: datos financieros persistentes en el dispositivo (riesgo residual)

src/offlineCache.js guarda datos financieros sin cifrar en localStorage y sin
caducidad. Las claves separan usuarios y el cierre de sesion limpia esos datos,
pero esa separacion no protege ante scripts del mismo origen o acceso al perfil
del navegador. Es un compromiso del modo offline, no un bypass RLS demostrado.
Valorar modo offline opt-in, caducidad y opcion de limpiar copias locales.
No se elimino esta funcionalidad durante la revision.

### Baja: endurecimiento del repositorio (parcialmente corregido)

Se declaran permisos contents: read, se desactiva persistencia de credenciales
del checkout y se fija ubuntu-24.04 para evitar cambio automatico de runner.
Se ignoran variantes .env.* conservando .env.example.
Se configura Dependabot semanal para npm y GitHub Actions.
Pendiente: fijar actions por SHA verificado y planificar migracion de ESLint 9,
que pnpm informa como no soportado. El aviso Node 20 de pnpm/action-setup@v4
no es la causa del fallo observado y sigue pendiente de actualizar esa action.

### Baja: validacion incompleta en presupuestos recurrentes (pendiente)

supabase/migrations/202609100001_recurring_budgets.sql limita importe mediante
numeric(12,2) y check positivo, pero category no tiene limite de longitud ni
prohibe texto vacio como budgets. Una peticion directa puede eludir validacion
de interfaz dentro de los datos propios del usuario. Preparar migracion tras
comprobar filas existentes; no se altero la base de datos.

## Controles comprobados en archivos

- RLS por user_id en las tablas declaradas; grants anon revocados por migraciones.
- FK compuesta para impedir aportaciones a objetivos de otro usuario.
- delete_own_account usa auth.uid(), search_path vacio, permisos autenticados
  y requisito de inicio de sesion reciente en su ultima definicion.
- Rechazo de claves service_role/sb_secret_ en configuracion del frontend.
- Sin coincidencias de eval, innerHTML o dangerouslySetInnerHTML en src.
- Exportacion CSV neutraliza inicios de formula habituales; tests existentes.
- Service worker limita cache de recursos a mismo origen; no cachea Supabase.
- CSP, HSTS y cabeceras defensivas declaradas en vercel.json.
- Sin coincidencias de claves privadas, tokens GitHub, AWS AKIA, sb_secret_ o
  JWT privilegiados en el escaneo heuristico historico. No equivale a ausencia
  garantizada de secretos. Preview.png actual contiene datos de demostracion.

## Verificacion

- pnpm audit --audit-level=low: sin vulnerabilidades conocidas tras correcciones.
- pnpm run check: lint correcto, 50 tests correctos, build correcto.
- Resumen mensual/anual y exportaciones CSV/JSON ahora paginan con orden estable.
  La lectura sigue hasta pagina vacia, incluso si el servidor devuelve menos
  filas que las solicitadas. Un error intermedio descarta el resultado parcial.
  Tests cubren 1237 registros, limite servidor menor al solicitado y errores.
  No es una instantanea transaccional: evitar editar datos desde otros dispositivos
  durante una exportacion si se necesita una copia consistente en un instante.
- Build mantiene aviso de tamano de bundle; no es vulnerabilidad de seguridad.

## Verificacion necesaria en Supabase y GitHub

1. Comprobar migraciones realmente aplicadas y ejecutar Security Advisor.
2. Probar aislamiento con dos usuarios de prueba: lectura, insert, update,
   delete, cambio de user_id y aportacion a objetivo ajeno deben rechazarse.
3. Revisar todas las politicas existentes: politicas permisivas antiguas pueden
   combinarse con las nuevas; los archivos no prueban estado real del servidor.
4. Verificar confirmacion de email, politica de contrasenas, limites de intentos,
   redirecciones OAuth exactas, backups y proteccion antiabuso. CAPTCHA requiere
   integracion cliente; no activarlo a ciegas si el formulario no envia token.
5. Activar/verificar secret scanning y push protection, revisar colaboradores,
   tokens, secretos de Actions y proteccion de main con acceso administrativo.
6. Verificar cabeceras reales y ejecucion verde de Quality tras publicar cambios.

No se hicieron commit, push, cambios de configuracion remota ni cambios de datos.
