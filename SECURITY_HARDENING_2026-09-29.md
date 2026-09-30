# Security Hardening — 2026-09-29

## Corrección aplicada directamente en Supabase

Se detectó un exceso real de privilegios PostgreSQL en las tablas institucionales antes de implementar el registro institucional.

Tablas afectadas:
- public.institutions
- public.institution_members
- public.institution_verification_requests
- public.institution_verification_documents

Se revocaron los privilegios de tabla para anon y authenticated.

Después se restauró únicamente SELECT para authenticated sobre institutions e institution_members, porque las lecturas actuales dependen de ellas y RLS mantiene el aislamiento por filas.

Resultado verificado:
- anon: sin SELECT/INSERT/UPDATE/DELETE/TRUNCATE sobre las cuatro tablas.
- authenticated: únicamente SELECT sobre institutions e institution_members.
- authenticated: sin privilegios directos sobre las tablas de verificación.

No se modificaron filas, columnas, claves foráneas ni policies RLS.

## Motivo

Las tablas de verificación todavía no tienen API institucional. Permitir DML directo desde cliente habría creado una superficie innecesaria para manipular solicitudes o metadata de documentos.

La creación y modificación sensible deberá ejecutarse server-side con identidad autenticada, validación estricta, autorización institucional y rate limiting.

## Regla permanente

Ninguna nueva tabla institucional debe recibir DML directo del cliente por defecto.

Las operaciones de creación, modificación de roles, aprobación, documentos y operaciones privilegiadas deben resolverse server-side y quedar respaldadas por RLS y constraints.

## Pendiente

- Resolver formalmente el rol institution_members.role = admin existente.
- Diseñar la autorización institucional reutilizable.
- Crear bucket privado para documentos.
- Crear API server-side de registro.
- Añadir rate limit específico.
- Definir plan y estado operativo institucional.
- Definir retención y audit log.
- Revisar DEFAULT PRIVILEGES globales sin romper funcionalidades existentes.