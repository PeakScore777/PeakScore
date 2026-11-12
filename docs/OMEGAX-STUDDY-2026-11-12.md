# Especificación de experiencia Studdy para OmegaX
**Fecha:** 12 de noviembre de 2026  
**Proyecto:** PeakScore  
**Rama:** `feat/founder-intro`

> **Principio rector:** OmegaX no es un chatbot con una pizarra al lado. Debe sentirse como un profesor que dirige una clase visual de principio a fin, mantiene el hilo pedagógico, escribe y dibuja en el tablero e invita al estudiante a participar.

## 1. Flujo de entrada
1. El estudiante entra a la página principal de estudio.
2. Elige el modo Tema, Preparación para exámenes o Tarea y escribe qué quiere aprender.
3. Puede iniciar con el botón o con Enter. Shift+Enter conserva la posibilidad de escribir varias líneas.
4. Al enviar, aparece una transición de carga inmersiva, con estética de juego.
5. No se muestran mensajes técnicos como “preparando la clase”, “iniciando servidor” o “conectando con Gemini”. La espera debe ser discreta y visual.
6. Cuando la sesión está lista, se entra directamente al aula.

## 2. Apertura de la clase
1. La clase abre en un tablero visual, nunca en una conversación de chat.
2. El título se escribe progresivamente con animación manuscrita.
3. Un lápiz animado acompaña el trazo; no usar el emoji genérico ✏️.
4. El título queda resaltado en amarillo como en la referencia.
5. OmegaX presenta brevemente el objetivo y los contenidos de la clase.

## 3. Enseñanza visual
La explicación debe variar según el tema, no usar siempre una plantilla:
- A veces comienza con un dibujo y una narración que desarrolla la idea como una historia.
- Otras veces comienza narrando y escribiendo puntos clave, para después dibujar, diagramar o dar ejemplos.
- Puede señalar, subrayar, conectar, encerrar y resaltar palabras o conceptos importantes con trazos animados. El usuario solicita círculos azules para enfatizar conceptos.
- Los textos, subtítulos, dibujos y trazos aparecen progresivamente y sincronizados con la explicación.
- El tablero conserva lo ya explicado; no sustituirlo continuamente por una diapositiva nueva.

## 4. Interacción pedagógica
- OmegaX hace preguntas al estudiante durante la clase y fomenta su participación sin volver la sesión un interrogatorio.
- Mantiene el hilo de la explicación, recuerda la pregunta que hizo y la respuesta del estudiante.
- Después de una intervención, retoma exactamente el punto pedagógico correcto, sin reiniciar ni repetir innecesariamente.
- Evita monotonía alternando narración, puntos clave, dibujos, ejemplos y preguntas.

## 5. Chat lateral
- El control de chat se encuentra a la derecha y tiene una animación premium.
- Al pulsarlo abre una burbuja/panel flotante integrado con el tablero.
- Enter envía el mensaje; no obliga a pulsar el botón.
- Si está vacío y el usuario hace clic fuera, se cierra.
- No perder texto escrito por cerrar accidentalmente ni perder el contexto de la clase.
- El chat es una vía alternativa de intervención, no debe convertir el aula en una interfaz convencional de mensajería.

## 6. Pausa y reanudación
- Hay un botón de pausa visible.
- Pausar congela el avance de la explicación y las animaciones de clase que correspondan.
- Reanudar continúa exactamente desde el mismo punto, conservando tablero, estado y contexto. No reiniciar ni saltar pasos.

## 7. Audio y micrófono
- Incluir control de volumen/silencio durante la clase.
- El micrófono es opcional y nunca se activa automáticamente.
- No pedir permiso de micrófono al entrar. Solicitarlo solo después de que el estudiante pulse explícitamente el control de voz.
- Si el estudiante utiliza solo el chat, no pedir permiso durante la clase.
- Si el permiso se deniega, el chat debe seguir disponible y la clase no debe bloquearse.

## 8. Salida de clase
- El botón de salir está en la parte superior.
- Al pulsarlo aparece una confirmación visual integrada con la pregunta de si está seguro.
- Cancelar vuelve a la misma clase sin perder estado; confirmar termina la sesión de forma controlada.

## 9. Herramientas laterales que deben conservarse
- Flashcards.
- English Studio / herramientas de inglés.
- Escáner desde la cámara del teléfono para fotografiar una página, ejercicio o material y pedir a OmegaX que lo analice y explique dentro del contexto de la clase.
- Apuntes, recursos, cuestionarios y otras herramientas existentes que se validen en la auditoría.
- No dejar botones decorativos: cada herramienta debe abrir y completar su función.

## 10. Integración global
OmegaX debe estar disponible en las páginas internas de PeakScore con contexto de la página actual. Excluir:
- landing / página pública;
- login;
- registro;
- simulacros.

Evitar instancias duplicadas, superposición de launchers y sistemas paralelos.

## 11. Fidelidad visual a Studdy
Los videos compartidos el 12/11/2026 son la referencia visual y de comportamiento. Comparar directamente:
- composición, proporciones y fondo del tablero;
- paleta, tipografía, contraste y controles;
- título manuscrito, resaltado amarillo y lápiz animado;
- escritura progresiva, subtítulos y teoría;
- dibujos, diagramas, flechas y círculos de énfasis;
- ritmo, transiciones y microinteracciones;
- chat flotante y animación de apertura/cierre;
- pausa, volumen, micrófono y confirmación de salida;
- estados de carga, error y reanudación.

No sustituir rasgos de Studdy por emojis genéricos, tarjetas de chatbot o controles improvisados. El objetivo es reproducir con la mayor fidelidad posible la experiencia mostrada, no crear una interpretación libre.

## 12. Archivos de referencia localizados
Repositorio: `PeakScore777/PeakScore`; rama: `feat/founder-intro`.

- `components/aprender/LessonAITutor.tsx`: orquestación de clase y herramientas.
- `components/aprender/OrbyBoard.tsx`: tablero y trazos visuales.
- `components/aprender/OrbyBoardTitle.tsx`: título manuscrito y lápiz.
- `components/aprender/OrbyWorkspacePage.tsx`: montaje del espacio dedicado.
- `components/aprender/OmegaXStudyHome.tsx`: home alternativo; verificar uso antes de tocarlo.
- `components/layout/GlobalOrbyClassroomLauncher.tsx`: launcher global.
- `app/orby/page.tsx`: ruta dedicada y autenticación.
- `app/layout.tsx`: montaje global.
- `app/dashboard/layout.tsx`: protección del área privada.

Estos son puntos de auditoría, no una lista de archivos que deban reemplazarse todos. Verificar dependencias y usos antes de modificar.

## 13. Restricciones y criterios de aceptación
- No introducir proveedores, modelos, APIs ni fallbacks que puedan generar cargos. Respetar el uso exclusivo de servicios gratuitos; si se agota una cuota gratuita, informar o pausar de forma segura.
- No pedir permiso de micrófono sin acción explícita.
- No eliminar las herramientas existentes ni modificar las rutas excluidas.
- Probar el flujo completo, no solo que compile.
- Comparar visualmente cada etapa con los videos de referencia.

Checklist:
- [ ] Tema se envía con botón o Enter.
- [ ] Carga inmersiva sin texto técnico visible.
- [ ] Entrada a tablero, título manuscrito, lápiz animado y resaltado amarillo.
- [ ] Introducción del objetivo de clase.
- [ ] Explicación alterna narración, puntos clave, dibujos y ejemplos.
- [ ] Énfasis visual animado y preguntas al estudiante.
- [ ] Continuidad pedagógica tras las respuestas.
- [ ] Chat lateral premium, Enter para enviar y cierre exterior cuando está vacío.
- [ ] Pausa/reanudación exacta.
- [ ] Volumen funcional y micrófono solo con consentimiento explícito.
- [ ] Salida con confirmación.
- [ ] Flashcards, inglés y escáner accesibles y funcionales.
- [ ] OmegaX global salvo landing, login, registro y simulacros.
- [ ] Sin servicios ni fallbacks de pago.
- [ ] Validación visual contra los videos.

## 14. Método de implementación
1. Auditar el flujo real y las dependencias en `feat/founder-intro`.
2. Comparar home, carga, tablero, animaciones, chat, controles, herramientas y launcher con los videos.
3. Separar lo reutilizable de la lógica heredada que contradiga el objetivo.
4. Implementar cambios pequeños, coherentes y verificables; no reescrituras masivas a ciegas.
5. Probar funcionalidad, accesibilidad, continuidad y apariencia en el navegador.
6. No declarar terminado un cambio solo porque compila.

**Prioridad:** fidelidad a Studdy, continuidad de la clase y conservación de las herramientas de PeakScore.
