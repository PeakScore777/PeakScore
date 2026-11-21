# PeakScore — Threat Model & Security Roadmap

**Fecha:** 2026-11-20  
**Rama de trabajo:** `feat/founder-intro`  
**Repositorio:** `PeakScore777/PeakScore`  
**Objetivo:** reducir el riesgo antes de abrir PeakScore a una comunidad amplia. Este documento distingue hallazgos verificados de riesgos que requieren pruebas.

## 1. Alcance y activos que debemos proteger

PeakScore no es solo una web educativa. El alcance incluye:

- Cuentas, sesiones, perfiles, correo y datos personales.
- Roles globales y roles de comunidad: estudiante, profesor verificado, moderador y administrador.
- Comunidad: canales, mensajes, comentarios, reacciones, perfiles públicos, solicitudes de profesores, aulas privadas y sesiones en vivo.
- Simulacros, respuestas, preguntas, progreso, XP, monedas, rachas, personajes y recompensas.
- OmegaX: conversaciones, imágenes, documentos, conocimiento RAG, pizarra, clases en vivo y cuotas de IA.
- Archivos subidos por usuarios y administradores: imágenes, PDFs y futuros materiales de profesores.
- Futuros productos: Creator Studio, marketplace, Drive, cursos, pagos, comisiones, video y streaming.
- Código fuente, workflows, secretos, despliegues, Supabase y proveedores externos.

## 2. Modelo de amenazas

### Actores

1. Usuario abusivo autenticado que intenta saltarse reglas de negocio.
2. Bot o granja de cuentas que automatiza registros, mensajes, reacciones y solicitudes.
3. Atacante externo sin cuenta que explora rutas, headers, cachés y servicios expuestos.
4. Usuario malicioso que sube imágenes, PDFs, SVG, archivos polimórficos o documentos diseñados para explotar parsers.
5. Usuario que intenta acceder a datos de otro estudiante, profesor, aula o institución.
6. Cuenta comprometida de profesor, moderador, administrador o colaborador GitHub.
7. Atacante de cadena de suministro: paquete npm, GitHub Action, dependencia transitiva, build o token comprometido.
8. Atacante que introduce instrucciones maliciosas en texto, imágenes, PDF, repositorios o resultados web que OmegaX o futuros agentes procesan.

### Objetivos que un atacante podría perseguir

- Leer datos privados o modificar recursos de otros usuarios.
- Escalar de estudiante a profesor, moderador o administrador.
- Manipular respuestas, intentos, XP, monedas, compras o recompensas.
- Robar sesiones, tokens, secretos o datos de integración.
- Ejecutar código a través de parsers, XSS, SSRF, inyección o dependencias vulnerables.
- Saturar CPU, memoria, almacenamiento, Realtime, cuotas gratuitas o funciones serverless.
- Hacer spam, raids, phishing, acoso, suplantación y distribución de archivos peligrosos.
- Envenenar el conocimiento de OmegaX o inducir a sus herramientas a realizar acciones no autorizadas.
- Comprometer CI/CD para introducir código malicioso en una versión legítima.

## 3. Riesgos por superficie y controles requeridos

### A. Identidad, autenticación y sesiones

Amenazas:
- Credential stuffing, password spraying, fuerza bruta y enumeración de cuentas.
- Robo o reutilización de refresh tokens, sesiones largas y sesiones de staff comprometidas.
- Recuperación de cuenta abusada, OAuth redirect mal validado y CSRF en operaciones con cookies.
- Confianza en `user_metadata` o campos editables por el cliente para autorizar roles.

Controles:
- MFA obligatorio para administradores y moderadores; MFA recomendado para profesores.
- Rate limit por IP, cuenta y dispositivo/huella de riesgo; respuestas que no permitan enumerar cuentas.
- Revisar expiración, rotación y revocación de sesiones; cerrar sesiones de staff ante cambios de rol o incidentes.
- Validar usuario en servidor con `auth.getUser()`; no autorizar con `getSession()` ni con datos de perfil enviados por el cliente.
- Roles privilegiados en una fuente controlada por servidor; no usar `user_metadata` para autorización.
- Protección de contraseñas filtradas en Supabase Auth si está disponible en el plan actual.

### B. Autorización, RLS, IDOR/BOLA y multi-tenancy

Amenazas:
- Cambiar UUIDs de mensajes, simulacros, solicitudes, documentos, aulas o archivos para acceder a objetos ajenos.
- Mass assignment: enviar propiedades extra como `role`, `owner_id`, `status`, `coins`, `xp`, `price`, `approved` o `institution_id`.
- Escalada horizontal (otro usuario) y vertical (profesor/moderador/admin).
- Vistas PostgreSQL que eludan RLS, funciones SECURITY DEFINER mal protegidas y grants excesivos.
- Aulas privadas protegidas por un rol global en vez de una membresía concreta del canal/sesión.

Controles:
- Política de autorización en servidor por objeto y acción, además de RLS como segunda barrera.
- Cada operación que use un ID enviado por el usuario debe comprobar propietario, membresía, estado y entitlement.
- Listas explícitas de campos aceptados; nunca propagar el body completo a inserts/updates.
- Para UPDATE, usar `USING` y `WITH CHECK`; revisar también grants y SELECT policy.
- Vistas con `security_invoker = true` cuando corresponda; esquemas privados para funciones internas.
- SECURITY DEFINER solo cuando sea necesario, `search_path = ''`, verificación de identidad/propiedad y EXECUTE limitado.
- Modelo de membresías por canal/aula para futuras salas privadas, no un permiso global de profesor.

### C. API, lógica de negocio y consumo de recursos

Amenazas:
- Automatizar endpoints sensibles o flujos de negocio: crear solicitudes, comentarios, sesiones, compras o reclamaciones.
- Abusar de parámetros de paginación, filtros, arrays, concurrencia o payloads grandes.
- Race conditions y replay para reclamar dos veces XP, monedas, descuentos, compras o plazas.
- Enumerar endpoints antiguos, rutas administrativas olvidadas y versiones de API no documentadas.
- SSRF si un servidor descarga URLs controladas por usuarios.

Controles:
- Rate limits transaccionales en base de datos y límites adicionales por IP/edge.
- Cuotas de CPU, tiempo, tamaño de body, número de elementos, paginación y concurrencia.
- Idempotency keys y restricciones únicas para compras, recompensas, inscripciones y webhooks.
- Transacciones atómicas y comprobación del estado actual en la base de datos.
- Inventario de Route Handlers, Server Actions, RPCs, webhooks y servicios externos.
- Nunca hacer fetch de una URL aportada por el usuario sin allowlist estricta, resolución DNS/IP segura, bloqueo de redes privadas y límites de redirecciones/tiempo/tamaño.
- Fallar cerrado cuando el rate limiter o el sistema de permisos no esté disponible.

### D. Archivos, imágenes, PDFs y contenido comunitario

Amenazas:
- MIME falso, extensión engañosa, archivos polimórficos, SVG activo, HTML disfrazado de imagen, polyglots.
- Exploits de parsers de imágenes/PDF, ZIP/XML bombs, imágenes con dimensiones extremas y decompression bombs.
- XSS persistente en nombres, biografías, comentarios, Markdown, enlaces, SVG y previsualizaciones.
- Malware o phishing alojado en archivos públicos; abuso de almacenamiento y ancho de banda.
- Metadatos con datos personales o instrucciones invisibles para modelos.

Controles:
- Allowlist de formatos estrictamente necesarios; validar firma/magic bytes y decodificar con parser actualizado.
- Re-encodear imágenes raster a un formato canónico, borrar metadatos y generar nombres aleatorios.
- Rechazar SVG/HTML salvo que exista un caso de uso explícito y un sanitizador/aislamiento probado.
- Limitar bytes, dimensiones, páginas PDF, tiempo de parseo, memoria y concurrencia.
- Cuarentena privada para uploads; publicar solo después de validación. Para documentos de alto riesgo, análisis antivirus/sandbox y CDR cuando sea viable.
- Servir contenido con tipo correcto, `nosniff`, CSP apropiada y dominio separado para descargas no confiables.
- URLs firmadas de vida corta para archivos privados; no confiar en paths o bucket enviados por cliente.
- Reportar, retirar, bloquear y conservar evidencia de abuso con controles de privacidad.

### E. Comunidad, profesores y moderación

Amenazas:
- Spam, raids, bots, cuentas desechables, falsas verificaciones y suplantación de profesores.
- Acoso, doxxing, phishing, enlaces maliciosos, grooming y distribución de contenido ilegal.
- Abuso de roles, filtración de canales privados y manipulación de reportes.
- Reacciones/comentarios coordinados para inflar popularidad o afectar reputación.

Controles:
- Roles separados del perfil público; asignación/revocación solo desde servidor y con auditoría.
- Per-channel membership para espacios privados, más comprobación de acceso en cada lectura y escritura.
- Límites por usuario/IP, cooldowns, reputación progresiva, detección de ráfagas y fricción adaptativa.
- Reportes, bloqueo de usuarios, mute, suspensión temporal, apelación y registro de moderación.
- Enlaces seguros: advertencias para dominios nuevos/sospechosos, protección contra URLs de phishing y previsualizaciones aisladas.
- No exponer documentos ni información privada de solicitudes de profesores.
- Moderación humana para decisiones de alto impacto; automatización como asistencia, no autoridad final.

### F. Tiempo real, audio/video y aulas

Amenazas:
- Tokens de sala falsificados o reutilizados, publicar audio/video sin permiso, entrar a sesiones privadas, expulsar usuarios o consumir cuotas.
- Saturación de conexiones, mensajes y participantes; filtración de room names y credenciales.
- Replay o grabaciones sin consentimiento.

Controles:
- Token WebRTC emitido exclusivamente por servidor tras verificar sesión, rol, propiedad, horario, estado, cupo y entitlement.
- Token de vida corta y grants explícitos mínimos; secretos del proveedor solo en servidor.
- Presupuesto interno estricto y hard caps; sin fallback de pago ni auto top-up.
- Separar metadata/control (Supabase) del transporte multimedia (LiveKit); no usar Supabase Realtime para audio/video.
- Replays desactivados hasta definir consentimiento, retención, permisos y coste.

### G. OmegaX, RAG, OCR y agentes de IA

Amenazas:
- Prompt injection directa e indirecta desde mensajes, imágenes, PDFs, páginas web, repositorios y documentos compartidos.
- Instrucciones invisibles, texto pequeño, metadatos, Unicode confusable, base64, HTML/Markdown malicioso y contenido multilingüe.
- Envenenamiento del corpus RAG para alterar respuestas, extraer información o manipular herramientas.
- Exfiltración de secretos, datos de otros usuarios o system prompts mediante herramientas.
- Consumo abusivo de cuotas gratuitas y bucles de agentes.

Controles:
- Todo contenido recuperado se trata como dato no confiable, nunca como instrucción de sistema.
- Ingesta en cuarentena: parser/modelo lector sin herramientas, sin secretos y sin acceso de escritura.
- Separar instrucciones confiables, datos del usuario y resultados recuperados.
- Verificar procedencia, permisos, propietario, integridad y versión de cada fragmento RAG.
- Herramientas con allowlist y permisos mínimos; autorización determinista fuera del modelo en cada tool call.
- Acciones destructivas o privilegiadas requieren confirmación humana.
- Validar argumentos y salidas estructuradas; limitar pasos, tiempo, tokens, documentos y llamadas.
- Filtrar datos sensibles en logs; registrar decisiones de seguridad sin guardar contenido privado innecesario.
- Probar inyección en español, inglés, contenido multimodal, texto oculto y ataques persistentes.

### H. Dependencias y cadena de suministro

Amenazas:
- Paquetes npm comprometidos, typosquatting, dependency confusion, scripts de instalación maliciosos y dependencias transitivas.
- Vulnerabilidades conocidas en framework, parsers, imágenes, PDF, Markdown, WebSockets y tooling.
- Acciones GitHub con tags mutables o permisos amplios.
- Secretos expuestos en commits, artefactos, logs, sourcemaps o variables NEXT_PUBLIC.

Controles:
- Lockfile versionado, instalaciones reproducibles con `npm ci`, auditoría completa y producción por separado.
- Dependabot, alertas, revisión de dependencias y análisis OSV.
- Pin de GitHub Actions a SHA completo; permisos mínimos por workflow/job; `persist-credentials: false` cuando no se necesita push.
- Secret scanning, push protection y escaneo de historial; rotar cualquier secreto confirmado como expuesto.
- SBOM y revisión de procedencia de paquetes/acciones para releases.
- No ejecutar actualizaciones mayores/forzadas sin pruebas y revisión de changelog.
- Builds de producción sin credenciales reales y sin acceso innecesario a secretos.

### I. Despliegue, red y disponibilidad

Amenazas:
- DDoS, scraping, cache poisoning, caché compartida de datos privados, headers inseguros y configuraciones permisivas.
- Exposición de sourcemaps, previews, endpoints de depuración o entornos no protegidos.
- Agotamiento de límites de Vercel/Supabase y fallos en cascada de proveedores.

Controles:
- CSP estricta por etapas, HSTS, nosniff, frame protections, referrer policy y cookies seguras.
- No cachear respuestas privadas; separar cachés públicas/privadas y probar aislamiento entre usuarios.
- Límites de concurrencia, timeouts, circuit breakers, backpressure y degradación controlada.
- WAF/bot controls dentro de capacidades gratuitas disponibles; no activar funciones de pago ni upgrade automático.
- Alertas de errores 401/403/429/5xx, latencia, uso de DB, storage, CPU y cuotas de proveedores.

### J. Futuros pagos, marketplace y Drive

Amenazas:
- Alteración de precio, descuentos, comisión, seller_id, entitlement, saldo o estado de compra desde el cliente.
- Webhooks falsos, repetidos o fuera de orden.
- Acceso a material pagado mediante URL pública o IDOR.
- OAuth scopes excesivos y fuga de tokens de Drive.

Controles:
- Precio y permisos calculados en servidor; ledger inmutable y operaciones idempotentes.
- Verificar firma, timestamp, idempotencia y estado del proveedor en webhooks.
- Archivos privados con URL firmada corta y autorización por compra/membresía.
- OAuth con scopes mínimos, tokens cifrados server-side y revocación.

## 4. Hallazgos verificados en la inspección del 20/21 de noviembre

### GitHub — rama `feat/founder-intro`

- Se confirmó que la rama existe y que el repositorio es `PeakScore777/PeakScore`.
- El workflow `PeakScore checks` ya valida pruebas, TypeScript, ESLint, build y auditoría de dependencias.
- El workflow de seguridad ya incluye OSV Scanner y Gitleaks para el árbol actual e historial semanal.
- CodeQL estaba configurado solo para `main`; se amplió para incluir `feat/founder-intro`.
- Se fijaron `actions/checkout` y `actions/setup-node` a SHA completos en `peakscore-checks.yml`; se deshabilitó la persistencia de credenciales del checkout.
- Los workflows disparados por esos commits seguían ejecutándose al cerrar esta inspección. No marcar CI/CodeQL como aprobados hasta ver su conclusión final.
- Vercel seguía reportando `build-rate-limit`; el cambio de workflow no elimina ese límite del proveedor.

### Dependencias instaladas en el lockfile de la rama

Versiones leídas:
- Next.js 16.4.6
- DOMPurify 3.4.17
- nanoid 3.3.20
- PostCSS 8.5.25
- sharp 0.35.5
- source-map-js 1.2.2
- Zod 4.6.7

Comparación con advisories públicos consultados:
- Next.js 16.4.6 está por encima de 16.4.5, parche publicado para varios advisories de Next.js del 3 de noviembre de 2026; también está por encima de 16.4.1, parche del advisory crítico de SVG/Image Optimization del 14 de octubre.
- DOMPurify 3.4.17 es la versión corregida del advisory GHSA-cg2g-xh64-v4q7 (afectaba 3.4.4–3.4.16 bajo una combinación concreta de opciones).
- sharp 0.35.5 es la versión corregida del advisory GHSA-wq5f-xc86-pv6w relacionado con librsvg/CVE-2026-96889.
- source-map-js 1.2.2 es la versión corregida de CVE-2026-93749 (DoS por offsets de source maps).
- Estos datos no sustituyen `npm audit`, OSV ni Dependabot. PostCSS, nanoid, Zod y todas las dependencias transitivas deben quedar validadas por los informes automáticos.

### Supabase — proyecto PeakScore

- El proyecto conectado está activo.
- Se consultaron Security Advisor, Performance Advisor, migraciones, grants, políticas de comunidad, funciones SECURITY DEFINER y buckets.
- 24 avisos `rls_enabled_no_policy` corresponden a tablas internas con RLS sin políticas. La comprobación de grants mostró que las tablas listadas no conceden SELECT/INSERT/UPDATE/DELETE a anon ni authenticated. No se deben abrir para silenciar el advisor.
- Se confirmó que `pg_net` está en el esquema `extensions`, no en `public`.
- Supabase sigue mostrando 13 funciones SECURITY DEFINER ejecutables por authenticated. No revocarlas en bloque: varias son RPC legítimas para simulacros, progreso, compras y recompensas; revisar identidad, propiedad, argumentos, ACL y callers una por una.
- Leaked Password Protection sigue desactivada.
- La tabla `community_member_roles` permite SELECT a todos los usuarios autenticados (`USING true`). Esto revela asignaciones y metadatos de roles; evaluar una proyección pública mínima de insignias y reservar asignaciones completas para servidor.
- La lectura de canales privados está basada actualmente en roles globales de profesor/moderador/administrador. Para salas privadas de cursos y grupos, implementar membresía específica por canal/sesión y entitlement.
- Los asesores reportan índices sin uso; no borrarlos sin revisar tráfico real, consultas, ventanas de observación y coste de escritura.

### Revisión puntual de API de solicitud de profesor

En `app/api/community/professor-application/route.ts`:
- POST autentica con `auth.getUser()`, valida campos y usa rate limit de base de datos.
- El guard de origen permite peticiones sin header Origin. Revisar si debe fallar cerrado y añadir estrategia CSRF consistente para mutaciones con cookies.
- El body se lee completo con `request.text()` antes de comprobar su longitud. Añadir límite de bytes antes/durante la lectura para evitar que un body gigante consuma memoria antes del rechazo.
- Las URLs de portafolio se validan como HTTPS, pero no deben ser descargadas por el servidor sin un control SSRF separado.
- La asignación del rol profesor ocurre tras aprobación administrativa mediante RPC server-only; conservar este patrón.

En `app/api/admin/community/professor-applications/[id]/review/route.ts`:
- Se verifica el usuario y el rol admin en servidor y se usa RPC restringida a service_role.
- Revisar límite de tamaño del JSON, CSRF/origen fail-closed, MFA de staff y logging/auditoría de cada decisión.

## 5. Prioridad de remediación

### P0 — antes de producción pública

1. Esperar y verificar los runs actuales de CI, OSV, Gitleaks y CodeQL en `feat/founder-intro`.
2. Obtener el informe completo de `npm audit` y resolver findings por ruta de dependencia y reachability, sin upgrades ciegos.
3. Auditar las 13 funciones SECURITY DEFINER: ACL, auth.uid(), propiedad, límites de parámetros, search_path, SECURITY INVOKER posible y callers.
4. Revisar roles, canales privados y RLS con pruebas de dos usuarios distintos y de un usuario sin rol.
5. Endurecer tamaño de body y CSRF/origin en endpoints mutables.
6. Habilitar leaked password protection si la configuración actual lo permite sin coste adicional.
7. Probar login, recuperación, sesiones, simulacros, recompensas, subidas, OmegaX y comunidad en staging.
8. Resolver el bloqueo de Vercel sin cambiar a un plan de pago; el build de GitHub no equivale a un despliegue validado.

### P1 — antes de abrir Comunidad a gran escala

- Roles y permisos por canal, aulas y sesiones.
- Moderación, reportes, bloqueos, appeals, anti-raid, anti-spam y protección contra phishing.
- Upload quarantine, validación de documentos y límites por usuario/IP.
- Pruebas de autorización automatizadas con usuarios A/B y roles diferentes.
- MFA de staff, auditoría de acciones y alertas de abuso.
- Pruebas de carga para mensajes, comentarios, reacciones, paginación y Realtime.

### P2 — antes de marketplace, pagos, Drive y streaming

- Ledger transaccional, webhook verification, idempotencia y entitlement checks.
- Token de LiveKit server-side con TTL corto y permisos mínimos.
- Storage privado y URLs firmadas; consentimiento y retención de contenido.
- OAuth mínimo y vault de credenciales.
- Revisión de privacidad, derechos de autor, moderación y soporte.

## 6. Bots de ciberseguridad PeakScore — fase futura

La idea es crear bots entrenados y mantenidos por nosotros, pero no deben recibir permisos de administrador ni desplegar cambios autónomos al principio.

Primeros agentes previstos:

1. **Security Auditor:** analiza PRs, rutas, RLS, RPCs, dependencias y configuraciones; entrega hallazgos reproducibles con severidad y evidencia.
2. **Dependency Watcher:** vigila CVEs, advisories, lockfiles y versiones corregidas; propone PRs pequeños y nunca actualiza a ciegas.
3. **Community Abuse Defender:** detecta spam, raids, cuentas coordinadas, phishing y abuso de roles; recomienda acciones y aplica solo medidas reversibles autorizadas.
4. **Upload Inspector:** inspecciona archivos en cuarentena, metadatos, formatos, parsers y señales de contenido activo; nunca ejecuta archivos.
5. **AI/RAG Security Tester:** prueba prompt injection, poisoning, exfiltración y abuso de herramientas en entornos aislados.
6. **Incident Response Assistant:** correlaciona alertas, genera línea temporal, evidencia y pasos de contención; no rota secretos ni suspende cuentas sin aprobación humana.

Arquitectura futura:
- Ingesta de fuentes confiables (OWASP, NVD, GitHub Advisories, OSV, CISA, documentación oficial).
- Dataset propio versionado y con procedencia; separar ejemplos de entrenamiento de reglas de autorización.
- Evaluaciones con casos benignos y maliciosos, falsos positivos, regresiones y pruebas en español/inglés.
- Sandboxes sin secretos ni acceso a producción.
- Herramientas de solo lectura por defecto, scopes mínimos, logs auditables y aprobación humana para cambios.
- Ningún bot debe ejecutar payloads de malware, escanear sistemas de terceros sin permiso ni probar ataques fuera de entornos propios.

## 7. Fuentes públicas de referencia

- OWASP Top 10:2025: https://top10.owasp.org/2025/
- OWASP API Security Top 10:2023: https://api-security.owasp.org/editions/2023/en/0x11-t10/
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP LLM Prompt Injection Prevention: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- GitHub security and analysis settings: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository
- GitHub Dependency Review: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review
- Next.js advisory GHSA-2464-fhr4-w9xw: https://github.com/advisories/GHSA-2464-fhr4-w9xw
- Next.js advisory GHSA-pc58-hwjq-p385: https://github.com/advisories/GHSA-pc58-hwjq-p385
- Next.js advisory GHSA-rhh4-g77r-r9qj: https://github.com/advisories/GHSA-rhh4-g77r-r9qj
- Next.js advisory GHSA-7qx7-33qx-rqx2: https://github.com/advisories/GHSA-7qx7-33qx-rqx2
- DOMPurify advisory GHSA-cg2g-xh64-v4q7: https://github.com/advisories/GHSA-cg2g-xh64-v4q7
- sharp advisory GHSA-wq5f-xc86-pv6w: https://github.com/advisories/GHSA-wq5f-xc86-pv6w
- source-map-js CVE-2026-93749: https://github.com/advisories/GHSA-68fv-2mgg-jv7q

**Regla permanente:** no declarar PeakScore seguro por tener un escáner verde. Seguridad significa validar controles reales, probar bypasses con cuentas de prueba, revisar impacto y repetir las auditorías después de cada cambio.
