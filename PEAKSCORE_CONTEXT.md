# PeakScore — Contexto técnico vivo

> Fuente de verdad del estado técnico del proyecto. Actualizar este archivo cuando cambie una decisión, arquitectura, seguridad o flujo importante.

## Proyecto
- Nombre: PeakScore.
- Plataforma: preparación PreICFES/ICFES para Colombia.
- Repositorio: PeakScore777/PeakScore.
- Rama principal: main.
- No reconstruir el proyecto desde cero.
- No inventar archivos, tablas, endpoints, funciones o componentes. Primero verificar el repositorio/BD.
- Preferencia de trabajo: cambios pequeños, verificables y reversibles.

## Stack confirmado
- Next.js 16.2.12, App Router.
- React 19.2.4.
- TypeScript.
- Tailwind CSS v4.
- Supabase SSR + PostgreSQL.
- Framer Motion.
- PostHog.
- Turnstile.
- OpenAI / Google GenAI para IA.
- Vercel para despliegue.

## Seguridad actual
- CSP y headers de seguridad configurados en next.config.ts.
- Service Role de Supabase solo en servidor.
- Login/register/recovery usan Turnstile.
- APIs sensibles validan usuario autenticado.
- Finalización de simulacros usa RPC atómico y calcula resultados en servidor.
- Las preguntas enviadas al cliente durante un simulacro excluyen correct_answer y explanation.
- Existe CodeQL y Dependabot.
- .env* está ignorado por Git.
- Supabase SSR ahora tiene proxy.ts + lib/supabase/proxy.ts para refresco de sesión.
- lib/ai/openai.ts usa server-only.
- El rate limiter ahora define los límites por bucket dentro de la función SECURITY DEFINER; los parámetros de límite/ventana enviados por el cliente ya no controlan la política efectiva.
- Todos los SECURITY DEFINER actuales usan search_path='' tras revisión de sus definiciones.
- No guardar secretos reales en este archivo.

## Auth / roles
- profiles.role: user | admin; admin representa exclusivamente al dueño global de la plataforma.
- institution_members.role: student | teacher | coordinator | rector | admin; este admin es institucional y NO concede privilegios globales de plataforma.
- user_roles: admin | student; actualmente sin filas confirmadas y pendiente de mapear usos antes de eliminar/unificar.
- profiles solo tiene SELECT para el propio usuario mediante RLS; no existe política RLS de INSERT/UPDATE/DELETE para usuarios autenticados.
- El trigger prevent_profile_privilege_changes() es SECURITY DEFINER, usa search_path='' y bloquea al propio usuario de modificar campos protegidos como role, email y métricas del perfil.
- Se verificó la definición de handle_new_user(); es SECURITY DEFINER con search_path='' y crea el perfil inicial sin asignar role=admin.
- Grants de profiles y user_roles para anon/authenticated fueron reducidos en Supabase: no se permite escritura directa ni privilegios administrativos innecesarios desde esos roles. El acceso SELECT queda sujeto a las políticas RLS existentes.

## Simulacros
- simulations, simulation_questions, simulation_attempts y simulation_answers existen.
- simulation_attempts ahora tiene total_questions, current_question y time_left para soportar el flujo de progreso/resume.
- Hay un índice único parcial para impedir más de un intento abierto por usuario/simulacro.
- /api/simulations/[id]/questions filtra campos sensibles.
- /api/simulations/[id]/finish usa finish_simulation_atomic.
- El RPC save_simulation_progress_atomic ahora persiste current_question/time_left y valida ownership, límites, estructura de respuestas, duplicados y pertenencia de preguntas.

## Reference / IA
- Existen reference_sources, reference_analyses, reference_profiles, reference_questions, reference_sets y reference_set_questions.
- El corpus de referencia está restringido por RLS al propietario y al dueño global de plataforma (profiles.role = admin). institution_members.role NO concede privilegios de plataforma.
- generate-questions y generate-question-batch son rutas administrativas.

## Storage
- question-images es público para lectura, pero solo el dueño global de plataforma (profiles.role = admin) puede subir.
- reference-pdfs es privado; solo el dueño global puede subir, leer y borrar. Bucket limitado a PDF y 30 MB.
- No cambiar URLs de imágenes/branding sin comprobar referencias.

## Recuperación de contraseña
- CORREGIDO: /forgot-password mantiene Turnstile, respuesta genérica para no revelar si una cuenta existe y ahora maneja excepciones sin exponer detalles de Auth.
- CORREGIDO: /update-password valida el flujo de recuperación antes de permitir cambiar la contraseña.
- El flujo soporta el código PKCE devuelto por Supabase mediante exchangeCodeForSession() y elimina el código de la URL después del intercambio.
- Se valida que exista una sesión recuperada antes de ejecutar updateUser({ password }).
- La nueva contraseña exige mínimo 15 caracteres, mayúscula, minúscula, número y símbolo.
- Después de un cambio correcto se revocan las sesiones globales y se obliga a iniciar sesión nuevamente.
- Los errores de enlace expirado/inválido se muestran de forma genérica y ofrecen solicitar otro enlace.
- Pendiente manual Supabase: revisar Auth URL Configuration para que /update-password esté en Redirect URLs y revisar expiración/configuración del correo de recuperación.

## Sesión SSR
- CORREGIDO: se añadió proxy.ts en la raíz y lib/supabase/proxy.ts.
- proxy.ts delega en updateSession().
- lib/supabase/proxy.ts crea el cliente SSR, sincroniza cookies request/response y ejecuta supabase.auth.getClaims() para refrescar/verificar la sesión.
- El matcher excluye recursos estáticos e imágenes comunes.
- El dashboard mantiene su comprobación server-side con getUser(); el proxy no reemplaza las autorizaciones de cada ruta.

## Pendientes prioritarios
- [ ] Resolver mapa definitivo de roles/usos de user_roles e institution_members.
- [x] Endurecer RLS/reference_*.
- [x] Endurecer Storage.
- [x] Corregir esquema/RPC base de progreso/resume de simulacros.
- [x] Endurecer rate limiter para ignorar límites elegibles por el cliente.
- [x] Endurecer search_path de todas las funciones SECURITY DEFINER revisadas.
- [ ] Revisar grants de anon/authenticated en el resto de tablas.
- [ ] Revisar índices FK según consultas reales.
- [ ] Completar auditoría histórica de secretos.
- [ ] Revisar protección de main/CI cuando el flujo de desarrollo lo permita.
- [ ] Leaked Password Protection: pendiente por disponibilidad del plan Free; disponible en Pro y superiores.

## No tocar sin motivo
- Diseño/branding actual y logo peakscore-logo-transparente2.png.
- CSP/headers actuales salvo error comprobado.
- finish_simulation_atomic sin antes mapear dependencias.
- Parser/renderer matemático seguro.
- Estructura general existente.

## Regla de cambios
Antes de modificar:
1. Leer el archivo actual.
2. Buscar referencias.
3. Verificar BD si afecta Supabase.
4. Hacer el cambio mínimo.
5. Ejecutar/verificar build o checks disponibles.
6. Actualizar este archivo y PEAKSCORE_CHANGELOG.md con lo confirmado.


## Auditoría actual — rutas administrativas
- CORREGIDO: se añadieron layouts server-side para /dashboard/question-bank y /dashboard/import-pdf usando requireAdmin(). Esto protege todas sus subrutas antes de renderizar la UI.
- Las APIs /api/generate-questions, /api/generate-question-batch y /api/import.pdf ya validan profiles.role = admin server-side; no se sustituyeron.
- CORREGIDO MANUALMENTE EN SUPABASE: las políticas RLS de questions para SELECT/INSERT/UPDATE/DELETE ahora verifican profiles.id = auth.uid() y profiles.role = 'admin'. Ya no dependen de institution_members para conceder privilegios sobre questions.
- CORREGIDO MANUALMENTE EN VSC: StatCard.tsx referencia /dashboard/racha-pixel.webp. Este cambio fue realizado manualmente por el usuario; no debe tratarse como una corrección de código realizada por el asistente. Mantenerlo al sincronizar VSC → GitHub.
- No crear paneles ni permisos institucionales; institution_members se trata como estructura futura/legacy hasta mapear dependencias.

- CORREGIDO: Sidebar ahora verifica el administrador global mediante profiles.role = admin, no institution_members.
- CORREGIDO: /dashboard/question-bank/page.tsx ahora usa profiles.role = admin para su comprobación client-side, consistente con el layout server-side y requireAdmin().
- CORREGIDO: enlace del Panel de administración a Importar PDF apuntaba a una ruta inexistente; ahora apunta a /dashboard/import-pdf.


## Advisor Supabase — 2026-09-29
- Security Advisor: 1 INFO esperado: api_rate_limits tiene RLS sin políticas porque debe ser accesible solo mediante la función SECURITY DEFINER de rate limit.
- Security Advisor: 6 WARN de funciones SECURITY DEFINER ejecutables por authenticated. Se consideran intencionales y protegidas internamente; no revocar EXECUTE sin refactorizar sus llamadas.
- Security Advisor: 1 WARN pendiente manual: Leaked Password Protection está desactivado en Supabase Auth.
- No se aplicó ningún cambio adicional a estas alertas en esta ronda.


## Estado de sincronización — 2026-09-29
- Punto de control: los cambios de seguridad documentados hasta la auditoría del 2026-09-29 están en `main`.
- Próximo paso operativo: sincronizar `main` con la copia local de VSC antes de realizar tareas manuales de Supabase o nuevos cambios de código.
- No se considera completada la sincronización local hasta verificarla en VSC.


## Supabase Auth — Leaked Password Protection
- Verificado en el dashboard actual del proyecto que la opción no aparece en el plan Free.
- Confirmado en la documentación oficial de Supabase que Leaked Password Protection está disponible en Pro y superiores.
- Estado: pendiente por disponibilidad del plan; no se realizará ningún cambio de plan por esta alerta.


### RLS questions — 2026-09-29
- Se verificaron las 4 políticas existentes de public.questions antes del cambio.
- Se reemplazaron manualmente en Supabase las políticas SELECT, INSERT, UPDATE y DELETE.
- Las cuatro ahora autorizan exclusivamente al dueño global mediante public.profiles (id = auth.uid() y role = 'admin').
- Se confirmó directamente en pg_policies que ninguna de las cuatro políticas usa institution_members.
- No se modificó institution_members ni se creó ninguna funcionalidad institucional.


## Auditoría de grants — 2026-09-29
- Se auditó directamente information_schema.role_table_grants, pg_class.relacl y pg_default_acl para las tablas públicas.
- Hallazgo importante: anon y authenticated conservan privilegios Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) sobre múltiples tablas públicas. En varias tablas authenticated también conserva CRUD completo.
- RLS está habilitado en las 20 tablas públicas auditadas, pero RLS no controla operaciones de tabla completa como TRUNCATE ni REFERENCES; por tanto, esos privilegios no deben considerarse protegidos por las políticas RLS. PostgreSQL documenta que TRUNCATE y REFERENCES no están sujetos a RLS.
- Los privilegios amplios parecen provenir también de DEFAULT PRIVILEGES del rol postgres para tablas nuevas: anon= Dxtm y authenticated=Dxtm. Esto debe corregirse después de mapear las operaciones reales del código para no romper el producto.
- No se revocó ningún grant en esta ronda.
- Siguiente paso: mapear por tabla las operaciones reales usadas por PeakScore y reducir privilegios a mínimo necesario, incluyendo corregir DEFAULT PRIVILEGES para futuras tablas.


## Mapeo de uso de grants — 2026-09-29
- Se revisó el código actual del repositorio para mapear las tablas públicas antes de revocar permisos.
- profiles: acceso de navegador mediante lib/services/profile.service.ts y comprobaciones de rol; RLS limita SELECT al propio perfil. No requiere DML del cliente.
- questions: usado por question.service.ts para CRUD del banco administrativo y por servicios/API de simulacros; las rutas administrativas usan autorización de admin y algunas APIs usan service_role. RLS actual limita el acceso administrativo global a profiles.role='admin'.
- subjects: usado como catálogo de materias; la política actual permite SELECT a authenticated. No se observó necesidad de DML del cliente.
- simulations: leído desde el cliente y manipulado en APIs de servidor; la creación normal usa service_role después de autenticar al usuario. Las políticas actuales permiten al usuario ver/eliminar sus propios simulacros; no hay políticas de INSERT/UPDATE para usuarios.
- simulation_questions: leído por el flujo de simulacros; creación/eliminación se realiza en APIs/servicios privilegiados según el código revisado. La política cliente actual es SELECT condicionado al propietario del simulacro.
- simulation_attempts: el dashboard y flujo de simulacro leen intentos propios; el progreso/creación usa endpoints y RPCs. Las políticas actuales permiten INSERT/SELECT del propio usuario; otras escrituras directas no tienen políticas cliente equivalentes.
- simulation_answers: el cliente consulta respuestas propias para rendimiento; el guardado/actualización del progreso se realiza mediante RPC atómica. La política cliente visible es SELECT de respuestas pertenecientes a intentos propios.
- reference_sources: usado por importación PDF y procesamiento de referencia; la importación usa tanto cliente autenticado como service_role para operaciones administrativas internas. RLS limita el acceso a uploaded_by y el admin global.
- reference_questions: usado por importación/generación de referencia; INSERT está restringido por ownership del source y SELECT por ownership/admin. La limpieza masiva durante importación usa service_role.
- reference_analyses: INSERT/SELECT/UPDATE/DELETE para análisis propios; RLS limita user_id al usuario autenticado. Es un caso donde authenticated necesita CRUD, pero no privilegios de administración de tabla como TRUNCATE/REFERENCES/TRIGGER/MAINTAIN.
- reference_profiles/reference_sets/reference_set_questions: acceso principalmente de lectura condicionado por owner/admin y escritura interna/privilegiada según el flujo de importación. No hay necesidad demostrada de TRUNCATE/REFERENCES/TRIGGER/MAINTAIN para los roles de aplicación.
- student_progress: actualmente solo se observa SELECT para el propio usuario desde RLS; las escrituras se realizan mediante lógica/RPC/servidor según el código auditado. No se justifican privilegios de tabla amplios para anon/authenticated.
- subscriptions: RLS actual permite SELECT del propio user_id; no se observó necesidad de DML del cliente en el código auditado.
- institution_members/institutions: existen en la BD y tienen grants amplios, pero NO se desarrollará ni modificará el sistema institucional en esta auditoría. Se mantienen fuera del cambio hasta mapear dependencias históricas con precisión.
- user_roles: existe como estructura legacy/pendiente de mapeo; authenticated solo tiene UPDATE según ACL y RLS SELECT propio. No se modificará hasta decidir su futuro junto con sus referencias.
- Hallazgo transversal: los permisos Dxtm (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) de anon/authenticated son más amplios de lo necesario para la aplicación y no deben considerarse protegidos por RLS. Se revocarán solo después de cerrar el inventario de dependencias y confirmar que no existen operaciones que los requieran.
- También existen DEFAULT PRIVILEGES del rol postgres que conceden Dxtm a anon/authenticated para nuevas tablas; debe corregirse después de definir el modelo mínimo de grants.


## Auditoría global de seguridad — 2026-09-29 — reconocimiento sin correcciones

### Alcance
- Auditoría realizada contra el estado real de GitHub `main` y el proyecto Supabase activo de PeakScore.
- Se revisaron autenticación/autorización administrativa, RLS, Storage, SECURITY DEFINER, triggers, grants, DEFAULT PRIVILEGES, APIs sensibles, headers/CSP, estructura de instituciones y estado de migraciones.
- Esta fase es exclusivamente de reconocimiento/documentación. No se aplicaron correcciones de código ni cambios de esquema durante esta auditoría.
- El panel institucional creado localmente durante esta fecha NO está presente en el `main` auditado. Por tanto, su código local aún no puede considerarse auditado hasta que esté disponible para revisión.

### 🟢 Correcto / controles confirmados
- Supabase reporta exactamente 1 perfil con `role='admin'`, y el correo de ese perfil coincide exactamente con `aragonyostynsena07@gmail.com`.
- Las políticas RLS actuales de `questions` para SELECT/INSERT/UPDATE/DELETE dependen de `profiles.id = auth.uid()` y `profiles.role='admin'`; no usan `institution_members.role`.
- Las tablas públicas auditadas tienen RLS habilitado.
- Las funciones SECURITY DEFINER existentes revisadas tienen `search_path=''\` y las funciones RPC de usuario verifican `auth.uid()`/ownership antes de operar.
- `handle_new_user()` crea perfiles sin asignar `role='admin'`.
- `prevent_profile_privilege_changes()` protege cambios directos de campos sensibles del perfil y el acceso RLS de `profiles` no concede escritura directa a usuarios autenticados.
- Las APIs administrativas revisadas comprueban autenticación y `profiles.role='admin'` en servidor; no dependen únicamente de la UI.
- Los headers/CSP de `next.config.ts` incluyen HSTS, nosniff, frame-ancestors/X-Frame-Options, Referrer-Policy, Permissions-Policy y CSP.

### 🟡 Riesgos / mejoras pendientes
1. **Admin canónico no aplicado como segunda barrera**
   - `lib/auth/admin.ts` autoriza mediante `profiles.role='admin'` pero no exige el correo canónico.
   - Las rutas `/api/generate-questions`, `/api/generate-question-batch` y `/api/import.pdf` también comprueban el role, pero no la identidad canónica.
   - Estado actual de datos: solo existe un admin y coincide con el correo canónico, por lo que no se observa una escalada activa; sin embargo, el modelo todavía no implementa la regla de doble condición exigida para el dueño global.
   - Corrección futura: una única comprobación server-side reutilizable que exija usuario autenticado + identidad canónica + `profiles.role='admin'`, y que también sea reflejada en las políticas RLS administrativas donde corresponda.

2. **Grants excesivos en PostgreSQL**
   - `anon` y `authenticated` conservan `TRUNCATE`, `REFERENCES` y `TRIGGER` sobre numerosas tablas públicas; en varias tablas `authenticated` conserva además CRUD completo.
   - Estos privilegios no deben considerarse protegidos por RLS: operaciones como TRUNCATE/REFERENCES no están gobernadas por las policies de filas.
   - Además, DEFAULT PRIVILEGES del rol `postgres` conceden `Dxtm` a `anon` y `authenticated` para tablas públicas nuevas.
   - Estado: **no corregir todavía**. Primero terminar el mapa de operaciones reales y dependencias, especialmente ahora que se está incorporando el sistema institucional.

3. **Institutional surface requiere auditoría específica**
   - La BD ya contiene `institutions` y `institution_members`; actualmente hay 1 institución y 1 miembro.
   - Las policies visibles actuales son conservadoras para lectura y no conceden DML directo mediante RLS a usuarios autenticados.
   - Sin embargo, los grants de tabla son amplios, por lo que el sistema institucional debe auditarse antes de habilitar operaciones de creación/edición/asignación de miembros.
   - El código del nuevo panel institucional local todavía no está en `main`; no se debe asumir que sus Server Actions/API/RPC están protegidos.

4. **Funciones SECURITY DEFINER expuestas**
   - Security Advisor mantiene 6 funciones ejecutables por `authenticated`.
   - No se consideran automáticamente vulnerables: las funciones revisadas validan autenticación/ownership y tienen `search_path=''\`.
   - Deben seguir auditándose cada vez que se agregue una RPC nueva, especialmente las relacionadas con instituciones y administración.

5. **Leaked Password Protection**
   - Sigue como WARN de Supabase Auth y pendiente por disponibilidad del plan actual.
   - No cambiar plan automáticamente.

### 🔴 No se confirmó una vulnerabilidad explotable durante esta fase
- No se encontró un segundo perfil con `role='admin'`.
- No se encontró evidencia, en las estructuras revisadas, de que `institution_members.role='admin'` esté concediendo actualmente administración global.
- No se encontró una función SECURITY DEFINER sin `search_path=''\` entre las funciones revisadas.
- Esto NO significa que PeakScore esté terminado: los grants excesivos y la ausencia de identidad canónica en la autorización global siguen siendo superficies que deben endurecerse.

### Prioridad siguiente
1. Auditar el código local no sincronizado del nuevo panel institucional.
2. Cerrar el modelo de autorización institucional: qué puede hacer student/teacher/coordinator/rector y qué nunca puede hacer respecto al sistema global.
3. Implementar después el blindaje de admin canónico con cambio mínimo.
4. Continuar con mínimo privilegio de grants y DEFAULT PRIVILEGES, verificando dependencias antes de revocar.
5. Repetir Security Advisor y pruebas negativas después de cada cambio.

### Regla operativa añadida
Toda nueva función, API, Server Action, RPC, policy o Storage policy debe evaluarse como si un atacante tuviera acceso directo a la URL/API/REST/RPC y conociera los IDs internos. Nunca considerar una página oculta o un botón deshabilitado como control de seguridad.

## Sincronización VSC ↔ GitHub — 2026-09-29

- Se verificó el estado real de `main` después de la sincronización.
- El commit local `7a6cf0d` se integró con los commits que estaban en GitHub mediante el merge `3134214f5b1bc235b7fb567a53d0f4e61d1beb50`.
- El merge se completó sin conflictos.
- El push posterior terminó correctamente con `main -> main`.
- Verificación actual en GitHub: `components/dashboard/StatCard.tsx` usa `/dashboard/racha-pixel.webp`.
- Estado: GitHub `main` contiene el cambio local y los cambios previos de seguridad/documentación.
- Antes de continuar con nuevas modificaciones, verificar primero el estado real de GitHub y VSC.

## Base de verificación institucional — verificada en Supabase

- Se crearon y verificaron `institution_verification_requests` e `institution_verification_documents` como base para la futura verificación institucional.
- `institution_verification_requests` permite estados `pending`, `under_review`, `approved`, `changes_requested` y `rejected`.
- Se creó un índice único parcial para impedir más de una solicitud activa por institución en estados `pending` o `under_review`.
- RLS está habilitado en ambas tablas.
- El flujo frontend de registro institucional todavía no está implementado.
- La creación sensible de solicitudes y datos institucionales debe pasar por backend/server-side con validación estricta antes de producción.
- El registro normal de usuarios permanece separado del registro institucional.
- No se debe asumir que las tablas de verificación por sí solas constituyen un sistema completo de registro institucional.
