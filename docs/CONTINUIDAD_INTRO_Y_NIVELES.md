# PeakScore — continuidad de introducción y construcción de niveles

> Documento de continuidad del proyecto. Actualizarlo cuando cambien decisiones importantes.
> Rama de trabajo actual: `feat/founder-intro`.
> Repositorio: https://github.com/PeakScore777/PeakScore
> Fecha de esta nota: 2026-10-18.

## Objetivo acordado

Dejar la escena de prueba de la introducción como está por ahora y avanzar a construir los niveles de aprendizaje en **la misma rama `feat/founder-intro`**. Después de implementar y probar los niveles, revisar el conjunto y pasar los cambios a `main` mediante una integración controlada. No reconstruir PeakScore desde cero ni reemplazar su arquitectura actual.

## Trabajo de introducción que ya existe en la rama

Se trabajó sobre estos archivos:

- `app/intro/page.tsx`: página contenedora de la introducción.
- `app/intro/IntroExperience.tsx`: experiencia de introducción interactiva.
- `app/api/onboarding/intro/route.ts`: endpoint para guardar las respuestas del onboarding.
- `app/dashboard/page.tsx`: lógica de redirección relacionada con la introducción.
- `supabase/migrations/20261018130000_add_intro_onboarding_to_profiles.sql`: migración para las columnas de onboarding.
- `app/intro-test/page.tsx`: escena de prueba visual/local. Se modificó y se decidió **dejarla quieta por ahora**; no pulirla más hasta retomar esa tarea.

La migración añade a `public.profiles`:

- `intro_completed_at timestamptz`
- `school_grade text`
- `icfes_experience text`
- `learning_goal text`
- `math_confidence text`

La migración marca como completados los perfiles existentes en el momento de ejecutarla, para no interrumpir a usuarios antiguos. El usuario confirmó que ejecutó la migración en Supabase con éxito. Antes de desplegar o integrar el flujo real, verificar el comportamiento de creación de perfiles nuevos y la redirección: el onboarding debe aparecer solo a cuentas nuevas elegibles, y no debe bloquear a usuarios existentes.

## Activos de audio

El usuario agregó y confirmó localmente estos archivos:

- `public/audio/intro/peakscore-intro.wav`
- `public/audio/intro/peakscore-typing.wav`

Se añadieron a Git con el mensaje `Add intro music and typing sound`. El intento de push inicial fue rechazado porque la rama remota tenía cambios más recientes; el usuario mostró luego el estado de GitHub y continuó trabajando en la rama. Confirmar siempre la versión remota y sincronizar con `git pull --rebase origin feat/founder-intro` antes de nuevos pushes, si el árbol local no tiene conflictos.

Activos visuales que ya aparecen en `public/characters/intro/`:

- `founder-saludo.gif`
- `founder-static.gif`
- `nova-static-intro.gif`

Los GIF deben conservar su orientación original. Nova es la nueva aventurera/usuario y mira hacia Founder. No presentar a Nova como guía que dice «yo soy Nova». Founder es quien recibe y orienta a Nova.

## Decisiones visuales y de interacción

- Inspiración de presentación: onboarding narrativo tipo videojuego retro, similar en sensación a Gamecode; crear diseño propio, no copiar literalmente sus recursos.
- Fondo negro puro; tipografía pixel en toda la experiencia.
- Mantener personajes separados, mirándose entre sí y sin fondos añadidos que hagan más visibles los artefactos verdes que dejó Sprite Lab en algunos píxeles del GIF.
- En la experiencia real no mostrar el título «escena de prueba», controles de audio con etiquetas ON/OFF, puntos decorativos genéricos, líneas amarillas de pie ni botón «salir de la prueba».
- El botón para continuar debe ser texto pixel sin recuadro grande, al estilo de una opción de juego.
- El control para silenciar música puede estar discreto en la esquina superior izquierda de la escena de prueba. La interfaz definitiva debe revisarse por separado.
- El texto se revela progresivamente con un efecto de escritura y un sonido de teclado discreto. Mientras se escribe, el control de avance debe permanecer deshabilitado/bloqueado; solo habilitarlo al terminar. Evitar un botón «mostrar texto» durante la animación.
- La escena de prueba no debe persistir las respuestas; es para inspección visual y ajuste antes de integrar el flujo definitivo.
- Mantener la música y el sonido de escritura como controles/activos separados. Silenciar la música no debería implicar que el usuario pierda el control del sonido de escritura, salvo que se decida expresamente después.

## Lógica del onboarding que debe respetarse

Preguntas previstas en la escena de prueba:

1. **¿En qué etapa estás?** Grado 10, Grado 11, Ya me gradué, Otra situación.
2. **¿Qué experiencia tienes con el ICFES?** Las opciones dependen de la etapa.
3. **¿Qué quieres conseguir primero?** Fortalecer mis bases, Mejorar en lo que me cuesta, Subir mi puntaje, Practicar y medir mi nivel.
4. Mostrar una recomendación inicial coherente, no preguntar al final cómo se siente con Matemáticas.

Reglas de coherencia:

- Un estudiante de grado 10 no debe recibir la opción de haber presentado ya Saber 11 como si fuera lo normal. Para décimo, ofrecer empezar desde cero o haber practicado con simulacros.
- En grado 11 puede estar empezando, haber practicado o haber presentado el examen.
- Para personas graduadas u otra situación se puede ofrecer que lo presentaron una vez o varias veces, además de otras experiencias pertinentes.
- No inferir dominio académico solo por haber presentado el examen o hecho simulacros.
- La recomendación es una orientación inicial; más adelante debe validarse y ajustarse con el diagnóstico real, las respuestas y el progreso del estudiante.

Nombres provisionales de rutas presentes en la prueba (no se consideran nombres finales de los niveles):

- Campamento Base / Campamento de Exploración
- Ruta de Refuerzo
- Ascenso al Puntaje / Despegue Saber 11
- Zona de Exploración
- Segundo Ascenso / Ruta de Reintento

## Construcción de niveles: siguiente trabajo

Construir los niveles en `feat/founder-intro`, reutilizando el sistema, componentes, autenticación y base de datos que ya tiene PeakScore. Antes de cambiar una tabla o crear rutas nuevas, inspeccionar el código y el esquema existente para no inventar nombres, duplicar funcionalidad o romper el banco de preguntas y los simulacros.

Contexto de diseño/progresión ya conversado:

- Las materias del producto son Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.
- La estructura conceptual propuesta contempla 5 niveles por materia; cada nivel completado puede otorgar +25 XP.
- No permitir volver a farmear XP repitiendo un nivel ya recompensado.
- El XP competitivo de rango corresponde a la temporada actual; el XP histórico no determina por sí solo el rango competitivo actual.
- La temporada se planteó con una duración de dos meses.
- Usar nombres temáticos/narrativos para las rutas, no nombres genéricos como «Nivel 1», «Nivel 2», etc. Los nombres definitivos deben corresponder al contenido real y a la dificultad.
- Diseñar las rutas a partir del marco real de Saber 11: competencias, componentes y progresión pedagógica. No crear preguntas o afirmar cobertura oficial sin contrastar el material disponible.
- Los simulacros simples y completos, el banco de preguntas y el dashboard ya existen en el proyecto; no reemplazarlos por un sistema paralelo.

Antes de implementar la progresión, definir y documentar: contenido de cada nivel, objetivo de aprendizaje, prerrequisitos, actividad/práctica, criterio de finalización, feedback, XP y protección contra recompensas duplicadas. Separar la definición curricular de la lógica de presentación cuando la arquitectura actual lo permita.

## Verificación y futura integración a main

1. Trabajar en `feat/founder-intro` y no hacer commits de desarrollo directamente en `main`.
2. Sincronizar con el remoto antes de empezar si hay commits remotos nuevos.
3. Inspeccionar las rutas, componentes, migraciones y esquema existentes antes de añadir niveles.
4. Ejecutar `npm run build` después de cambios relevantes. El usuario reportó previamente que el build de su versión anterior pasó, pero eso no verifica automáticamente los commits posteriores de esta rama.
5. Ejecutar `npm run lint` y registrar/atender errores; el usuario había informado que lint mostraba muchos errores pendientes.
6. Probar onboarding con cuentas nuevas y existentes, responsive, reproducción de audio, avance del diálogo y persistencia de respuestas.
7. Probar niveles, finalización, XP, bloqueo de repetición de recompensas y compatibilidad con simulacros/banco de preguntas.
8. Revisar diferencias con `main`, abrir/revisar un pull request y resolver conflictos antes de integrar.
9. Solo después de validar la experiencia completa, integrar los cambios a `main`. No dar por desplegado algo que solo existe en la rama de desarrollo.

## Comandos locales de referencia

Desde `C:\Users\hogar\Desktop\PeakScore`:

```powershell
git status
git switch feat/founder-intro
git pull --rebase origin feat/founder-intro
npm run build
```

No ejecutar un rebase si hay cambios locales sin guardar; primero revisar `git status` y proteger el trabajo existente.

## Estado al crear esta nota

- El usuario pidió dejar `/intro-test` tal cual por ahora.
- La siguiente prioridad acordada es construir los niveles en la misma rama.
- La integración a `main` queda para después de construir y probar.
- Esta nota documenta decisiones y contexto; no es una certificación de que el código actual haya superado pruebas de extremo a extremo.
