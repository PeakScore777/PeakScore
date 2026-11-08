# Orby Live Tutor — especificación de experiencia, sincronización y calidad

**Fecha:** 2026-11-07  
**Estado:** especificación de producto y criterios de aceptación; no implica que las animaciones descritas ya estén implementadas.  
**Referencia visual obligatoria:** video aportado por el propietario el 2026-11-07 (tutor explicando y desarrollando un esquema biológico sobre una pizarra).

## 1. Visión del producto

Orby debe sentirse como un profesor particular que explica en voz alta y construye una pizarra mientras enseña. La voz y el tablero son dos partes de una misma clase: no son una respuesta de audio acompañada por una imagen decorativa.

La experiencia de referencia muestra a un tutor que desarrolla un dibujo/diagrama sobre una superficie de escritura, añadiendo elementos y anotaciones mientras explica. En PeakScore, la representación puede ser digital y limpia, pero debe conservar esa sensación de construcción en directo.

## 2. Comportamiento obligatorio

1. **Hablar y dibujar en paralelo:** la explicación oral debe avanzar mientras aparecen trazos, flechas, rótulos, fórmulas, ejes, conexiones y etapas.
2. **Construcción progresiva:** no mostrar siempre el diagrama completo de golpe. Dividir la explicación en pasos visuales pequeños y acumulativos.
3. **Trazos visibles:** cuando corresponda, líneas y curvas deben dibujarse progresivamente; nodos, etiquetas y fórmulas deben aparecer en el momento pedagógico adecuado. No fingir escritura manual con un simple fade-in de toda la tarjeta.
4. **Narración sincronizada:** cada paso del tablero debe corresponder con la parte de la explicación que se está pronunciando. No revelar resultados o respuestas antes de explicarlos.
5. **Tablero acumulativo:** las actualizaciones posteriores deben conservar lo que ya se explicó, salvo que Orby borre o reinicie explícitamente el tablero.
6. **Interrupciones naturales:** si el estudiante interrumpe, detener o invalidar la animación y el audio del turno anterior; responder la nueva pregunta y continuar desde el contexto válido, sin mezclar dibujos antiguos.
7. **Repetir y aclarar:** si el estudiante pide repetir, ampliar o corregir, Orby debe poder resaltar, rehacer o añadir al elemento pertinente sin reiniciar toda la clase.
8. **Cierre de clase:** dejar el tablero final legible y completo, con una síntesis breve y sin animaciones pendientes.
9. **Accesibilidad y control:** respetar prefers-reduced-motion, permitir pausar/detener voz, mantener contraste, texto legible y controles accesibles. La información no puede depender únicamente del color o del movimiento.
10. **Degradación honesta:** si el proveedor no entrega audio o actualizaciones visuales, informar o degradar con claridad; nunca simular sincronización que no ocurrió.

## 3. Secuencia pedagógica por respuesta

- **Fase 0 — Comprender:** identificar pregunta, área, tema, nivel y objetivo. Determinar si realmente hace falta una pizarra; saludos y respuestas breves no deben forzar dibujos.
- **Fase 1 — Planificar:** crear una secuencia corta de escenas/acciones. Cada acción debe tener contenido, orden, relación con la explicación y, cuando sea posible, una referencia temporal o de segmento de voz.
- **Fase 2 — Presentar:** mostrar título y primer elemento. La voz introduce el concepto antes o al mismo tiempo que aparece.
- **Fase 3 — Desarrollar:** agregar trazos, conexiones, etiquetas, operaciones y ejemplos en orden. La pizarra conserva las acciones previas.
- **Fase 4 — Comprobar:** revisar consistencia conceptual, unidades, cálculos, nombres, flechas, secuencias y etiquetas antes de presentar cada acción.
- **Fase 5 — Cerrar:** mostrar resultado y resumen; dejar una pregunta de comprobación cuando sea útil.

No usar pausas artificiales largas para esperar dibujos. La primera voz y el primer elemento útil deben llegar pronto; la animación debe ser fluida y no bloquear audio, micrófono ni controles.

## 4. Lenguaje visual y materias

- **Matemáticas:** desarrollar operaciones línea por línea; indicar qué representa cada símbolo; construir gráficas desde ejes a puntos y curvas; mostrar vectores desde origen hasta componentes.
- **Ciencias Naturales:** dibujar células, organelos, ADN, neuronas, sistemas y procesos fisiológicos con etiquetas y relaciones correctas; respetar secuencias biológicas.
- **Química:** construir moléculas mostrando átomos y enlaces; distinguir elementos, cargas y tipos de enlace; no inventar estructuras químicas.
- **Física:** diagramar fuerzas, circuitos, movimiento, energía y ondas; mantener magnitudes, unidades y direcciones coherentes.
- **Sociales y Ciudadanas:** construir líneas de tiempo, mapas conceptuales, relaciones causa-consecuencia y tablas comparativas sin presentar interpretaciones discutibles como hechos.
- **Lectura Crítica:** subrayar o destacar fragmentos, tesis, argumentos, inferencias y relaciones textuales; no inventar citas del texto del estudiante.
- **Inglés:** destacar vocabulario, estructura gramatical y pistas contextuales. El banco de preguntas sigue siendo curado manualmente; esta especificación no autoriza generación automática de preguntas del banco.

Los diagramas son apoyos explicativos originales y no deben copiar material protegido del Icfes.

## 5. Contrato técnico recomendado

La salida visual debe ser una **secuencia de acciones tipadas**, no únicamente un snapshot final. Cada acción debería incluir:
- id estable y único dentro del turno;
- sequence monotónico;
- tipo de acción (trazo, línea, flecha, nodo, etiqueta, fórmula, punto, resaltado, borrado o paso);
- datos tipados y validados;
- dependsOn opcional para ordenar dependencias;
- vínculo a un segmento/fragmento de narración cuando el proveedor lo permita;
- duración sugerida acotada, sin permitir que el modelo bloquee la interfaz.

El cliente debe:
- procesar acciones de forma incremental;
- rechazar duplicados y secuencias antiguas;
- conservar el tablero acumulativo;
- cancelar acciones pendientes al cambiar de turno;
- sincronizar por eventos/segmentos reales si están disponibles;
- no inferir tiempos exactos de voz a partir de texto cuando no exista alineación;
- renderizar una versión estática final accesible si las animaciones están desactivadas.

El contrato actual de OrbyBoard (bloques + hasta cuatro visuales tipados) es una buena base de contenido, pero un objeto completo reemplazado en cada actualización no garantiza por sí mismo el efecto de escritura en directo. La transición de snapshots a acciones incrementales debe ser compatible y gradual, sin romper persistencia ni fallback.

## 6. Criterios de aceptación medibles

- La voz comienza sin esperar a que termine de construirse el tablero.
- La primera acción visual útil aparece durante la explicación, no solo al final.
- En una lección de varios pasos se observan al menos tres actualizaciones acumulativas cuando el contenido lo justifica.
- Los trazos/relaciones aparecen progresivamente y en el orden explicado.
- No hay saltos hacia atrás, duplicados, parpadeos ni pérdida de elementos previos.
- Una interrupción invalida el audio y las acciones pendientes del turno anterior.
- La nueva respuesta no reutiliza acciones del turno anterior por error.
- Live y fallback mantienen la misma semántica de tablero y una degradación entendible.
- El tablero final puede leerse sin movimiento y funciona con movimiento reducido.
- Los diagramas superan validaciones de estructura y reglas específicas del dominio.
- No se agregan proveedores de pago ni llamadas de IA adicionales por defecto.

## 7. Pruebas obligatorias antes de declarar listo

1. Biología: construir una célula y etiquetar componentes mientras se explican.
2. Matemáticas: resolver una operación y construir una gráfica por etapas.
3. Física: dibujar un vector y explicar sus componentes.
4. Química: construir una molécula y validar enlaces/valencias con reglas disponibles.
5. Sociales: desarrollar una línea de tiempo con orden cronológico.
6. Lectura crítica: destacar tesis y evidencias de un texto suministrado.
7. Inglés: mostrar pistas gramaticales/contextuales sin alterar el banco manual.
8. Interrumpir durante el dibujo y hacer una pregunta diferente.
9. Pedir “repite esa parte” y comprobar que Orby retome el punto correcto.
10. Desconectar Live y verificar el fallback por turnos.
11. Activar movimiento reducido y verificar que el tablero siga siendo comprensible.
12. Agotar cuota gratuita y verificar que no haya fallback facturable.

Registrar por prueba: primera palabra audible, primer audio, primera acción visual, separación entre narración y acción, duración total, errores de validación, cancelación por interrupción y resultado final.

## 8. Estado real auditado el 2026-11-07

- Live puede enviar varias actualizaciones acumulativas mediante render_orby_teaching_board; el cliente sanitiza cada tablero y actualiza el mensaje activo.
- La ruta fallback ahora solicita board versión 2 con bloques y visuales tipados.
- El componente OrbyBoard.tsx renderiza los visuales como SVG estático. En el código inspeccionado no se encontró un motor de trazos progresivos ni un contrato de acciones visuales enlazadas a segmentos de audio.
- Por tanto, **la experiencia del video todavía no está demostrada ni completa**. Actualizar snapshots mientras se habla no equivale a dibujar cada trazo sincronizado con la voz.
- No se han ejecutado en esta revisión pruebas de navegador, micrófono, TypeScript, ESLint, build ni CI. No afirmar que están aprobadas.

## 9. Restricciones y prioridades

- Mantener servicios y modelos estrictamente gratuitos dentro de cuotas reales. Sin API de pago, créditos facturables ni fallback silencioso.
- No reconstruir materiales del Orby ICFES Lab eliminados intencionalmente.
- No modificar main, no desplegar y no aplicar migraciones remotas sin autorización.
- Prioridad: diseñar e implementar primero una capa de acciones incrementales con cancelación por generación; después enlazar eventos de tablero con la narración real disponible y probar en Chrome.

## Addendum — spatial teaching canvas v2

A board v2 may include the optional property:

```ts
layout: {
  aspectRatio: "16:9";
  elements: Array<{
    id: string;
    sequence: number;
    kind: "block" | "visual";
    index: number;
    x: number; y: number; width: number; height: number;
  }>;
}
```

Invariants:
- Each block and each visual is referenced exactly once by zero-based index.
- Element IDs are stable, unique ASCII identifiers (1–24 characters).
- Sequence is contiguous and increasing from 1; append new stages without renumbering existing stages.
- All normalized rectangles remain inside 0–100; the renderer places them on one responsive 16:9 paper canvas.
- New v2 tutor output should include layout. Legacy v1 and v2 without layout remain valid and use the old renderer.
- Every snapshot remains complete and cumulative; it carries existing layout elements plus any appended stages.
- The canvas has a subtle dotted paper background; text, sketch strokes and typed visuals can be interleaved spatially.
- Spatial order is not exact audio alignment. Use actual provider speech-segment metadata if available; never guess timestamps.

The implementation is backward-compatible with the current JSONB teaching_board persistence. Client sanitizer budget (18 KB) remains below the existing RPC limit (24 KB); no database migration is needed for the optional field.

Next implementation layer: a typed incremental action queue with generation IDs, idempotency, dependencies, cancellation on interruption, and compatibility with focus/erase/replace. Do not restore student drawing controls.
