# Continuidad — Orby Live / rediseño inspirado en Studdy

Fecha de actualización: 2026-11-10  
Repositorio: PeakScore777/PeakScore  
Rama de trabajo y fuente de verdad: feat/founder-intro  
No trabajar sobre main salvo instrucción explícita.

## Objetivo vigente

Elevar Orby Live al nivel de acabado, claridad y fluidez de la referencia visual/vídeos de Studdy enviados por el usuario. No basta con retoques CSS aislados: revisar la experiencia completa desde la pantalla inicial hasta la clase Live terminada.

### Diseño solicitado
- Eliminar por completo los tonos crema/beige de la experiencia de estudio.
- Superficie limpia blanca con degradado pastel azul/lila/rosa muy sutil, como la referencia de Studdy.
- Inicio centrado, despejado, sin imágenes decorativas ni chips «Prueba con» que estorben.
- Quitar el botón redundante «+ Nueva clase» del menú lateral.
- Menú lateral ligero, natural y rápido: sin blur pesado, sin animaciones largas, sin saltos/reflows; estados hover, active, click y focus refinados.
- Mantener un lenguaje visual coherente en encabezado, controles, biblioteca, pizarra, subtítulos, errores y modales.
- Responsive real en escritorio, portátil, tablet y móvil; respetar safe areas, alturas dinámicas y scroll interno.
- Las imágenes/diagramas educativos de la clase deben tener calidad visual alta y aparecer solo cuando ayuden a enseñar; no añadir imágenes decorativas al home.
- Mantener el tablero de clase blanco, amplio, legible, con dibujo progresivo y título sincronizado.

### Flujo pedagógico esperado (no saltar etapas)
1. El alumno escribe el tema y elige intención/área si lo desea.
2. Al pulsar «Comenzar», verificar sesión, biblioteca, cuota, consentimiento y disponibilidad del proveedor antes de entrar.
3. Mostrar estado «Preparando la clase…» mientras se establece conexión.
4. No mostrar la clase como iniciada ni solicitar contenido/voz al tutor hasta recibir confirmación real de conexión (setupComplete).
5. Una vez conectado, entrar al aula, escribir/animar el título y luego comenzar la explicación oral.
6. La pizarra se dibuja por etapas cuando la explicación lo requiere; no forzar diagramas para cada respuesta.
7. Subtítulos parciales deben reemplazarse/actualizarse, no acumularse; sincronizar con el texto y audio del turno actual.
8. Un fallo de conexión debe dejar claro que no empezó la clase, detener/liberar micrófono y permitir reintentar explícitamente. Nunca fingir conexión ni saltar a un fallback de pago.

## Reglas que no se deben romper
- Presupuesto estricto: usar solo servicios/modelos que puedan funcionar sin coste dentro de cuotas gratuitas reales. No introducir APIs pagas, créditos facturables ni fallbacks que puedan generar cargos. Si se agota una cuota, degradar/pausar con aviso.
- Orby es tutor de contenido ICFES/Saber 11; no debe enseñar programación ni temas externos al currículo objetivo.
- Responder en español colombiano salvo ejercicios de inglés que lo requieran.
- No atribuir Orby a Google ni mencionar otros preICFES como recomendación/promoción. Mantener transparencia de privacidad y proveedores cuando corresponda.
- El material del Orby ICFES Lab fue eliminado intencionalmente por el usuario. No reconstruirlo ni tratarlo como error. No usar el antiguo conteo de 28 conceptos de Química.
- Las conversaciones antiguas de texto no deben confundirse con las clases Live actuales. No reintroducir historial de clases viejo como si fuera el flujo Live.
- No romper el tablero, persistencia de turnos, historial de mensajes, captions ni funciones de clase que ya funcionan.

## Estado técnico comprobado

### Base de datos / biblioteca
Proyecto Supabase: avmywztnsrnyjhvbaiio.

Verificación directa del 2026-11-10:
- public.orby_conversations.session_type existe, es text NOT NULL, default 'chat'.
- Migración 20261110222914_orby_live_class_sessions está aplicada.
- RLS de orby_conversations: usuario autenticado puede leer/insertar/actualizar/eliminar solo sus propias conversaciones.
- GET /api/orby/conversations consulta solo session_type = 'live', ordena por updated_at y limita a 50.
- POST asigna live solo si el body lo pide explícitamente; en otro caso chat. Cuenta por usuario y tipo y bloquea si alcanza 50.
- La columna ausente NO es la causa actual: no crear otra migración para volver a añadirla.
- El mensaje «No se pudo verificar tu biblioteca de clases» viene de la prevalidación en startWorkspaceClass() cuando GET no devuelve una lista válida; revisar respuesta HTTP/auth/cookies/errores de Supabase en la versión desplegada. No ocultar el error ni permitir iniciar si la verificación falla.

### Inicio de clase
En components/aprender/LessonAITutor.tsx, startWorkspaceClass():
- normaliza tema;
- bloquea doble submit con classStartInFlightRef;
- hace GET con credentials: same-origin, cache: no-store, timeout 8 s;
- no toca micrófono ni inicia si la biblioteca no valida o tiene 50 clases;
- luego prepara y llama toggleVoiceMode(true, true).
Revisar el flujo de estados alrededor de toggleVoiceMode, startRealtimeVoice, ensureVoiceConversation y handleInitialClassTitleComplete para garantizar la secuencia anterior.
Las clases Live se crean con session_type: live desde ensureVoiceConversation / createVoiceConversation.

### Últimos cambios guardados en GitHub (rama feat/founder-intro)
1. 1f55564c0e9b39cb8d8a02ae3108fa8cbce4db41 — Improve Orby Live class preflight and remove redundant new-class action
   - Añadió prevalidación de biblioteca antes de activar micrófono.
   - Quitó botón redundante «Nueva clase».
   - Eliminó blur del backdrop.
2. 0515d6dfcfaf83cc0865c2b7397d1f9af3fc8b51 — Polish Orby Live workspace styling and responsive lightweight drawer
   - Ajustes iniciales de drawer, duración y responsive.
3. 42a8cbbc6c7158ad9da56c3ff8ab93fee121bf70 — Remove distracting topic suggestions from Orby Live home
   - Eliminó la sección «Prueba con» de la pantalla inicial.
4. e352aea250af5acbe247fca4506f349059103792 — Replace cream Orby workspace theme with clean pastel blue
   - Primera corrección de la cascada de estilos crema.
5. 57098a1581b359da38bd775bc738eef2b7a60517 — Polish Orby Live pastel interface and responsive drawer
   - Añadió overrides finales para degradado pastel, drawer blanco, estados activos, microinteracciones y responsive.

### Deploy / pruebas
- Los despliegues de los commits 1 y 2 quedaron READY en preview:
  - dpl_ehfC8kyXgUfezsHdRfYojeaCEbzq (commit 1f55564)
  - dpl_4m4Lm74KC6Mjnx9Aj9moy7u6reBu (commit 0515d6d)
- Esos previews NO contienen los cambios posteriores 42a8cbb, e352aea ni 57098a1.
- Se intentó crear un preview para 57098a1, pero Vercel respondió HTTP 402: límite de despliegues API del plan gratuito superado (más de 100 en 24 h; retryAfter 86400). No es un error de código. No intentar sortear el límite ni actualizar plan automáticamente.
- Runtime logs: ventana 50 min consultada sin logs de error de Orby; ventanas mayores no están disponibles por retención Hobby.
- Un despliegue anterior (af4eb23) falló en npm run test:orby por una aserción de test desactualizada sobre item.teaching_board. En la rama actual el test fue actualizado para exigir que el cliente no lea item.teaching_board directamente; comprobar de nuevo la suite al próximo build permitido.
- No afirmar que los últimos cambios están desplegados ni que todo está probado hasta tener build/checks verdes y prueba manual.

## Próximas tareas, por prioridad
1. Continuar auditoría del endpoint GET biblioteca y de autenticación/cookies; encontrar el origen del error visto por el usuario. Añadir tests de ruta para GET: 200 lista vacía, 401 sin sesión, 503 ante error Supabase, filtro live y límite 50.
2. Revisar secuencia de inicio Live completa y asegurar que el aula solo aparece después de setupComplete; cubrir error, cancelación, permisos y reintento.
3. Ejecutar/revisar npm run test:orby, npm run lint, next build en el próximo despliegue permitido. No borrar ni debilitar tests para obtener verde.
4. Revisar subtítulos: chunks parciales, duplicados, orden, sincronización audio/transcripción, captions vacíos y cierre del turno.
5. Auditar menú lateral completo: layout, scroll, focus trap si aplica, Escape, backdrop, touch, reducción de movimiento, evitar timers/animaciones y blur innecesarios.
6. Auditar home y responsive en anchos representativos: 360, 390, 768, 1024, 1366, 1440 px y alturas pequeñas de portátil.
7. Revisar pipeline de ilustraciones: calidad, proporción, resolución, límites de payload, lazy loading, evitar re-render del tablero completo por cada trazo y no generar imágenes decorativas.
8. Probar clase real end-to-end con micrófono autorizado: tema → conexión → título → voz → pizarra → subtítulos → pausa/interrupción → persistencia → terminar.
9. Mantener esta nota actualizada con commits, resultados de tests y bloqueos de despliegue.

## Instrucción para continuar en otro chat si fuera necesario
Leer este archivo primero y continuar desde el punto pendiente en feat/founder-intro. No repetir auditoría ni volver a preguntar por preferencias ya descritas. No modificar main, no recrear material eliminado del Orby Lab y no declarar terminado hasta validar biblioteca, inicio Live, captions, tablero y responsive.
