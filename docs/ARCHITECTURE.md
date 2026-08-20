# PeakScore — Arquitectura del Sistema

## 1. Visión del producto

PeakScore será una plataforma educativa especializada en preparación para las pruebas ICFES en Colombia.

El sistema tendrá dos grandes tipos de usuarios:

- Estudiantes
- Instituciones educativas

La plataforma tendrá un modelo Free y Premium, además de funcionalidades específicas para instituciones.

---

## 2. Roles

### Estudiante

Puede:

- Crear una cuenta.
- Resolver pruebas.
- Resolver preguntas por materia.
- Realizar simulacros.
- Consultar resultados.
- Consultar estadísticas.
- Ver evolución.
- Revisar errores.
- Utilizar funcionalidades de IA según su plan.

### Docente

Puede:

- Consultar estudiantes asignados.
- Consultar resultados.
- Consultar estadísticas académicas.
- Revisar progreso.

### Coordinador

Puede:

- Administrar grupos.
- Consultar estadísticas de estudiantes.
- Consultar estadísticas por materia.
- Consultar resultados de simulacros.
- Supervisar progreso académico.

### Rector

Puede:

- Consultar estadísticas generales de la institución.
- Consultar resultados por grupos.
- Consultar rendimiento por materia.
- Consultar evolución de los estudiantes.

### Administrador PeakScore

Puede:

- Administrar usuarios.
- Administrar instituciones.
- Administrar preguntas.
- Administrar materias.
- Administrar simulacros.
- Administrar contenido.
- Revisar importaciones.
- Administrar configuraciones del sistema.

---

## 3. Materias ICFES

El sistema manejará inicialmente:

- Matemáticas
- Lectura Crítica
- Sociales y Ciudadanas
- Ciencias Naturales
- Inglés

---

## 4. Banco de preguntas

Cada pregunta podrá almacenar:

- Materia
- Sesión
- Competencia
- Componente
- Dificultad
- Texto de la pregunta
- Imagen asociada
- Opción A
- Opción B
- Opción C
- Opción D
- Respuesta correcta
- Explicación
- Fuente
- Estado de revisión

Las preguntas deberán pasar por un proceso de validación antes de estar disponibles para los estudiantes.

---

## 5. Importación de material

PeakScore podrá recibir PDFs provenientes del material oficial de preparación.

Muchos documentos podrán ser PDFs escaneados.

El flujo será:

PDF
↓
Extracción de páginas
↓
OCR
↓
Extracción del contenido
↓
Identificación de preguntas
↓
Identificación de opciones
↓
Identificación de respuesta
↓
Clasificación
↓
Revisión
↓
Banco de preguntas

La automatización mediante IA se utilizará como asistencia.

Las preguntas no deberán publicarse automáticamente sin validación cuando exista incertidumbre.

---

## 6. Pruebas por materia

El estudiante podrá iniciar una prueba de una materia.

Ejemplo:

Matemáticas
25 preguntas
25 respuestas

Este tipo de prueba tendrá una puntuación propia y no necesariamente utilizará la escala oficial del ICFES.

---

## 7. Simulacros ICFES

El sistema podrá generar simulacros utilizando preguntas del banco.

Las preguntas podrán seleccionarse automáticamente según:

- Materia
- Sesión
- Cantidad
- Competencia
- Dificultad
- Reglas del simulacro

El sistema deberá evitar repetir preguntas dentro del mismo simulacro.

Los simulacros oficiales de PeakScore tendrán un sistema de calificación independiente basado en la metodología que definamos posteriormente.

---

## 8. Inteligencia Artificial

La IA tendrá diferentes funciones.

### Explicación de preguntas

La IA podrá explicar:

- Por qué una respuesta es correcta.
- Por qué las demás opciones no son correctas.
- Qué concepto debe estudiar el estudiante.

### Análisis de errores

La IA podrá analizar el historial del estudiante para detectar:

- Materias débiles.
- Competencias débiles.
- Tipos de errores frecuentes.
- Temas que requieren refuerzo.

### Recomendaciones

La IA podrá recomendar:

- Preguntas.
- Temas.
- Prácticas.
- Simulacros.
- Material de estudio.

### Plan personalizado

En Premium se podrá generar un plan de estudio personalizado utilizando el rendimiento histórico del estudiante.

---

## 9. Plan Free

El plan gratuito deberá ser realmente útil.

Podrá incluir:

- Pruebas limitadas.
- Preguntas del banco.
- Estadísticas básicas.
- Historial.
- Resultados.
- Funcionalidades básicas de aprendizaje.

El objetivo será que el usuario pueda experimentar el valor real de PeakScore.

---

## 10. Plan Premium

El plan Premium podrá incluir:

- Mayor cantidad de pruebas.
- IA avanzada.
- Explicaciones personalizadas.
- Análisis avanzado de errores.
- Recomendaciones personalizadas.
- Plan de estudio.
- Estadísticas avanzadas.
- Funciones adicionales de simulacros.

Las funcionalidades exactas del Premium se definirán posteriormente.

---

## 11. Plataforma institucional

Las instituciones podrán tener una estructura:

Institución
├── Rector
├── Coordinadores
├── Docentes
└── Estudiantes

Los usuarios institucionales tendrán permisos diferentes según su rol.

Un usuario nunca deberá poder acceder a información que no corresponda a sus permisos.

---

## 12. Seguridad

La seguridad será un requisito fundamental del sistema.

Se utilizarán diferentes capas:

- Autenticación segura.
- Autorización basada en roles.
- Row Level Security en PostgreSQL/Supabase.
- Validación de datos en servidor.
- Protección de endpoints.
- Rate limiting.
- Protección contra abuso.
- Cloudflare.
- WAF.
- Protección DDoS.
- Protección contra bots.
- Gestión segura de secretos.
- Logs.
- Monitoreo.
- Backups.
- Principio de mínimo privilegio.

No se confiará en información enviada directamente desde el navegador para determinar permisos.

---

## 13. Arquitectura general

La arquitectura inicial será:

Usuario
↓
Cloudflare
↓
Next.js
↓
Autenticación / API / Servicios
↓
Supabase
↓
PostgreSQL

Los servicios internos estarán separados por responsabilidades.

---

## 14. Principios de desarrollo

PeakScore deberá construirse siguiendo estos principios:

- Código modular.
- Código mantenible.
- Tipado fuerte con TypeScript.
- Validación en servidor.
- Separación de responsabilidades.
- Seguridad desde el diseño.
- Escalabilidad.
- Reutilización de componentes.
- No duplicar lógica.
- No introducir dependencias innecesarias.
- No modificar funcionalidades existentes sin verificar su impacto.

---

## 15. Regla de desarrollo

Antes de implementar nuevas funcionalidades se deberá definir:

1. Qué problema resuelve.
2. Qué usuarios pueden utilizarla.
3. Qué datos necesita.
4. Qué permisos requiere.
5. Qué tablas necesita.
6. Qué API necesita.
7. Qué medidas de seguridad necesita.
8. Cómo se probará.

No se deberán crear tablas, APIs o funcionalidades aisladas sin considerar la arquitectura completa.