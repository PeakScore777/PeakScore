# Auditoría de Seguridad 03 — Estado actual de PeakScore

**Fecha:** 2026-10-02  
**Repositorio:** PeakScore777/PeakScore — `main`  
**Commit auditado:** `2dd46b6ede494736dea6610caa4e1102b24f2dba`  
**Proyecto Supabase:** PeakScore / `avmywztnsrnyjhvbaiio`  
**Tipo:** auditoría técnica de seguridad, reauditoría de código + PostgreSQL/Supabase  
**Cambios aplicados durante esta auditoría:** ninguno

> Esta auditoría es de reconocimiento y validación. No se modificó código, RLS, grants, funciones, Storage ni datos durante la revisión.

---

## 1. Objetivo

Revisar el estado real de seguridad después de incorporar:

- registro normal actualizado;
- registro de usuario;
- registro institucional visual;
- proxy de municipios DANE;
- hardening PostgreSQL previo;
- hardening institucional previo.

La revisión cubre:

1. autenticación;
2. autorización;
3. RLS;
4. grants PostgreSQL;
5. SECURITY DEFINER;
6. APIs;
7. Service Role;
8. Storage;
9. registro institucional;
10. protección contra IDOR/BOLA;
11. rate limiting;
12. secretos;
13. headers/CSP;
14. dependencias;
15. CI/CodeQL/Dependabot;
16. privacidad y datos institucionales;
17. riesgos específicos del nuevo flujo institucional.

---

# 2. Resultado ejecutivo

## Estado

**PeakScore NO está listo todavía para producción institucional.**

La base de seguridad general ha mejorado de forma importante respecto de las auditorías anteriores, especialmente en:

- RLS habilitado en las tablas públicas;
- grants institucionales reducidos;
- separación conceptual entre admin global e institucional;
- autenticación server-side;
- validación de propiedad en simulacros;
- RPC atómicas para operaciones sensibles;
- uso de Turnstile;
- rate limiting existente;
- Storage privado para PDFs de referencia;
- CodeQL;
- Dependabot;
- headers de seguridad.

Sin embargo, se encontraron **bloqueadores importantes** antes de abrir el producto institucional a usuarios reales.

---

# 3. Hallazgos por severidad

| ID | Severidad | Área | Estado |
|---|---|---|---|
| SEC-01 | CRÍTICA | Dependencia Next.js desactualizada frente al release de seguridad actual | ABIERTO |
| SEC-02 | ALTA | Registro institucional todavía no tiene backend real | ABIERTO |
| SEC-03 | ALTA | Modelo institucional todavía permite `admin` y existe una membresía con ese rol | ABIERTO |
| SEC-04 | ALTA | No existe autorización institucional server-side ni aislamiento institucional implementado | ABIERTO |
| SEC-05 | ALTA | No existe Storage privado para documentos institucionales | ABIERTO |
| SEC-06 | MEDIA | Leaked Password Protection deshabilitado en Supabase Auth | ABIERTO |
| SEC-07 | MEDIA | SECURITY DEFINER ejecutables por `authenticated` | REVISAR |
| SEC-08 | MEDIA | Registro institucional imprime PII + token CAPTCHA en consola | ABIERTO |
| SEC-09 | MEDIA | Validación de C.C. del rector solo existe en frontend | ABIERTO |
| SEC-10 | MEDIA | Política legal del registro normal no queda registrada en backend | ABIERTO |
| SEC-11 | MEDIA | CSP utiliza `unsafe-inline` | REVISAR |
| SEC-12 | BAJA | Endpoint DANE público sin rate limit específico | ABIERTO |
| SEC-13 | BAJA | Uso de legacy `service_role` en backend | PLANIFICAR MIGRACIÓN |

---

# 4. SEC-01 — Next.js fuera del parche de seguridad actual

## Severidad

**CRÍTICA**

## Evidencia

`package.json` usa:

```
next: 16.2.12
eslint-config-next: 16.2.12
```

El release oficial de seguridad de septiembre de 2026 indica actualizar a **Next.js 16.3.8** para recibir las correcciones de seguridad de esa publicación.

Fuente oficial:

https://nextjs.org/blog

## Riesgo

Mantener una versión anterior a un release de seguridad significa ejecutar el framework con vulnerabilidades conocidas que ya tienen parche disponible.

Esto es especialmente importante porque PeakScore utiliza:

- App Router;
- Server Components;
- Route Handlers;
- SSR;
- proxy;
- autenticación server-side.

## Acción

Actualizar Next.js y `eslint-config-next` a la versión de seguridad vigente, ejecutar:

```
npm install
npm run lint
npm run build
```

y realizar pruebas de autenticación, navegación, APIs y simulacros.

**No actualizar automáticamente sin revisar el changelog y probar la aplicación.**

---

# 5. SEC-02 — Registro institucional sin backend real

## Severidad

**ALTA**

## Evidencia

`app/register/institution/page.tsx` prepara:

```
requestData
```

pero termina haciendo:

```
console.log(
  "[PeakScore] Solicitud institucional preparada:",
  requestData
);

setSubmitted(true);
```

No existe todavía un:

```
POST /api/institution/register
```

## Riesgo

La interfaz muestra una solicitud como preparada/enviada sin crear una solicitud institucional real.

Además:

- Turnstile no es validado por servidor;
- el NIT no es persistido;
- el rector no es persistido;
- la aceptación legal no queda registrada;
- no se crea institución;
- no se crea solicitud de verificación;
- no se genera estado;
- no existe workflow de revisión.

## Decisión

No debe conectarse directamente desde el navegador a las tablas institucionales.

El flujo correcto será:

```
Usuario autenticado
        ↓
POST /api/institution/register
        ↓
validar sesión
        ↓
validar Turnstile server-side
        ↓
rate limit
        ↓
validar payload
        ↓
crear institución
        ↓
crear solicitud
        ↓
respuesta
```

---

# 6. SEC-03 — Rol institucional `admin`

## Severidad

**ALTA**

## Evidencia

La constraint actual permite:

```
student
teacher
coordinator
rector
admin
```

Además, actualmente existe una membresía institucional con:

```
role = admin
```

y el usuario asociado también tiene:

```
profiles.role = admin
```

## Riesgo

El sistema conceptual acordado separa:

- administrador global de PeakScore;
- roles institucionales.

Permitir `admin` dentro de `institution_members` crea ambigüedad peligrosa.

Un futuro desarrollador podría interpretar:

```
institution_members.role = 'admin'
```

como autoridad administrativa completa.

## Acción

Antes de producción institucional:

1. determinar la finalidad del registro existente;
2. migrarlo correctamente;
3. eliminar `admin` del CHECK institucional;
4. documentar que `profiles.role = admin` es exclusivamente global;
5. agregar pruebas para impedir escalada de privilegios.

No ejecutar esta migración sin identificar primero el registro existente.

---

# 7. SEC-04 — Falta autorización institucional server-side

## Severidad

**ALTA**

Actualmente no existe:

- API para registrar institución;
- API para consultar solicitud;
- API para subir documentos;
- API para revisar;
- API para aprobar;
- API para activar;
- autorización institucional reusable.

La regla objetivo sigue siendo:

```
auth.uid()
   ↓
institution_members
   ↓
institution_id autorizado
   ↓
recurso institucional
```

Nunca:

```
institution_id enviado por navegador
   ↓
confiar
```

## Riesgo

Cuando se implemente el panel institucional, un error de autorización podría convertirse en:

- IDOR;
- BOLA;
- acceso cruzado entre colegios;
- modificación de información de otra institución.

## Acción

Crear primero una capa server-side reutilizable que resuelva:

- usuario autenticado;
- institución autorizada;
- rol;
- permisos;
- estado de membresía.

Después construir las APIs.

---

# 8. SEC-05 — No existe Storage institucional privado

## Estado actual

Buckets encontrados:

- `question-images` — público;
- `reference-pdfs` — privado.

No existe bucket dedicado a verificación institucional.

## Riesgo

Los futuros documentos de:

- identidad;
- representación;
- institución;

son datos personales y potencialmente sensibles.

No deben almacenarse en un bucket público.

## Diseño requerido

Bucket privado:

```
institution-verification
```

Ruta generada por servidor:

```
institution-verification/<request-id>/<document-id>
```

Nunca permitir que el cliente determine libremente:

- bucket;
- storage path;
- nombre interno;
- propietario.

También debe validarse el archivo real en servidor.

---

# 9. SEC-06 — Leaked Password Protection

## Severidad

**MEDIA**

Supabase Security Advisor actualmente reporta:

**Leaked Password Protection Disabled**

Supabase documenta esta protección como una medida contra contraseñas conocidas por haber sido comprometidas.

Fuente:

https://supabase.com/docs/guides/auth/password-security

## Acción

Habilitarla cuando la configuración/plan disponible lo permita.

La validación de frontend de PeakScore no reemplaza esta protección.

---

# 10. SEC-07 — SECURITY DEFINER

## Severidad

**MEDIA — REVISIÓN CONTROLADA**

Supabase Advisor reporta seis funciones SECURITY DEFINER ejecutables por `authenticated`:

- `consume_api_rate_limit`
- `delete_user_simulation`
- `finish_simulation_atomic`
- `get_subject_performance_for_attempts`
- `save_simulation_progress_atomic`
- `update_user_streak`

Todas las funciones revisadas usan:

```
SET search_path TO ''
```

Esto es una buena práctica.

Además:

- `delete_user_simulation` comprueba `auth.uid()`;
- `finish_simulation_atomic` comprueba propietario e intento;
- `get_subject_performance_for_attempts` comprueba propiedad de todos los intentos;
- `save_simulation_progress_atomic` comprueba propietario y preguntas;
- `update_user_streak` opera sobre `auth.uid()`;
- `consume_api_rate_limit` limita los buckets permitidos.

## Conclusión

No se recomienda eliminar estas funciones automáticamente.

Debe hacerse una segunda revisión función por función y decidir si:

- mantener EXECUTE;
- revocar EXECUTE público;
- mover alguna función fuera del esquema expuesto;
- cambiar a SECURITY INVOKER cuando sea posible.

---

# 11. SEC-08 — PII y CAPTCHA en consola del navegador

## Severidad

**MEDIA**

El registro institucional construye un objeto con:

- nombre de institución;
- NIT;
- dirección;
- correo;
- teléfono;
- nombre del rector;
- número de C.C.;
- correo del rector;
- teléfono;
- estado legal;
- token de Turnstile.

Después lo imprime mediante:

```
console.log("[PeakScore] Solicitud institucional preparada:", requestData)
```

## Riesgo

Los datos personales quedan expuestos en DevTools.

El token de CAPTCHA tampoco debe registrarse.

## Acción

Eliminar ese log antes de producción.

En caso de logging server-side, registrar únicamente:

- request ID;
- resultado;
- código de error;
- identificadores internos mínimos.

Nunca:

- contraseña;
- token CAPTCHA;
- C.C.;
- NIT;
- documentos;
- payload completo.

---

# 12. SEC-09 — C.C. del rector solo se impone en frontend

El formulario actual fuerza:

```
documentType: "CC"
```

y también prepara el payload con:

```
documentType: "CC"
```

Esto es correcto para UX.

Pero **no constituye una garantía de seguridad**.

## Acción

El futuro endpoint debe ignorar cualquier `documentType` enviado por el navegador y establecer:

```
representative_document_type = 'CC'
```

Además debe validar server-side:

- solo dígitos;
- longitud permitida;
- normalización;
- ausencia de espacios/caracteres inesperados.

La existencia real de la persona y su calidad de rector requieren un proceso de verificación, no solo una regex.

---

# 13. SEC-10 — Aceptación legal

## Registro normal

El frontend exige aceptación legal antes de llamar a Supabase Auth.

Esto evita continuar accidentalmente sin aceptar.

Pero actualmente la aceptación no está integrada como evidencia persistente en el flujo de registro mostrado.

## Institucional

La tabla de solicitudes ya dispone de:

- `terms_accepted_at`;
- `privacy_notice_version`.

Eso es una buena base.

## Acción

El backend institucional debe escribir:

- versión de términos;
- versión de privacidad;
- timestamp del servidor;
- usuario autenticado;
- finalidad correspondiente.

No confiar en timestamps enviados desde el navegador.

---

# 14. SEC-11 — CSP

`next.config.ts` incluye:

- HSTS;
- X-Content-Type-Options;
- X-Frame-Options;
- Referrer-Policy;
- Permissions-Policy;
- COOP;
- CORP;
- CSP.

Esto es una base sólida.

Pero CSP utiliza:

```
script-src 'unsafe-inline'
style-src 'unsafe-inline'
```

## Riesgo

Reduce la protección que CSP ofrece frente a determinados XSS.

## Acción

No eliminarlo a ciegas.

Primero medir qué necesita Next.js, Turnstile, PostHog y la aplicación; posteriormente migrar hacia una CSP con nonce/hash cuando sea compatible.

---

# 15. SEC-12 — Endpoint de municipios

El endpoint:

```
/api/locations/municipalities
```

solo acepta códigos de departamento de dos dígitos y consulta un host DANE fijo.

No existe un SSRF arbitrario porque el host no es controlable por el cliente.

## Riesgo residual

Un usuario puede solicitar repetidamente departamentos y provocar tráfico saliente hacia DANE.

La respuesta tiene cache de una hora, lo que reduce parte del impacto.

## Acción

Agregar posteriormente rate limiting ligero para esta ruta o una estrategia de cache más controlada.

No es un bloqueador de producción por sí solo.

---

# 16. SEC-13 — Service Role / Secret Keys

El backend utiliza:

```
SUPABASE_SERVICE_ROLE_KEY
```

en Route Handlers server-side.

Esto es aceptable mientras permanezca exclusivamente en servidor.

Supabase actualmente recomienda el modelo de claves publishable/secret para proyectos nuevos y documenta que las secret keys bypass RLS y nunca deben salir del backend.

Fuente:

https://supabase.com/docs/guides/getting-started/api-keys

## Acción

Planificar migración de:

```
service_role
```

a claves secret modernas cuando sea conveniente.

**No cambiarlo sin revisar todos los despliegues y variables de entorno.**

---

# 17. RLS actual

Todas las tablas públicas revisadas tienen RLS habilitado.

Esto incluye:

- profiles;
- questions;
- simulations;
- simulation_questions;
- simulation_attempts;
- simulation_answers;
- student_progress;
- subscriptions;
- institutions;
- institution_members;
- institution_verification_requests;
- institution_verification_documents;
- tablas de referencia;
- api_rate_limits.

## Resultado

La cobertura de RLS es buena.

---

# 18. Grants actuales

Después del hardening previo, las tablas institucionales muestran:

```
authenticated:
  institutions        SELECT
  institution_members SELECT
```

Las tablas de verificación no tienen DML directo para `authenticated`.

Esto es una mejora real respecto de la auditoría anterior.

## Hallazgo adicional

Existe todavía un grant directo amplio sobre `questions` para `anon` y `authenticated`.

RLS actualmente limita el acceso, pero el grant para `anon` es innecesario y debe eliminarse en una revisión posterior de mínimo privilegio.

No se debe revocar a ciegas sin comprobar qué rutas dependen de él.

---

# 19. Storage actual

## question-images

Público:

```
public = true
```

Tipos:

- PNG;
- JPEG;
- WebP.

Esto puede ser correcto si las imágenes de preguntas están destinadas a ser públicas.

Debe verificarse que nunca se almacenen allí documentos institucionales o material privado.

## reference-pdfs

Privado.

Límite:

30 MB.

Tipo permitido:

```
application/pdf
```

La arquitectura actual separa correctamente los PDFs de referencia del contenido público.

---

# 20. Simulacros

Los endpoints revisados siguen el patrón:

```
auth.uid()
↓
comprobar propietario
↓
operación
```

La finalización utiliza:

```
finish_simulation_atomic
```

y calcula las respuestas correctas desde PostgreSQL usando `questions.correct_answer`.

Esto evita confiar en la respuesta correcta enviada por el navegador.

## Resultado

**Buen patrón de seguridad.**

Debe conservarse para futuras funcionalidades institucionales.

---

# 21. Progreso de simulacros

`save_simulation_progress_atomic` comprueba:

- usuario autenticado;
- propietario del simulacro;
- límites de pregunta;
- tiempo;
- estructura de respuestas;
- preguntas pertenecientes al simulacro.

Esto reduce considerablemente la superficie de manipulación del progreso.

---

# 22. Admin global

Actualmente:

```
profiles.role = admin
```

continúa siendo la autoridad global.

`requireAdmin()` comprueba la sesión y el rol de `profiles`.

Esto está separado conceptualmente del sistema institucional.

## Riesgo pendiente

No existe todavía una segunda barrera canónica para el administrador global.

No se debe introducir una comprobación basada exclusivamente en un correo hardcodeado.

La mejora correcta será:

- rol protegido por base de datos;
- MFA;
- reautenticación;
- audit log;
- mínimo privilegio.

---

# 23. Registro normal

Fortalezas actuales:

- email normalizado;
- validación de email;
- contraseña mínima de 15 caracteres;
- mayúscula;
- minúscula;
- número;
- símbolo;
- confirmación de contraseña;
- Turnstile;
- verificación por correo;
- OTP;
- cooldown de reenvío;
- no guardar contraseña en sessionStorage.

## Riesgo

La política legal se controla principalmente desde el frontend.

Para cumplimiento y trazabilidad debe existir un mecanismo persistente de aceptación/versionado cuando se establezca el modelo definitivo.

---

# 24. CI/CD

GitHub tiene:

- CodeQL;
- Dependabot para npm;
- Dependabot para GitHub Actions.

Esto es positivo.

## Recomendación

Agregar posteriormente un pipeline que bloquee merges si:

- `npm audit` crítico;
- build falla;
- lint falla;
- CodeQL reporta findings bloqueantes.

No usar `npm audit` como único mecanismo de seguridad.

---

# 25. Secretos

El repositorio contiene:

```
.env*
```

en `.gitignore`.

No se encontró un archivo `.env` versionado en el árbol auditado.

El backend utiliza variables de entorno para secretos.

## Regla

Nunca subir:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `SUPABASE_SECRET_KEY`;
- `OPENAI_API_KEY`;
- `GEMINI_API_KEY`;
- tokens de Cloudflare;
- claves privadas.

---

# 26. Privacidad institucional

El modelo actual contiene campos para:

- NIT;
- dirección;
- ciudad;
- identidad del representante;
- teléfono;
- correo;
- documentos de verificación.

Antes de producción debe definirse:

1. Responsable;
2. Encargado;
3. finalidad;
4. autorización;
5. conservación;
6. acceso;
7. eliminación;
8. transmisiones;
9. incidentes;
10. derechos del titular.

Los datos de estudiantes menores requieren especial cuidado y minimización.

---

# 27. Pruebas de ataque obligatorias antes del panel institucional

## Autorización

- Cambiar `institution_id`.
- Cambiar `user_id`.
- Cambiar `role`.
- Cambiar `reviewed_by`.
- Cambiar `verification_status`.
- Intentar crear una membresía de rector.
- Intentar crear una membresía de admin.
- Consultar otra institución.

## Storage

- Cambiar storage path.
- Cambiar bucket.
- Cambiar MIME.
- Cambiar extensión.
- Subir archivo con MIME falso.
- Intentar descargar documento de otra institución.

## Workflow

- Aprobar una solicitud desde navegador.
- Saltarse revisión.
- Reenviar solicitud después de rechazo.
- Duplicar solicitudes.
- Alterar timestamp.
- Alterar versión de política.

## Auth

- Sesión expirada.
- Usuario sin email verificado.
- Cambio de contraseña.
- Reautenticación.
- MFA.
- múltiples sesiones.

---

# 28. Prioridad de corrección

## P0 — antes de continuar con institución

1. Actualizar Next.js al release de seguridad vigente.
2. Diseñar autorización institucional server-side.
3. Eliminar/migrar el `admin` institucional.
4. Crear backend institucional.
5. Crear Storage privado institucional.
6. Eliminar logs de PII/CAPTCHA.
7. Diseñar validación server-side de C.C., NIT y datos.
8. Definir workflow de verificación.

## P1

9. Activar leaked password protection.
10. Revisar SECURITY DEFINER.
11. Implementar rate limit institucional.
12. Definir audit log.
13. Definir retención.
14. Revisar grants restantes.
15. Revisar CSP.

## P2

16. Migrar a secret keys modernas.
17. MFA para roles privilegiados.
18. Tests automatizados de autorización.
19. CI con gates de seguridad.

---

# 29. Lo que NO se debe hacer todavía

- No crear el dashboard institucional.
- No crear CRUD de estudiantes.
- No crear invitaciones.
- No crear código de vinculación.
- No crear roles institucionales nuevos.
- No crear documentos reales.
- No conectar el formulario directamente a Supabase desde el navegador.
- No confiar en `institution_id`.
- No permitir que el frontend determine aprobación.
- No utilizar `institution_members.role = admin`.
- No hacer público el Storage institucional.

---

# 30. Veredicto

PeakScore tiene una **base de seguridad considerablemente mejor que al inicio**, pero el sistema institucional todavía debe construirse desde la autorización y no desde la interfaz.

Orden obligatorio:

```
DEPENDENCIAS
    ↓
ROLES
    ↓
AUTHORIZATION
    ↓
RLS
    ↓
GRANTS
    ↓
STORAGE
    ↓
WORKFLOW
    ↓
PRIVACIDAD
    ↓
API
    ↓
UI
```

El nuevo registro visual **no debe considerarse un registro institucional funcional todavía**.

La siguiente fase debe ser de **hardening**, no de diseño.

---

## 31. Fuentes técnicas

- Next.js — Security releases:
  https://nextjs.org/blog
- Supabase — Password security:
  https://supabase.com/docs/guides/auth/password-security
- Supabase — API keys:
  https://supabase.com/docs/guides/getting-started/api-keys
- Supabase — Product security:
  https://supabase.com/docs/guides/security/product-security
- Supabase — MFA:
  https://supabase.com/docs/guides/auth/mfa

Estas fuentes se utilizan para contrastar recomendaciones técnicas actuales. La parte jurídica colombiana debe continuar revisándose con asesoría jurídica profesional.

---

**Auditoría de Seguridad 03 — finalizada.**
