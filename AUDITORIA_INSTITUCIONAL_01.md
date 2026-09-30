# Auditoría Institucional 01 — Registro institucional PeakScore

**Fecha:** 2026-09-29
**Repositorio:** PeakScore777/PeakScore — `main`
**Proyecto Supabase:** PeakScore
**Tipo:** auditoría de reconocimiento y diseño previo a implementación
**Auditoría:** 1 de 2 solicitadas

> Esta auditoría documenta el estado real antes de implementar el registro institucional. No se aplicaron cambios de código, esquema, RLS, grants ni Storage como parte de esta auditoría; solamente se registra este documento.

---

## 1. Objetivo

Verificar si PeakScore está preparado para construir de forma segura el registro institucional, verificación del representante, documentos, estado de solicitud, activación posterior y futuro panel institucional.

Objetivos de seguridad:
- Evitar IDOR/BOLA y acceso cruzado entre instituciones.
- Evitar escalada de privilegios y suplantación de rector/representante.
- No confiar en `institution_id`, roles ni estados enviados por el navegador.
- Proteger documentos de verificación.
- Separar claramente administración global de administración institucional.
- Minimizar los datos personales de estudiantes.

## 2. Código y arquitectura actuales

### Stack confirmado
- Next.js 16.2.12.
- React 19.2.4.
- TypeScript 5.
- Tailwind CSS 4.
- Supabase JS 2.112.0.
- `@supabase/ssr` 0.12.4.
- Turnstile.
- Lucide React y Framer Motion.

### SSR/Auth
Existen `proxy.ts`, `lib/supabase/proxy.ts`, `lib/supabase/server.ts` y `lib/supabase/browser.ts`.

`lib/supabase/proxy.ts` usa `supabase.auth.getClaims()` para la sesión SSR. El cliente servidor usa cookies mediante `@supabase/ssr`.

**Conclusión:** la base SSR es adecuada para proteger las nuevas rutas institucionales.

### Superficie institucional actual
No existen en `main`:
- `app/institution/register/page.tsx`
- `app/institution/status/page.tsx`
- `app/institution/dashboard/page.tsx`
- una API institucional dedicada.

Por tanto, el panel institucional todavía no está implementado.

## 3. Modelo de roles

### Global
`profiles.role` acepta `user` y `admin`.

El modelo acordado es que `profiles.role = admin` represente exclusivamente al administrador/dueño global de PeakScore.

### Institucional
`institution_members.role` actualmente acepta:
- `student`
- `teacher`
- `coordinator`
- `rector`
- `admin`

### 🔴 Hallazgo crítico
Existe actualmente un miembro en `institution_members` con rol `admin`.

Esto contradice el modelo de seguridad acordado: el `admin` institucional no debe existir como fuente de privilegios globales.

**Acción futura:** mapear ese registro, determinar su finalidad histórica y migrarlo antes de producción. No ejecutar la migración todavía.

## 4. Tabla `institutions`

Columnas confirmadas:
- `id UUID PK`
- `name TEXT NOT NULL`
- `code TEXT UNIQUE`
- `created_at TIMESTAMPTZ`

RLS está habilitado.

La tabla todavía no tiene un modelo completo de institución verificada. No contiene estado operativo, NIT, dirección, ciudad, tipo, contacto, plan o configuración.

**Decisión:** no agregar campos indiscriminadamente. Primero separar qué pertenece a institución, solicitud, contacto, plan y configuración.

## 5. Tabla `institution_members`

Columnas:
- `id UUID PK`
- `user_id UUID`
- `institution_id UUID`
- `role TEXT`
- `created_at TIMESTAMPTZ`

FK:
- `user_id -> auth.users.id`
- `institution_id -> institutions.id`

Existe unique `(user_id, institution_id)` e índices por `user_id` e `institution_id`.

La relación básica es adecuada para aislamiento, pero todavía faltan decisiones sobre estado, ingreso/salida, grado, grupo y vínculos de acudientes.

## 6. RLS de `institutions`

Existe SELECT para que un usuario vea una institución cuando tiene una membresía con esa institución.

No existen policies RLS de INSERT/UPDATE/DELETE para usuarios normales.

**Conclusión:** la creación/edición de instituciones debe pasar por backend, no por CRUD directo desde el navegador.

## 7. RLS de `institution_members`

Existe SELECT para que un usuario consulte su propia membresía mediante `user_id = auth.uid()`.

No existen policies RLS para que un usuario normal cree, elimine o modifique membresías.

**Conclusión:** no se debe habilitar CRUD directo para roles institucionales. Las futuras operaciones sensibles deben pasar por Route Handler, Server Action o RPC específicamente diseñada.

Cada operación deberá comprobar:
1. autenticación;
2. institución autorizada;
3. rol institucional;
4. operación permitida;
5. pertenencia del recurso a la institución.

## 8. 🔴 Grants

La auditoría confirmó grants excesivos sobre las tablas institucionales.

`institution_members` conserva para `anon` y `authenticated` privilegios como INSERT, UPDATE, DELETE, SELECT, TRUNCATE, REFERENCES y TRIGGER.

Las tablas `institutions`, `institution_verification_requests` e `institution_verification_documents` también conservan privilegios directos como TRUNCATE, REFERENCES y TRIGGER.

RLS no debe considerarse una protección para privilegios como TRUNCATE.

**Estado:** no se revocaron durante esta auditoría. Primero se debe completar el mapa global de dependencias y aplicar mínimo privilegio sin romper funcionalidades existentes.

También se confirmó que DEFAULT PRIVILEGES del rol `postgres` siguen otorgando privilegios amplios a roles de aplicación sobre futuras tablas públicas.

## 9. Solicitudes de verificación

Existe `institution_verification_requests` con datos de institución, representante, documento, rol, correo institucional, teléfono, NIT, tipo de institución, dirección, ciudad, estado, aceptación de términos, versión de privacidad, fechas, revisor y notas.

Estados permitidos:
- `pending`
- `under_review`
- `approved`
- `changes_requested`
- `rejected`

Existe índice único parcial que evita solicitudes activas duplicadas por institución en `pending` y `under_review`.

### 🔴 Hallazgo
La policy INSERT actual solamente exige `representative_user_id = auth.uid()`.

Eso no impide que el cliente intente enviar campos administrativos o sensibles manipulados, por ejemplo `institution_id`, `verification_status`, `reviewed_by` o fechas internas.

**Corrección requerida:** crear la solicitud mediante backend y construir allí los valores sensibles.

## 10. Documentos de verificación

Existe `institution_verification_documents` con:
- `id_document`
- `representation_proof`
- `institution_proof`
- ruta de Storage;
- nombre original;
- MIME;
- tamaño;
- hash;
- estado y notas de revisión.

### 🔴 Hallazgo
La policy INSERT permite al representante crear metadata relacionada con su solicitud, pero valores como `storage_path`, MIME, tamaño y hash pueden ser enviados por el cliente.

**Regla futura:** el servidor debe generar la ruta, validar el archivo real, tamaño, MIME, extensión, hash y asociación con la solicitud.

El cliente nunca debe decidir libremente la ruta final.

## 11. Storage

Buckets actuales confirmados:

`question-images`: público, máximo 10 MB, PNG/JPEG/WebP.

`reference-pdfs`: privado, máximo 30 MB, PDF.

No existe todavía un bucket específico para documentos institucionales.

### Diseño recomendado
Crear posteriormente un bucket privado dedicado a verificación institucional.

Ruta conceptual:
`institution-verification/<request-id>/<document-id>`

No debe depender del nombre de la institución ni de una ruta proporcionada por el usuario.

Los documentos no deben tener acceso público permanente.

## 12. Autenticación

El registro normal ya utiliza Supabase Auth, Turnstile, verificación por correo y OTP.

**Decisión:** no modificar `/register` normal.

El flujo institucional comienza después de que exista una cuenta autenticada y verificada:

```text
Cuenta PeakScore
      ↓
Correo verificado
      ↓
Inicio de sesión
      ↓
Registrar institución
      ↓
Solicitud institucional
```

## 13. Autorización server-side

`lib/auth/admin.ts` tiene `requireAdmin()`, que comprueba usuario autenticado y `profiles.role = admin`.

Esto es para administración global y no debe reutilizarse como autorización institucional.

No debemos tratar a rector, coordinador o docente como `profiles.role = admin`.

Se necesitará posteriormente una autorización institucional independiente, pero su contrato exacto debe diseñarse antes de crearla.

## 14. 🔴 Aislamiento multiinstitución

Regla principal:

```text
auth.uid()
   ↓
institution_members
   ↓
institution_id autorizado
   ↓
recurso institucional
```

El `institution_id` recibido desde el navegador es dato no confiable.

Un usuario no debe poder seleccionar otra institución simplemente modificando un UUID en una petición.

## 15. Verificación del representante

No basta con declarar `soy rector`.

La solicitud debe permitir revisión de evidencia suficiente.

La base actual contempla identidad, rol declarado, correo institucional y documentos.

Falta definir exactamente qué evidencia será aceptada y cómo se revisará.

El dominio del correo institucional no debe considerarse por sí solo una prueba absoluta.

Flujo objetivo:

```text
Solicitud
   ↓
Revisión
   ↓
Evidencia suficiente
   ↓
Aprobación manual
   ↓
Activación
```

## 16. Estados

`institution_verification_requests` ya tiene estados de workflow.

Pero `institutions` no tiene todavía estado operativo.

Antes de implementar hay que separar:
- estado de verificación;
- estado operativo;
- estado del plan.

No se deben crear tres sistemas de estados solapados.

## 17. Plan institucional

`subscriptions` es actualmente un modelo orientado a usuario.

El producto institucional necesita conceptualmente:

`institution -> institutional_plan`

No se recomienda `student.is_premium`.

El acceso premium institucional debe depender de la institución y de la pertenencia autorizada del usuario.

No reutilizar `subscriptions` sin revisar dependencias.

## 18. Datos de estudiantes

PeakScore no debe convertirse en una réplica de SIMAT.

Debe aplicarse minimización.

Datos candidatos:
- nombres;
- apellidos;
- grado;
- grupo;
- código interno escolar;
- correo cuando sea necesario;
- documento únicamente cuando exista finalidad legítima y necesidad real.

No recopilar por defecto:
- EPS;
- historias clínicas;
- diagnósticos;
- biometría;
- religión;
- orientación política;
- vida sexual;
- ingresos familiares;
- historia psicológica;
- fotografías obligatorias.

## 19. Menores y privacidad

El producto puede procesar datos de estudiantes menores, por lo que privacidad y seguridad deben diseñarse desde el principio.

La Ley 1098 reconoce el derecho de niños, niñas y adolescentes a la intimidad y contiene obligaciones especiales para instituciones educativas.

La SIC establece protección reforzada para los datos de niños, niñas y adolescentes y define al Encargado como quien trata datos por cuenta del Responsable.

Para el producto deben quedar definidos:
- Responsable;
- Encargado;
- finalidad;
- autorización;
- conservación;
- acceso;
- eliminación;
- derechos del titular;
- incidentes;
- transferencias/transmisiones.

Esto debe revisarse con asesoría jurídica colombiana antes de producción.

## 20. Privacidad de la solicitud

La tabla ya conserva `terms_accepted_at` y `privacy_notice_version`.

Esto permite trazabilidad, pero todavía falta definir:
- versión real de términos;
- versión real de política;
- texto mostrado;
- finalidades;
- retención;
- canal para ejercer derechos.

## 21. Pruebas de ataque obligatorias

### Cambiar `institution_id`
Resultado esperado: DENEGADO.
El backend debe resolver la institución mediante membresía.

### Enviar `verification_status = approved`
Resultado esperado: DENEGADO.
El cliente no puede aprobar solicitudes.

### Enviar `reviewed_by` propio
Resultado esperado: DENEGADO.
El revisor lo determina el backend administrativo.

### Crear membresía con `role = rector`
Resultado esperado: DENEGADO para un usuario normal.

### Crear/cambiar `role = admin` institucional
Resultado esperado: DENEGADO.
Además, el rol `admin` institucional debe desaparecer del modelo final.

### Leer solicitud de otra institución
Resultado esperado: DENEGADO.

### Leer documento de otra institución
Resultado esperado: DENEGADO.
Debe comprobarse la cadena documento → solicitud → institución → autorización.

### Subir archivo con MIME falso
Resultado esperado: DENEGADO.

### Manipular ruta de Storage
Resultado esperado: DENEGADO.
El servidor genera el path.

### Repetir solicitudes
Resultado esperado: LIMITADO mediante rate limiting, constraints e idempotencia cuando corresponda.

## 22. Rate limiting

PeakScore ya posee `consume_api_rate_limit` y límites por bucket.

El flujo institucional necesitará límites específicos para:
- creación de solicitudes;
- subida de documentos;
- reenvíos;
- consultas repetitivas.

## 23. Sesión y backend

Las operaciones sensibles deben ejecutarse en Route Handlers, Server Actions o RPC segura.

No se debe confiar en `user_id` enviado por el navegador.

La identidad debe obtenerse desde la sesión autenticada.

## 24. Audit log futuro

Eventos recomendados:
- institución creada;
- solicitud enviada;
- documento cargado;
- solicitud revisada;
- aprobada/rechazada;
- cambios solicitados;
- membresía creada;
- rol cambiado;
- estudiante creado/actualizado/eliminado;
- exportación de estudiantes;
- reporte generado;
- cambios de seguridad relevantes.

Registrar únicamente la información necesaria en cada evento.

## 25. MFA

Para rector y coordinador debe evaluarse MFA obligatorio o reforzado.

Antes de implementarlo deben definirse recuperación, pérdida del segundo factor, reautenticación y soporte.

## 26. UI/UX

El registro será independiente del dashboard normal y seguirá el wizard aprobado:

```text
Inicio
  ↓
Datos de la institución
  ↓
Datos del representante
  ↓
Información de contacto
  ↓
Documentos de verificación
  ↓
Términos y envío
```

Se reutilizará el lenguaje visual real de `app/register/page.tsx`: fondo claro, azul PeakScore, cards redondeadas, inputs existentes, Lucide, responsive y `PeakScoreLogo`.

No se creará un sistema UI paralelo innecesario.

## 27. Arquitectura objetivo

```text
/institution/register
        │
        ▼
POST /api/institution/register
        │
        ├── auth.uid()
        ├── validar usuario
        ├── validar datos
        ├── Turnstile
        ├── rate limit
        ├── crear institution
        ├── crear verification request
        └── devolver request/status
                 │
                 ▼
        /institution/status
                 │
                 ▼
        Revisión administrativa
                 │
                 ▼
              APPROVED
                 │
                 ▼
       activar membresía/plan
                 │
                 ▼
       /institution/dashboard
```

## 28. Qué NO hacer

- No modificar `/register` normal.
- No poner el registro institucional dentro del dashboard normal.
- No confiar en `institution_id` del cliente.
- No permitir al navegador crear roles privilegiados.
- No permitir al navegador aprobar solicitudes.
- No usar `institution_members.role = admin` como administrador global.
- No hacer públicos documentos de verificación.
- No aceptar rutas de Storage arbitrarias.
- No recopilar datos escolares innecesarios.
- No crear una autenticación paralela.
- No duplicar tablas sin necesidad.
- No eliminar legacy sin trazabilidad.
- No revocar grants globales sin mapa de dependencias.
- No construir el panel antes de cerrar autorización y aislamiento.

## 29. 🔴 Bloqueadores antes de implementar

1. Resolver el modelo de roles y el registro institucional actual con `admin`.
2. Hacer hardening de grants.
3. Definir el backend seguro de creación.
4. Definir Storage privado para verificación.
5. Separar estado de verificación, estado operativo y plan.
6. Definir el modelo final de datos institucionales.
7. Cerrar finalidades y tratamiento de datos de menores.

## 30. Orden recomendado

### Fase A — Hardening
1. Resolver roles.
2. Revisar grants.
3. Diseñar autorización institucional.
4. Definir Storage privado.
5. Crear RPC solamente cuando sea necesario.

### Fase B — Registro
6. Endpoint seguro.
7. Wizard.
8. Turnstile.
9. Rate limit.
10. Crear solicitud.

### Fase C — Documentos
11. Subida segura.
12. Validación real.
13. Storage privado.
14. Metadata controlada.

### Fase D — Estado
15. `/institution/status`.
16. Estado visible.
17. Cambios solicitados.
18. Reenvío controlado.

### Fase E — Administración
19. Revisión.
20. Aprobar/rechazar.
21. Activar membresía.
22. Activar plan.

### Fase F — Panel
23. Dashboard institucional.
24. Aislamiento multiinstitución.
25. Métricas.
26. Progreso.
27. Necesidades de refuerzo.

## 31. Resultado de la auditoría 01

### Estado general
**NO implementar todavía el registro institucional funcional.**

### Fortalezas
- Supabase Auth operativo.
- SSR con `@supabase/ssr`.
- Proxy existente.
- RLS habilitado en tablas institucionales.
- Relación institución ↔ miembro.
- Solicitudes de verificación existentes.
- Documentos de verificación existentes.
- Índice contra solicitudes activas duplicadas.
- Admin global separado conceptualmente mediante `profiles.role`.
- Turnstile disponible.
- Rate limiting existente.
- Storage privado disponible como base técnica.

### Riesgos principales
1. `institution_members.role` todavía acepta `admin`.
2. Existe un miembro institucional actual con `admin`.
3. Grants directos demasiado amplios.
4. INSERT de solicitudes confía demasiado en datos del cliente.
5. Metadata de documentos puede manipularse desde cliente.
6. No existe endpoint institucional server-side.
7. No existe bucket institucional específico.
8. No existe modelo operativo completo.
9. No existe plan institucional formal.
10. No existe audit log institucional.
11. El tratamiento de datos de menores requiere diseño jurídico/privacidad.

## 32. Decisión de arquitectura

> **El registro institucional será independiente del registro normal, comenzará con un usuario autenticado y verificado, utilizará backend server-side para operaciones sensibles y resolverá la institución mediante la membresía autorizada, nunca mediante confianza en datos enviados por el navegador.**

Prioridad:

```text
AUTH
 ↓
AUTORIZACIÓN
 ↓
AISLAMIENTO
 ↓
VERIFICACIÓN
 ↓
STORAGE
 ↓
DATOS
 ↓
UI
```

## 33. Fuentes externas consultadas

- Supabase: documentación actual de Next.js/SSR, `getClaims`, `getUser`, RLS y Storage.
- Superintendencia de Industria y Comercio: política y definiciones de tratamiento de datos personales.
- Función Pública: Ley 1098 de 2006.
- SIC: criterios sobre tratamiento de datos de niños, niñas y adolescentes.

Estas fuentes orientan el diseño técnico y de privacidad. La implementación jurídica definitiva debe revisarse con asesoría jurídica colombiana.

## 34. Preparación para auditoría 02

La auditoría 02 deberá partir de este documento y del estado real de GitHub/Supabase en ese momento.

No deberá asumir que ninguna recomendación de esta auditoría ya fue implementada.

Debe volver a comprobar desde cero:
- esquema;
- constraints;
- RLS;
- grants;
- Storage;
- funciones;
- autenticación;
- autorización;
- rutas;
- APIs;
- flujo de archivos;
- privacidad;
- aislamiento multiinstitución;
- escenarios de ataque;
- cambios realizados entre ambas auditorías.

**Auditoría 01 finalizada.**