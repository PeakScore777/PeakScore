# Auditoría Institucional 02 — Reauditoría completa

Fecha: 2026-09-29/30
Repositorio: PeakScore777/PeakScore — main
Proyecto: PeakScore / Supabase
Auditoría: 2 de 2

## 1. Resultado ejecutivo

Segunda revisión independiente contra Auditoría 01 y contra el estado actual de GitHub y Supabase.

Conclusión: PeakScore todavía NO está listo para implementar el registro institucional funcional ni para producción institucional.

### Hallazgos críticos
1. institution_members.role todavía permite admin y existe 1 miembro institucional con ese rol.
2. institution_members mantiene privilegios DML para anon y authenticated, además de TRUNCATE/REFERENCES/TRIGGER innecesarios para clientes.
3. institution_verification_requests permite INSERT directo y su policy solo exige representative_user_id = auth.uid(); campos administrativos pueden ser enviados por el cliente.
4. institution_verification_documents permite INSERT directo y confía en metadata enviada por cliente.
5. No existe API/ruta de registro institucional.

### Hallazgos altos
6. No existe bucket privado específico para documentos de verificación.
7. No existe estado operativo formal de institución.
8. No existe plan institucional formal.
9. No existe capa reusable de autorización institucional.
10. No existe audit log institucional.

### Hallazgos medios
11. Supabase Advisor mantiene 6 WARN por SECURITY DEFINER ejecutables por authenticated.
12. Leaked Password Protection continúa deshabilitada.
13. DEFAULT PRIVILEGES públicos siguen siendo amplios y requieren hardening controlado.
14. Importación PDF valida inicialmente file.type; conviene validar también contenido/firma real.

## 2. Comparación con Auditoría 01

GitHub fue comparado desde el commit de Auditoría 01 hasta main.

Resultado:
- main está idéntico al commit de Auditoría 01.
- No existen commits posteriores.
- No existen cambios de código entre auditorías.

La base de datos contiene migraciones de seguridad acumuladas para rate limit, profiles, simulaciones, reference RLS, Storage, grants e índices.

Conclusión: la Auditoría 02 es una reauditoría independiente del mismo código y una nueva inspección directa de Supabase.

## 3. Estado actual de Supabase

Tablas institucionales:
- institutions: 1 fila.
- institution_members: 1 fila.
- institution_verification_requests: 0 filas.
- institution_verification_documents: 0 filas.

Roles:
- profiles: 1 admin, 10 user.
- institution_members: 1 admin.

Existe una institución de prueba llamada PeakScore con code nulo.

Hallazgo: la presencia de institution_members.role = admin continúa confirmada. No debe usarse como modelo para la nueva autorización.

## 4. Modelo de roles

Global: profiles.role = user | admin.

Institucional: student, teacher, coordinator, rector, admin.

El modelo final debe separar:

profiles.role → privilegios globales de PeakScore
institution_members.role → privilegios dentro de una institución

Un rector no debe obtener profiles.role = admin.
Un rol institucional no debe servir como puerta trasera para administración global.

## 5. RLS institucional

### institutions
Existe SELECT para usuarios autenticados cuando existe una membresía del usuario sobre la institución.
No existe INSERT/UPDATE/DELETE RLS para usuarios normales.
Resultado: la creación debe ser server-side.

### institution_members
Existe SELECT para la propia membresía.
No existe CRUD RLS normal para crear/modificar membresías arbitrariamente.
Resultado: buena base, pero grants excesivos siguen pendientes de hardening.

### institution_verification_requests
SELECT propio: presente.
SELECT admin: presente.
UPDATE admin: presente.

INSERT propio actualmente comprueba únicamente representative_user_id = auth.uid().

Eso no garantiza que el cliente no intente establecer institution_id, verification_status, reviewed_by, reviewed_at, internal_review_notes, submitted_at o updated_at.

Los CHECK constraints limitan valores inválidos, pero no sustituyen una creación server-side.

### institution_verification_documents
SELECT propio, SELECT admin y UPDATE admin existen.
INSERT propio comprueba que la solicitud pertenezca al representante y esté pending o changes_requested.

Pero el cliente todavía puede intentar proporcionar storage_path, original_file_name, mime_type, file_size_bytes y file_hash.

El backend debe construir y validar esos valores.

## 6. Grants — hallazgo confirmado

institution_members mantiene para anon y authenticated:
- SELECT
- INSERT
- UPDATE
- DELETE
- REFERENCES
- TRIGGER
- TRUNCATE

Las tablas institucionales nuevas también mantienen privilegios administrativos innecesarios como TRUNCATE, REFERENCES y TRIGGER.

RLS no debe considerarse sustituto de privilegios de tabla como TRUNCATE.

Esto no significa automáticamente que todos esos privilegios sean explotables mediante PostgREST, pero sí demuestra que no existe mínimo privilegio.

Acción: no hacer REVOKE masivo a ciegas. Primero mapear operaciones reales y luego aplicar una migración controlada.

## 7. DEFAULT PRIVILEGES

Los DEFAULT PRIVILEGES públicos continúan otorgando ACL amplias a roles de aplicación para objetos futuros.

Esto puede provocar que una tabla futura herede permisos innecesarios.

Debe hacerse hardening global de defaults en una fase separada y controlada.

## 8. SECURITY DEFINER

Las funciones SECURITY DEFINER revisadas usan search_path vacío, lo cual es una medida correcta.

Supabase Advisor mantiene 6 WARN para funciones SECURITY DEFINER ejecutables por authenticated:
- consume_api_rate_limit
- delete_user_simulation
- finish_simulation_atomic
- get_subject_performance_for_attempts
- save_simulation_progress_atomic
- update_user_streak

No deben eliminarse automáticamente.

Cada una debe revisarse para confirmar quién puede ejecutarla, parámetros, tablas leídas/modificadas, validación de auth.uid(), aislamiento entre usuarios, necesidad real de SECURITY DEFINER y necesidad de EXECUTE para authenticated.

## 9. Auth

La aplicación usa Supabase Auth, @supabase/ssr, getClaims() en proxy, getUser() server-side y Turnstile.

requireAdmin() comprueba usuario autenticado y profiles.role = admin.

La protección de roles mediante triggers/migraciones existentes mejora la seguridad.

Para producción administrativa se recomienda posteriormente MFA y reautenticación para operaciones críticas.

## 10. Leaked Password Protection

Supabase Advisor continúa reportando Leaked Password Protection Disabled.

Debe habilitarse antes de producción cuando la configuración/plan lo permita.

## 11. Storage

Buckets actuales:
- question-images: público, 10 MB, PNG/JPEG/WebP.
- reference-pdfs: privado, 30 MB, PDF.

No existe bucket institucional.

Los documentos de identidad o representación no deben reutilizar question-images.

Debe existir un bucket privado dedicado, conceptualmente:

~~~
institution-verification/<verification-request-id>/<document-id>
~~~

El path debe ser generado por servidor y no depender de una ruta arbitraria enviada por cliente.

## 12. API institucional

El árbol actual de app/api contiene APIs de generación de preguntas, generación por lote, importación PDF, simulaciones, progreso, finalización, eliminación y preguntas de simulacro.

No existen APIs para crear institución, crear solicitud institucional, subir documento institucional, consultar estado, aprobar o activar plan institucional.

Conclusión: el backend institucional todavía no existe.

## 13. Revisión de APIs existentes

### Generación de preguntas
Autenticación server-side, comprobación de admin y rate limit presentes.

### Importación PDF
Se verificó autenticación, admin, rate limit, límite de 30 MB, materia/sesión/documentMode permitidos, hash SHA-256, Storage privado reference-pdfs, sanitización de nombre y fallback de IA.

Hallazgo medio: file.type es una declaración del cliente. Para hardening conviene validar firma/contenido real del PDF antes del procesamiento.

### Simulaciones
El endpoint autentica primero, valida entrada, aplica rate limit y solo después utiliza service role.

Los endpoints de preguntas, progreso, finalización y eliminación verifican propiedad o usan RPCs atómicas con controles internos.

Patrón reutilizable: identidad → autorización → operación privilegiada.

## 14. Aislamiento multiinstitución

La regla debe ser:

~~~
auth.uid()
↓
institution_members
↓
institution_id autorizado
↓
recurso institucional
~~~

Nunca confiar en institution_id, user_id, role, owner_id o reviewer_id enviados por el cliente.

Para estudiantes:

~~~
usuario autenticado
↓
membresía
↓
institución
↓
estudiante
↓
progreso/simulaciones
~~~

## 15. Verificación del representante

No basta con declarar que alguien es rector.

Flujo correcto:

~~~
persona autenticada
↓
representante declarado
↓
evidencia
↓
revisión
↓
institución aprobada
↓
membresía activa
↓
plan activo
~~~

No activar automáticamente privilegios de rector solo por el formulario.

## 16. Estados

verification_status ya existe en la solicitud.

institutions no tiene estado operativo formal.

Debe separarse solicitud, aprobación, activación, suspensión y plan/facturación.

Una solicitud approved no implica necesariamente plan activo.

## 17. Plan institucional

subscriptions continúa siendo user-level.

El producto institucional necesita conceptualmente:

~~~
institution
↓
institution_plan
↓
entitlements
↓
members
~~~

No usar student.is_premium como sustituto del plan institucional.

## 18. Datos de estudiantes y menores

Aplicar minimización.

Candidatos: nombre, apellido, grado, grupo, código interno escolar y correo cuando exista finalidad concreta. Documento solamente si realmente es necesario.

Evitar datos sensibles o ajenos a la finalidad educativa.

La Ley 1098 de 2006 reconoce el derecho a la intimidad de niños, niñas y adolescentes y contiene obligaciones especiales para instituciones educativas.

Antes de producción deben definirse Responsable, Encargado, finalidades, autorización, conservación, acceso, eliminación, ejercicio de derechos, incidentes y transmisiones.

## 19. Retención y eliminación

Todavía no está definido:
- tiempo de conservación de documentos;
- eliminación de solicitudes rechazadas;
- eliminación de documentos reemplazados;
- cierre de una institución;
- datos que deben conservarse;
- datos que pueden anonimizarse.

Requisito: definir retención antes de comenzar a almacenar documentos reales.

## 20. Audit log

No existe todavía audit log institucional.

Debe registrar eventos de alto impacto:
- solicitud creada;
- documento cargado/reemplazado;
- solicitud enviada;
- cambios solicitados;
- aprobación/rechazo;
- membresía creada;
- rol cambiado;
- estudiante importado;
- estudiante eliminado;
- exportación;
- reporte;
- cambios de seguridad.

Guardar el mínimo necesario.

## 21. Ataques revisados

### Cambiar institution_id
Control requerido: resolver institución desde membership.
Estado: pendiente porque no existe endpoint.

### Crear role=rector
Control requerido: workflow autorizado.
Estado: pendiente.

### Crear role=admin institucional
Control requerido: eliminar ese rol del modelo y bloquearlo.
Estado: pendiente.

### Aprobar desde navegador
Control requerido: endpoint administrativo + autorización.
Estado: no existe workflow.

### Manipular reviewed_by
Control requerido: servidor usa identidad del revisor.
Estado: pendiente.

### Manipular Storage path
Control requerido: servidor genera path.
Estado: pendiente.

### Leer documento de otra institución
Control requerido: request → institution → autorización.
Estado: Storage institucional todavía no existe.

### Modificar solicitud después de enviada
El usuario no tiene UPDATE propio actualmente. Esto reduce superficie, pero el workflow changes_requested debe diseñarse.

### Duplicar solicitud
Control actual: índice único parcial para pending/under_review.
Estado: presente.

### Flood de solicitudes
Infraestructura rate limit existe, pero falta bucket específico institucional.

## 22. Datos actuales

No existen solicitudes ni documentos de verificación.

Existe una institución de prueba llamada PeakScore y un miembro institucional admin.

Antes de producción debe determinarse si esos datos son desarrollo, prueba, históricos o datos que deben migrarse/eliminarse.

## 23. Seguridad HTTP

next.config.ts incluye HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP, CORP y CSP.

Esto es una buena base.

CSP utiliza unsafe-inline en scripts y estilos. No cambiarlo a ciegas porque puede afectar Next.js, Turnstile o componentes existentes. El endurecimiento debe hacerse después con pruebas.

## 24. Rutas institucionales

No existen /institution/register, /institution/status, /institution/dashboard ni APIs institucionales.

No existe actualmente una ruta institucional olvidada que exponga información.

El riesgo aparecerá al implementarlas; por eso autorización y RLS deben diseñarse primero.

## 25. Arquitectura aprobada

~~~
CUENTA PEAKSCORE
↓
AUTH VERIFICADO
↓
/institution/register
↓
POST /api/institution/register
↓
auth.uid()
↓
Turnstile + rate limit
↓
validación server-side
↓
crear institución
↓
crear solicitud
↓
/institution/status
↓
revisión administrativa
↓
approved
↓
activar institución
↓
crear/activar membresía
↓
plan institucional
↓
/institution/dashboard
~~~

El navegador nunca debe ser autoridad para roles, propietarios, institución, aprobación o reviewer.

## 26. Orden obligatorio

1. Resolver roles.
2. Aplicar mínimo privilegio en grants.
3. Crear capa server-side de autorización institucional.
4. Definir estado operativo, membresías, plan y datos mínimos.
5. Crear Storage privado institucional.
6. Crear endpoint transaccional de registro.
7. Implementar documentos con validación server-side.
8. Crear consulta segura de estado.
9. Crear revisión y aprobación.
10. Crear panel solamente después de cerrar aislamiento.

## 27. Criterios para comenzar

- admin eliminado/migrado del modelo institucional.
- creación/modificación arbitraria de membresías bloqueada.
- grants institucionales en mínimo privilegio.
- solicitud creada server-side.
- estado administrativo no controlable por cliente.
- reviewer no controlable por cliente.
- Storage institucional privado.
- path generado por servidor.
- MIME/tamaño/hash validados server-side.
- rate limit institucional.
- estado institucional definido.
- plan institucional definido.
- retención definida.
- audit log definido.
- aislamiento multiinstitución probado.
- IDOR/BOLA probado.

## 28. Veredicto técnico

NO comenzar todavía a crear /institution/register.

Las auditorías confirman este orden:

~~~
1. ROLES
2. GRANTS
3. AUTHORIZATION
4. RLS
5. STORAGE
6. WORKFLOW
7. PRIVACIDAD/RETENCIÓN
8. API
9. UI
~~~

Estado:
- Base técnica existente: buena.
- Hardening general: pendiente en puntos importantes.
- Registro institucional: NO listo para implementación funcional.
- Producción institucional: NO lista.

Fuentes de privacidad revisadas: Ley 1098 de 2006, Función Pública, y material oficial de la Superintendencia de Industria y Comercio. Estas fuentes orientan el diseño y no sustituyen revisión jurídica profesional.

**Auditoría 02 finalizada.**