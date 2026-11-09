# OmegaX / Orby — revisión visual de los videos Studdy y siguiente iteración
**Fecha:** 2026-11-09  
**Rama:** `feat/founder-intro`  
**Base revisada:** HEAD `f1a73cde59268ab99afbac2004108799d70d3c48`  
**Alcance:** inspección visual de los dos MP4 aportados en esta sesión. No se afirma transcripción ni validación acústica del audio.

## 1. Material observado
- `studdy.mp4`: 47.6 s. Muestra entrada al espacio de estudio, una clase ya abierta con pizarra manuscrita, explicación biológica, diagramas, controles compactos de voz y salida de la clase.
- `studdy (2).mp4`: 309.1 s. Muestra la página pública y el acceso al aula, después una sesión extensa de biología: título persistente, pregunta/explicación a la izquierda, ilustraciones y diagramas que se agregan progresivamente, señalamiento de partes y continuidad del contenido entre etapas.

La inspección fue por fotogramas. No inferir proveedores, frameworks ni arquitectura interna de Studdy a partir de la interfaz. No copiar marca, textos ni ilustraciones propietarias.

## 2. Patrones funcionales que debemos igualar o superar
1. **Aula como espacio de trabajo:** la pizarra es el foco principal; los controles de voz son discretos y no compiten con el contenido.
2. **Explicación acumulativa:** las notas y dibujos anteriores permanecen mientras el profesor añade el siguiente concepto.
3. **Composición legible:** texto breve, ilustración central, etiquetas y relaciones claras; no convertir la pizarra en una sucesión de tarjetas inconexas.
4. **Señalamiento pedagógico:** destacar la parte exacta que se está explicando y retirar el foco sin borrar la tinta.
5. **Clase larga:** la sesión puede continuar por varias zonas/hojas sin perder contexto.
6. **Interacción natural:** el estudiante debe poder interrumpir, pedir aclaración, solicitar repetición y volver a la explicación.
7. **Entrada simple:** comenzar por qué quiere aprender/resolver el estudiante y conservar el contexto al entrar a clase.

## 3. Estado verificado de PeakScore en HEAD
- Pizarra espacial v2 y multipágina v3 (2–4 hojas 16:9).
- Navegación accesible entre hojas, marcador de hoja visible sincronizado con scroll, teclado y `prefers-reduced-motion`.
- Contrato de snapshots acumulativos con IDs/sequence/page estables.
- Visuales tipados y sketch manuscrito con animación de tinta; acciones incrementales `append-block`, `append-strokes`, `focus`, `clear-focus`, `erase` y `replace`.
- Live y tutor escrito conocen el contrato v3.
- Persistencia atómica/idempotente para tutor escrito y voz, con migración SQL v3 añadida en `20261109030000_orby_multipage_board_v3_persistence.sql`.
- GitHub Actions run `42557118786` para HEAD `f1a73cde`: éxito en el job “Orby tests, TypeScript, ESLint and production build”.
- El estado de Vercel para el mismo SHA sigue indicando rate limit de despliegue; no tratarlo como build fallido del código ni intentar eludirlo con facturación.

## 4. Diferencias y límites que siguen abiertos
- **Zoom/pan:** el canvas multipágina actual se desplaza verticalmente y tiene navegación por hojas; no es todavía un lienzo con zoom y desplazamiento libre.
- **Coreografía docente:** existen acciones incrementales y foco, pero falta QA real de una secuencia larga encadenada durante voz.
- **Sincronización voz-tinta:** se ordenan eventos y se anima el trazo; no hay timestamps fonéticos exactos garantizados por el proveedor. No prometer sincronía palabra a palabra.
- **Continuidad tras recarga:** el SQL está en la rama, pero no se ha aplicado al Supabase remoto ni se ha verificado una sesión v3 recuperada del historial.
- **Gemini Live:** continúa detrás de los controles explícitos de plan gratuito y aprobación de uso de datos. No activar variables por inferencia.
- **Experiencia real:** CI no sustituye Chrome con micrófono, interrupciones, pausas, reconexiones, teclado y viewport móvil.

## 5. Siguiente orden de trabajo
### P0 — cerrar persistencia v3 sin riesgo
1. Confirmar con el responsable el entorno Supabase destino y aplicar la migración solo con autorización.
2. Verificar las dos RPC, permisos/service role, idempotencia y lectura de `teaching_board`.
3. Guardar una conversación escrita y una de voz con 2–4 hojas; cerrar y reabrir el historial para comprobar restauración completa.
4. Mantener fallback textual honesto si el esquema remoto todavía no está actualizado.

### P1 — navegación espacial de nivel aula
1. Añadir controles discretos de zoom (ajustar, acercar, alejar y restablecer) sin alterar el layout ni las coordenadas guardadas.
2. Añadir desplazamiento/pan accesible que no secuestre scroll vertical ni interfiera con selección de texto, botones o lápiz.
3. Mantener hojas 16:9 y navegación existente; definir límites de zoom, gesto táctil, rueda/trackpad y estado inicial responsive.
4. Respetar `prefers-reduced-motion`, teclado y controles etiquetados; excluir controles de impresión.
5. Probar que el cambio de escala no altera IDs, foco, orden de trazos ni detección de hoja activa.

### P2 — clase continua
1. QA del ciclo `focus → explicar → clear-focus → focus → append` en el mismo tablero.
2. Confirmar pausa/reanudación, interrupción, nueva pregunta, respuesta tardía y cancelación por generación.
3. Comprobar que el audio no espera las herramientas no bloqueantes y que no se duplica ningún fragmento.
4. Validar tutor Live y fallback por turnos con el mismo contrato pedagógico.

### P3 — pulido del aula
- Mantener controles de voz compactos y persistentes sin tapar la pizarra.
- Mejorar la entrada de estudio y el contexto materia/tema/nivel.
- Añadir recursos de clase (anotaciones, resúmenes, tarjetas y grabaciones) solo con flujos reales, persistencia y pruebas; no colocar botones decorativos sin acción.

## 6. Restricciones de seguridad y operación
- No modificar `main`, no hacer merge ni despliegue desde esta iteración.
- No activar Gemini Live ni consentimientos de datos sin confirmación explícita del responsable.
- No introducir proveedores, APIs, modelos, créditos de inferencia ni fallbacks que puedan generar cargos. Mantener solo planes gratuitos confirmados; al agotar cuota, pausar/degradar con aviso.
- No aplicar migraciones remotas sin autorización y verificación del proyecto destino.
- No afirmar QA real de audio, navegador o persistencia remota hasta ejecutar esas pruebas.

## 7. Criterio de aceptación de la siguiente entrega
La clase debe poder abrirse en varias hojas, acercarse/alejarse y desplazarse sin romper la navegación; Orby debe añadir contenido a la misma clase, señalar y retirar foco sin borrar, tolerar interrupciones, y al reabrir el historial recuperar la pizarra completa. Todo ello debe pasar tests Orby, TypeScript, ESLint, build y QA manual autorizado en Chrome.
