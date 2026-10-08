PeakScore — Plan del Perfil
Objetivo
Construir un sistema de perfil coherente con todo PeakScore, tomando como referencia visual la experiencia mostrada en GameCode, pero adaptado completamente a la identidad, navegación y gamificación propias de PeakScore.
Cambio 1 — Navbar global + menú del usuario
1. Navbar único para toda la plataforma
El mismo componente de navegación debe utilizarse en:
- Landing page
- Dashboard
- Perfil
- Simulacros
- Aprender
- Retos
- Comunidad
- Cualquier otra sección futura de PeakScore
No se crearán navbars independientes por página.
2. Navegación principal PeakScore
La navegación base definida para PeakScore será:
- Inicio
- Simulacros
- Progreso
- Aprender
- Retos
- Comunidad
- Mi Perfil
La opción de la página actual debe mostrarse como activa.
3. Identidad visual según tema
El navbar debe respetar el sistema de tema global:
Tema claro
- Fondo claro/blanco.
- Estados activos con la identidad verde de PeakScore/Nova.
- Iconografía y texto oscuros.
Tema oscuro
- Fondo oscuro.
- Estados activos con la identidad morada.
- Efectos de brillo/glow en elementos activos cuando corresponda.
El selector Sol/Luna debe funcionar desde el navbar compartido, no como lógica aislada del perfil.
4. Foto del usuario / personaje
La esquina derecha del navbar tendrá:
- Foto de perfil pixel-art correspondiente al personaje seleccionado.
- Indicador visual de estado.
- Botón clicable.
La imagen debe cambiar automáticamente cuando el usuario equipe otro personaje.
Las fotos actuales disponibles son:
/avatars/photo_perfil/peaky-nova.png
/avatars/photo_perfil/peaky-nox.png
/avatars/photo_perfil/zyrap.png
/avatars/photo_perfil/orbyp.png
5. Menú desplegable del usuario
Al hacer clic en la foto se debe abrir un panel desplegable consistente en toda la plataforma.
La interacción toma como referencia la captura proporcionada de GameCode:
- Estado del usuario.
- Estado Premium cuando corresponda.
- Racha.
- Acceso a Perfil.
- Acceso a Mis personajes.
- Acceso a Mi colección.
- Acceso a Configuración.
- Cerrar sesión.
El contenido será propio de PeakScore y no copiará textos, nombres ni elementos exclusivos de GameCode.
6. Comportamiento
El menú debe:
- Abrirse al hacer clic en el avatar.
- Cerrarse al hacer clic fuera.
- Cerrarse al seleccionar una opción.
- Mantenerse funcional en desktop y responsive.
- Mostrar información real procedente de Supabase cuando esa información ya exista.
- No depender de localStorage para información que deba ser persistente en cuenta.
7. Arquitectura prevista
El navbar debe convertirse en un componente compartido, por ejemplo:
app/components/layout/
└── Navbar.tsx
Y el menú del usuario puede separarse en:
app/components/layout/
└── UserMenu.tsx
La información dinámica del usuario debe obtenerse mediante una única fuente reutilizable para evitar duplicar lógica entre páginas.
8. Personaje seleccionado
La selección del personaje continuará siendo administrada por Supabase.
Referencia lógica actual:
profiles.selected_character
        ↓
characters
        ↓
user_characters
        ↓
foto de perfil del personaje
        ↓
navbar + perfil + futuras secciones
Esto permitirá que el personaje equipado se refleje automáticamente en toda la plataforma.
Referencia visual
Las capturas entregadas para este cambio muestran:
- Navbar superior compacto.
- Navegación centrada.
- Avatar del usuario en el extremo derecho.
- Menú desplegable al hacer clic en el avatar.
- Estados activos claramente diferenciados.
- Controles de tema y notificaciones.
- Menús desplegables coherentes con la navegación.
La referencia sirve para UX/UI, no para copiar identidad visual, textos o branding.
No hacer todavía
Este cambio NO incluye todavía:
- Rehacer todo el perfil.
- Sistema de insignias completo.
- Sistema de rangos mensual.
- Sistema de aventuras.
- Sistema de aprendizaje.
- Inventario completo.
- Tienda completa.
- Nuevos mundos.
- Animaciones complejas de personajes.
Esas partes se documentarán como cambios posteriores.
Estado
Cambio 1 — Documentado.
Siguiente fase de implementación: convertir el navbar actual en un componente global reutilizable y conectar el avatar/menú del usuario con el perfil y personaje seleccionado.
Cambio 2 — Skeleton Loading profesional
Objetivo
Eliminar la pantalla actual de carga con el texto:
Cargando PeakScore...
y reemplazarla por un skeleton loading profesional que anticipe visualmente la estructura que el usuario está a punto de ver.
Requisitos
El skeleton debe:
- Mantener la identidad visual de PeakScore.
- Aparecer mientras se cargan los datos reales desde Supabase.
- Evitar una pantalla blanca/vacía durante la carga.
- Representar aproximadamente la estructura real de la página.
- Usar bloques animados tipo pulse/shimmer de forma sutil.
- Ser responsive.
- Respetar el tema actual.
Tema claro
- Fondo blanco o muy claro.
- Bloques del skeleton en tonos gris/verde muy suaves.
- Bordes discretos.
Tema oscuro
- Fondo oscuro PeakScore.
- Bloques del skeleton en tonos oscuros con contraste suficiente.
- Brillo/pulse sutil en morado.
Estructura prevista del skeleton del perfil
Debe simular:
1. Navbar superior.
2. Título de Mi Perfil.
3. Bloque grande de Tu Peak/personaje.
4. Tarjeta superior con nombre, nivel y experiencia.
5. Tarjetas de estadísticas.
6. Bloque de Aventura.
7. Bloque de Mis personajes.
8. Bloque de Mi colección de insignias.
9. Bloques secundarios que formen parte del perfil final.
Principio UX
El usuario debe percibir que la página está cargando y reconocer la distribución de contenido antes de que lleguen los datos, en lugar de encontrarse con una pantalla vacía o un simple mensaje.
Estado
Cambio 2 — Documentado.
Implementación pendiente junto con la nueva arquitectura del perfil y navbar global.
Cambio 3 — Perfil definitivo: personajes, rango, insignias, estadísticas y misión
Este cambio define la estructura visual y funcional principal del perfil de PeakScore tomando las referencias entregadas como inspiración de UX/UI, pero con contenido, branding y mecánicas propias de PeakScore.
A. Navbar y acceso al perfil
- Se mantiene el navbar global definido en el Cambio 1.
- El enlace independiente “Mi Perfil” no debe aparecer como una sección redundante dentro del contenido del perfil.
- El acceso al perfil se realizará desde el avatar/foto del usuario del navbar.
- Al hacer clic en el avatar debe abrirse el menú de usuario y desde ahí se podrá entrar al perfil.
- El avatar del navbar debe utilizar automáticamente la foto del personaje equipado.
B. Eliminar elementos genéricos del perfil
Eliminar del diseño:
- Etiquetas decorativas genéricas como “PERFIL” en la tarjeta del personaje.
- Texto secundario innecesario debajo de los títulos principales.
- Subtítulos de branding decorativos que no aporten a la experiencia.
- Cualquier bloque visual que parezca copiado de GameCode sin una función propia en PeakScore.
C. Tu Peak / personaje principal
La tarjeta debe representar directamente al personaje equipado.
La tarjeta de personaje debe:
- Ocupar prácticamente todo el espacio disponible de la sección.
- No tener otra tarjeta/marco secundario detrás.
- Cambiar automáticamente según el personaje seleccionado.
- Utilizar las tarjetas WebP ya creadas para los cuatro personajes.
- Mantener el personaje como protagonista visual.
- Utilizar un efecto premium de glow/tilt/hover implementado en código.
Tarjetas actuales:
/characters/peaky-nova/card/peaky-nova-card.webp
/characters/peaky-nox/peaky-nox-card.webp
/characters/zyra/zyra-card.webp
/characters/orby/orby-card.webp
D. Interacción de la tarjeta principal
Al pasar el cursor:
- La tarjeta debe reaccionar suavemente.
- Debe tener brillo/glow dinámico.
- Puede inclinarse ligeramente según la posición del cursor.
- El efecto debe sentirse como una tarjeta de videojuego premium y no como una animación exagerada.
Al hacer clic:
- La tarjeta debe crecer/expandirse.
- A su lado debe aparecer la información del personaje.
- La tarjeta y el panel de historia deben formar una composición conjunta.
- Debe existir una X clara para cerrar la vista expandida.
- Al cerrar, la tarjeta vuelve con animación a su tamaño normal.
- En la vista expandida se podrá mostrar la historia, habilidad/pasiva y demás información propia del personaje.
E. Información de personajes
Cada personaje tendrá:
id
nombre
descripción
historia
habilidad
rareza/tipo
foto de perfil
tarjeta
precio en monedas
La información deberá cambiar automáticamente según el personaje seleccionado.
Estados:
Desbloqueado
- Mostrar tarjeta.
- Mostrar información.
- Mostrar opción de equipar cuando no sea el personaje actual.
Bloqueado
- Mostrar la tarjeta del personaje con tratamiento visual de bloqueado.
- Mostrar historia/descripcion según el diseño definitivo.
- Mostrar habilidad o característica del personaje.
- Mostrar precio en monedas.
Saldo insuficiente
- Abrir modal propio de PeakScore indicando que no hay suficientes monedas.
- No copiar la interfaz ni el texto de GameCode.
- En el futuro podrá incorporarse un sonido de error/feedback de videojuego pixel-art.
F. Pantalla de “Mis Personajes”
Cambios:
- El título será “Mis Personajes”.
- El bloque debe utilizar una tipografía gaming/pixel-art profesional.
- Eliminar el subtítulo genérico “Colección”.
- No mostrar simplemente precios como elemento principal.
- Cada personaje debe tener una miniatura claramente identificable.
- El personaje equipado debe destacarse visualmente.
- Los personajes bloqueados deben diferenciarse por estado, no solamente con opacity.
- Debe existir un acceso “Ver más”.
- La selección de un personaje debe actualizar la tarjeta principal y el personaje mostrado en el resto de la interfaz.
G. Fondos/biomas de personajes
Cada personaje deberá disponer de una ambientación propia y moderada que represente su identidad.
Requisito:
- No usar fondos exageradamente saturados detrás de las miniaturas.
- Cada bioma debe corresponder a los colores y personalidad del personaje.
- El bioma será utilizado como fondo/composición visual de la tarjeta o panel de personaje.
- Los biomas serán assets separados y reutilizables para no depender de una imagen gigante única.
H. Nivel / experiencia
La zona donde actualmente aparece una estrella genérica de nivel debe reemplazarse.
Nueva dirección visual:
- Usar una identidad propia de PeakScore.
- El indicador debe comunicar claramente el nivel.
- La palabra LEVEL puede utilizarse como referencia visual, pero el tratamiento final debe ser propio de PeakScore.
- El nivel actual debe mostrarse de forma destacada.
- El indicador de XP debe permanecer conectado a los datos reales de Supabase.
- La barra debe representar correctamente el progreso hacia el siguiente nivel.
I. Estadísticas
La sección debe dejar de verse como un panel administrativo/genérico.
Debe utilizar un tratamiento más gaming y visual.
Métricas base:
Monedas
Racha
Simulacros completados
Promedio ICFES
Los iconos/assets actuales pueden reutilizarse como referencia:
XP: asset de /public/peaky/homepage
Racha: /public/dashboard/racha-pixel.webp
Simulacros: /public/peaky/homepage/statslibro.png
Promedio: /public/dashboard/premio-pixel.webp
Requisitos:
- Agrandar los assets para que tengan presencia real.
- Mejorar jerarquía visual.
- Mantener datos reales cuando ya existan.
- Evitar emojis como representación principal de las estadísticas.
- Utilizar iconografía/assets de PeakScore.
J. Progreso / Aventura
La sección de progreso existente se sustituirá/transformará a una sección de:
Aventura
Por ahora:
- La sección puede permanecer como espacio reservado.
- No mostrar cursos o contenido de GameCode.
- Debe funcionar como contenedor futuro del sistema de mundos/niveles de PeakScore.
- Debe comunicar que aquí aparecerán los mundos, niveles y progreso del sistema “Aprender”.
- No inventar todavía niveles ni mundos funcionales antes de implementar dicho sistema.
K. Mis Personajes + selección
El perfil debe permitir que el usuario:
ver personajes
→ seleccionar personaje
→ equipar personaje
→ actualizar avatar global
→ actualizar tarjeta principal
→ actualizar foto del rango
La fuente de verdad continuará siendo Supabase.
L. Tu rango — sistema de temporadas
La tarjeta de rango debe:
- Utilizar la foto de perfil pixel-art del personaje equipado.
- Eliminar la estrella gris/genérica.
- Utilizar una identidad visual propia para cada rango.
- Mostrar progreso de la temporada.
- Tener un botón dinámico/profesional para abrir la lista completa de rangos.
- Evitar botones que parezcan una piedra o un componente genérico.
- Utilizar tipografía gaming legible.
Rangos definidos por PeakScore:
Renacer          0 – 499 XP
Aprendiz         500 – 1.499 XP
Explorador       1.500 – 2.999 XP
Competidor       3.000 – 4.999 XP
Avanzado         5.000 – 7.499 XP
Élite            7.500 – 9.999 XP
Maestro          10.000 – 14.999 XP
Gran Maestro     15.000 – 24.999 XP
Peak             25.000+ XP
M. Regla especial del rango Renacer
La temporada será mensual.
Nuevo usuario:
- Comienza en Aprendiz.
- No debe mostrarse Renacer como rango de inicio para una cuenta nueva.
Usuario que ya participó en una temporada:
- Al reiniciarse la temporada, su progreso competitivo vuelve a Renacer.
- Renacer representa el reinicio de un usuario que ya tiene historial de temporada.
- Un usuario veterano no debe tratarse visualmente como un usuario completamente nuevo.
- La interfaz de rangos de un usuario veterano deberá mantener la continuidad de su historial y no volver a presentar Aprendiz como si nunca hubiera progresado.
- La presentación de la secuencia visible para veteranos deberá continuar desde Renacer hacia los rangos alcanzados en temporadas anteriores, según la lógica definitiva de temporadas.
N. Recompensas por rango
Cada rango tendrá una recompensa asociada.
Esto debe quedar preparado para:
rango
→ recompensa
→ entrega al alcanzar el rango
La implementación de recompensas se conectará posteriormente con el sistema de economía/gamificación de PeakScore.
O. Modal de rangos
El modal de “Ver rangos” debe:
- Ser más grande y visual.
- Tener tipografía gaming profesional.
- Mostrar todos los rangos.
- Mostrar XP requerido.
- Mostrar identidad/descripción breve.
- Prepararse para mostrar el icono/PNG propio de cada rango.
- Mostrar claramente el reinicio mensual.
- Diferenciar visualmente entre temporada actual e historial cuando implementemos la lógica completa.
Los logos/insignias gráficas específicas de cada rango se generarán posteriormente como assets PNG.
P. Insignias
Cambios:
- Eliminar la etiqueta superior “RECOMPENSAS”.
- El título será “Insignias”.
- Mantener “Ver colección” como acceso a la biblioteca completa.
- Cambiar la tipografía por una más gaming y profesional.
- No mostrar categorías como “Conocimiento”, “Constancia”, etc. como contenido principal de las tarjetas del resumen.
- La descripción y requisitos deberán aparecer dentro de la vista completa de colección.
- Las insignias deben seguir dependiendo de los datos reales de Supabase.
Q. Biblioteca / colección de insignias
La vista “Ver colección” debe ser rediseñada.
Debe:
- Mostrar todas las insignias.
- Diferenciar desbloqueadas y bloqueadas.
- Mostrar requisitos.
- Mostrar descripción.
- Mostrar progreso cuando exista.
- Usar una presentación de videojuego premium.
- Mantener lectura clara en desktop y responsive.
- Evitar apariencia de catálogo administrativo.
R. Misión del día
La misión del día dejará de ser una tarjeta estática/genérica.
Objetivo:
- Convertirla en una mecánica propia de PeakScore.
- Mostrar una actividad diaria.
- Mostrar progreso.
- Mostrar recompensa.
- Mostrar estado: disponible / en progreso / completada.
- Conectarla posteriormente con XP y monedas.
- Integrarla con la actividad real del usuario.
La implementación funcional completa se realizará junto con el sistema de misiones y recompensas.
S. Principios visuales generales
Todo el perfil debe:
- Verse como un producto gaming educativo premium.
- Mantener la identidad PeakScore.
- Utilizar pixel-art y assets propios cuando corresponda.
- Evitar paneles excesivamente administrativos.
- Evitar copiar nombres, textos o branding de GameCode.
- Mantener legibilidad antes que exceso de efectos.
- Usar animaciones cortas y elegantes.
- Ser totalmente responsive.
- Mantener las fuentes de verdad de usuario, XP, monedas, personaje y progreso en Supabase.
Estado
Cambio 3 — Documentado.
Este cambio define la nueva arquitectura visual y funcional del perfil. La implementación se realizará por módulos para evitar romper la lógica actual de Supabase.
Siguiente prioridad de implementación: navbar global + skeleton loading + tarjeta principal de personaje + sección de personajes, antes de entrar en la lógica completa de temporadas, insignias y misiones.
Cambio 4 — Definición del Navbar global de PeakScore
Principio
El navbar de la plataforma no es el navbar de la landing.
La landing page continuará siendo una página de presentación independiente donde el visitante hace scroll para conocer PeakScore. El navbar de la plataforma será la navegación persistente de la aplicación una vez que el usuario entra al ecosistema de PeakScore.
Referencia analizada
Las capturas proporcionadas de GameCode muestran dos estados principales:
Visitante / usuario sin sesión
- Logo.
- Navegación principal con menús desplegables.
- Precios.
- Reportar Bug.
- Control de apariencia.
- Botón para unirse/crear cuenta.
Usuario autenticado
- Misma navegación principal.
- Controles de sonido/apariencia.
- Notificaciones.
- Avatar del usuario.
- El avatar abre un menú de usuario.
PeakScore usará esta estructura como referencia de experiencia, pero con navegación, nombres, contenido y branding propios.
Estado A — Usuario no autenticado
Navbar:
[ PeakScore ]
Inicio
Simulacros
Aprender
Retos
Comunidad
Precios
Reportar Bug
Tema
[ Unirme ]
Inicio
Lleva a la entrada principal de la plataforma.
No significa volver a la landing mediante anchors.
Simulacros
Menú relacionado exclusivamente con la preparación ICFES.
Contenido inicial previsto:
Simulacros
Crear simulacro
Mis simulacros
El contenido exacto se definirá cuando terminemos la arquitectura de simulacros.
Aprender
Entrada al sistema de aprendizaje de PeakScore.
Más adelante conectará con:
Materias
Mundos
Niveles
Lecciones
Práctica
Desafíos
No se deben mostrar todavía elementos que no existan.
Retos
Espacio para desafíos y actividades especiales de PeakScore.
Podrá conectar posteriormente con:
Retos diarios
Desafíos especiales
Eventos
Comunidad
Espacio social de PeakScore.
Inicialmente puede mostrar una vista de comunidad próxima a implementarse.
Precios
Acceso a los planes de PeakScore.
Reportar Bug
Mantiene el flujo actual de reporte de errores.
Tema
Control global de apariencia:
☀ Claro
🌙 Oscuro
Tema claro:
- Interfaz clara/blanca.
- Identidad verde asociada a Nova.
Tema oscuro:
- Interfaz oscura.
- Identidad morada.
Unirme
Acceso a:
/register
Para usuarios sin sesión.
Estado B — Usuario autenticado
La estructura principal permanece, pero cambia la zona derecha:
[ PeakScore ]
Inicio
Simulacros
Aprender
Retos
Comunidad
Precios
Reportar Bug
Tema
Notificaciones
Avatar
No debe aparecer un botón redundante de “Mi Perfil” en el navbar.
El perfil se abre desde el avatar.
Avatar del usuario
El avatar representa al personaje equipado por la cuenta.
Fuente de verdad:
profiles.selected_character
        ↓
characters
        ↓
personaje equipado
        ↓
foto de perfil pixel-art
        ↓
avatar del navbar
Fotos disponibles actualmente:
/avatars/photo_perfil/peaky-nova.png
/avatars/photo_perfil/peaky-nox.png
/avatars/photo_perfil/zyrap.png
/avatars/photo_perfil/orbyp.png
Cuando el usuario cambia de personaje, el avatar global debe cambiar automáticamente.
Menú del avatar
Al hacer clic sobre el avatar se abre el menú del usuario.
Contenido base propio de PeakScore:
[ Avatar + nombre ]
Estado / plan
Racha
Perfil
Mis Personajes
Insignias / Mi colección
Configuración
Cerrar sesión
La arquitectura debe permitir agregar posteriormente notificaciones, logros recientes y recompensas sin reconstruir el menú.
Notificaciones
El usuario autenticado tendrá un botón independiente de notificaciones.
Inicialmente puede mostrar el estado visual.
Más adelante deberá conectar con:
Logros
Recompensas
Cambios de temporada
Misiones
Avisos importantes
Control de sonido
Se puede reservar un control de sonido en el navbar para la experiencia gaming.
Debe permitir posteriormente sonidos de interfaz, efectos de juego, feedback de recompensas y sonidos de misiones.
Organización del navbar
El componente debe ser global y reutilizable:
app/components/layout/
├── Navbar.tsx
├── UserMenu.tsx
└── NotificationMenu.tsx
No debe haber una versión diferente del navbar para cada página.
Las páginas consumirán el mismo componente:
Landing
Dashboard
Perfil
Simulacros
Aprender
Retos
Comunidad
Configuración
Importante sobre la Landing
La landing no se convertirá en una copia del navbar de la aplicación.
Su función sigue siendo:
Presentación
↓
Características
↓
Cómo funciona
↓
Beneficios
↓
Planes
↓
CTA
El navbar de la aplicación será el sistema de navegación persistente una vez que el usuario entra a la plataforma.
Estado
Cambio 4 — Documentado.
La estructura del navbar global queda definida conceptualmente.
Siguiente implementación: adaptar el Navbar.tsx actual de la landing para convertirlo en el navbar global de la plataforma sin romper la landing.
Cambio 5 — Ajustes confirmados del Navbar y preparación del Perfil
Avatar del usuario en recarga
El avatar del navbar no debe mostrar una inicial genérica como E mientras se resuelve el perfil.
Requisito confirmado:
Recarga
↓
avatar del personaje equipado
La fuente de verdad continúa siendo:
Supabase
profiles.selected_character
        ↓
foto pixel-art del personaje
        ↓
avatar global
Para evitar el salto visual durante la carga, se podrá utilizar una pequeña caché local únicamente como optimización visual de hidratación, nunca como fuente de verdad de la cuenta.
La caché debe actualizarse con el valor confirmado por Supabase cada vez que se carga el perfil.
No se debe mostrar una letra genérica como fallback del avatar autenticado.
Estado de notificaciones
El botón de notificaciones permanecerá únicamente como elemento visual por ahora.
La conexión funcional se implementará posteriormente cuando estén desarrollados:
Retos
Niveles
Insignias
Recompensas
Misiones
Temporadas
No construir todavía la lógica de notificaciones.
Menú del avatar — versión actual
El menú simplificado confirmado por el usuario será:
[ Avatar + nombre ]
[ Racha + monedas ]
Perfil
Mi cuaderno
Cerrar sesión
Mis personajes, Insignias y Configuración pertenecen al sistema de perfil y no deben aparecer como accesos principales dentro del dropdown del avatar.
Navbar — composición visual confirmada
La composición desktop definitiva por ahora será:
[ Logo PeakScore + nombre ]
        Aprender ▼
        Progreso
        Retos
        Comunidad ▼
        Precios
        Bug
                              Tema
                              Notificaciones
                              Avatar
Reglas:
- Logo y nombre alineados a la izquierda.
- Navegación principal realmente centrada respecto a la ventana.
- Precios y Bug forman parte del bloque central.
- Tema, notificaciones y avatar quedan a la derecha.
- El tema funciona con un único botón:
  - sol = claro;
  - luna = oscuro.
- Sin iconos genéricos decorativos delante de los textos principales.
- Precios utiliza un tratamiento visual exclusivo de PeakScore y un brillo tipo reflejo.
Cambio 6 — Siguiente fase real del Perfil
Orden de implementación confirmado
El perfil se desarrollará en este orden para no romper la lógica existente:
1. Skeleton loading profesional
2. Tu Peak / personaje principal
3. Interacción expandida + historia
4. Mis personajes
5. Estadísticas
6. Aventura
7. Rangos y temporadas
8. Insignias
9. Misión del día
Primer objetivo
El siguiente trabajo del perfil será implementar el skeleton loading profesional, sustituyendo cualquier carga genérica por una estructura visual que anticipe el perfil final.
Después se implementará la sección Tu Peak, con el personaje equipado como protagonista.
El perfil continuará utilizando Supabase como fuente de verdad para:
usuario
personaje equipado
XP
nivel
monedas
racha
simulacros
promedio
personajes desbloqueados
insignias
Estado actual al cerrar esta conversación
Avatar al recargar
Se detectó visualmente que, al recargar la página, el navbar puede mostrar temporalmente una letra genérica (E) antes de que termine de resolverse el perfil en el cliente.
Esto no cumple con el objetivo visual de PeakScore.
Requisito pendiente de implementación:
Recarga de página
↓
perfil autenticado conocido
↓
profiles.selected_character
↓
foto del personaje equipado
↓
avatar visible desde el primer render posible
La solución debe evitar que el usuario vea una inicial genérica. Supabase seguirá siendo la fuente de verdad. Una caché local puede utilizarse únicamente como optimización de hidratación y nunca para reemplazar el dato persistente.
Notificaciones — estado actual
El botón de notificaciones queda únicamente como elemento visual.
No conectar todavía con backend ni crear el sistema de notificaciones hasta que existan los módulos de:
Niveles
Retos
Insignias
Recompensas
Misiones
Temporadas
Siguiente trabajo inmediato
Después de este punto se continuará con el Perfil de PeakScore.
La siguiente prioridad acordada es:
Skeleton loading profesional
        ↓
Tu Peak / personaje principal
        ↓
Interacción expandida + historia
        ↓
Mis Personajes
No rehacer el proyecto desde cero ni cambiar innecesariamente la estructura actual.
Cambio 7 — Rediseño completo del sistema de Rangos, Temporadas e Insignias
Objetivo
El sistema de rangos e insignias será rediseñado visualmente para que el perfil de PeakScore se sienta como un producto gaming educativo premium, manteniendo la lógica actual de Supabase y evitando una apariencia de tabla administrativa.
La referencia visual actual de la tarjeta Tu rango, la ventana Rangos PeakScore y la Biblioteca de insignias se reemplazará progresivamente por una experiencia de colección, progresión y descubrimiento propia de PeakScore.
1. Lógica definitiva de inicio de temporada
Existen dos estados diferentes:
Usuario nuevo
Cuando una cuenta nueva comienza su primera temporada competitiva:
Aprendiz
→ Explorador
→ Competidor
→ Avanzado
→ Élite
→ Maestro
→ Gran Maestro
→ Leyenda
→ Peak
Aprendiz es el primer rango real de una cuenta nueva.
Renacer no debe mostrarse como rango inicial de un usuario nuevo.
Usuario veterano después del reinicio de temporada
Cuando un usuario ya participó en una temporada y llega el reinicio mensual:
Temporada anterior
        ↓
  historial conservado
        ↓
Nuevo reinicio
        ↓
Renacer
        ↓
Explorador
        ↓
Competidor
        ↓
...
        ↓
Peak
Renacer representa el renacimiento competitivo de un usuario que ya tiene historial. No significa que la cuenta haya vuelto a ser nueva.
La interfaz deberá poder comunicar el historial anterior del usuario sin presentar nuevamente Aprendiz como si nunca hubiera progresado.
2. Rangos oficiales y assets
Los rangos oficiales quedan definidos como:
Renacer          0 – 499 XP
Aprendiz         500 – 1.499 XP
Explorador       1.500 – 2.999 XP
Competidor       3.000 – 4.999 XP
Avanzado         5.000 – 7.499 XP
Élite            7.500 – 9.999 XP
Maestro          10.000 – 14.999 XP
Gran Maestro     15.000 – 24.999 XP
Leyenda          25.000 – 34.999 XP
Peak             35.000+ XP
Nota: la cifra de Peak y el límite superior de Leyenda deberán mantenerse centralizados en una única configuración de gamificación para poder modificarlos posteriormente sin duplicar valores en la UI.
Assets gráficos propios ya generados:
renacer
aprendiz
explorador
competidor
avanzado
elite
maestro
gran-maestro
leyenda
peak
Se utilizarán como WebP optimizados dentro de:
public/images/ranks/
Los PNG/originales se conservarán fuera del proyecto como respaldo y fuente de futuras ediciones.
3. Nueva tarjeta Tu rango
La tarjeta actual será reemplazada por una tarjeta de progresión gaming.
Debe mostrar:
- Temporada actual.
- Rango actual.
- Emblema/asset propio del rango.
- XP actual.
- Progreso hacia el siguiente rango.
- Próximo rango con su propio emblema.
- XP restante para avanzar.
- Acceso Ver rangos.
- En usuarios veteranos, contexto del reinicio/historial cuando corresponda.
Dirección visual:
TEMPORADA 03                         VER RANGOS
                 TU RANGO
               [ EMBLEMA ]
                 RENACER
                 0 / 500 XP
          ███████░░░░░░░░
             PRÓXIMO RANGO
               APRENDIZ
            500 XP para avanzar
El emblema será el protagonista y tendrá glow/microanimación sutil. No utilizar una estrella gris/genérica como indicador de rango.
4. Nueva Biblioteca de Rangos
Ver rangos abrirá una galería visual, no una tabla.
Características:
- Ventana/modal grande y responsive.
- Título Rangos PeakScore.
- Indicador de temporada.
- Grid de emblemas propios.
- Cada rango tendrá imagen, nombre y XP.
- El rango actual estará destacado.
- Los rangos ya desbloqueados tendrán tratamiento luminoso y limpio.
- Los rangos bloqueados conservarán su asset real, pero con tratamiento desaturado/oscuro.
- Los rangos bloqueados tendrán un candado gaming propio de PeakScore, no un emoji ni un icono genérico.
- Debe existir una lectura clara del progreso de desbloqueo.
- No convertir la pantalla en un catálogo administrativo.
Composición orientativa:
[ RENACER ] [ APRENDIZ ] [ EXPLORADOR ] [ COMPETIDOR ]
[ AVANZADO ] [ ÉLITE ]    [ MAESTRO ]    [ GRAN MAESTRO ]
[ LEYENDA ]               [ PEAK ]
La distribución final deberá adaptarse al ancho disponible.
5. Estado bloqueado de rangos
No se generarán versiones diferentes de cada emblema solamente para bloquearlos.
El frontend deberá aplicar un tratamiento visual:
asset original
    ↓
desaturación
    ↓
oscuramiento
    ↓
overlay oscuro
    ↓
candado gaming
El candado será un asset reutilizable, por ejemplo:
/public/images/ui/rank-lock.webp
El resultado debe conservar suficiente silueta para que el usuario reconozca qué rango está intentando desbloquear.
6. Detalle de cada rango
Al hacer clic en cualquier rango se abrirá una vista/modal de detalle.
Debe mostrar:
- Emblema grande.
- Nombre del rango.
- Rango de XP.
- Estado: actual / desbloqueado / bloqueado.
- Descripción completa.
- Identidad del rango dentro de PeakScore.
- Requisito para alcanzarlo.
- Siguiente rango cuando exista.
- Progreso cuando sea relevante.
Composición:
┌───────────────────────────────────────────────┐
│                                               │
│       [ EMBLEMA GRANDE ]    EXPLORADOR        │
│                              1.500–2.999 XP   │
│                                               │
│                              Descripción      │
│                              del rango        │
│                                               │
│                              REQUISITO        │
│                              1.500 XP         │
│                                               │
│                              SIGUIENTE        │
│                              Competidor       │
└───────────────────────────────────────────────┘
7. Animación especial de Leyenda
La animación no será obligatoria en la galería principal.
Se utilizará principalmente en la vista de detalle.
Elementos posibles:
- Glow del emblema.
- Partículas pequeñas.
- Cristal/elemento central flotando.
- Pulsación de luz.
- Movimiento muy corto y elegante.
Debe sentirse premium sin saturar la pantalla.
8. Animación especial de Peak
Peak tendrá una experiencia especial dentro de su vista de detalle.
No se utilizará una sola imagen animada pesada como solución principal.
La composición deberá prepararse por capas reutilizables:
peak/
├── frame.webp
├── galaxy.webp
├── planets.webp
├── entity.webp
├── question.webp
├── orbit-rings.webp
├── particles.webp
└── glow.webp
La escena representa una entidad cósmica del conocimiento pequeña y claramente visible dentro de una tarjeta compacta.
Concepto:
- Ser cósmico sentado/levitando.
- Cerebro galáctico alrededor/de fondo de la cabeza.
- ? como símbolo de conocimiento/misterio.
- Galaxias y planetas alrededor.
- Fondo espacial.
- Sin montañas.
- Paleta principalmente azul/cian con pequeñas cantidades de violeta y dorado.
Animaciones previstas:
Entidad       → flotación vertical suave
?             → pulso de brillo
Galaxy        → movimiento/rotación muy lenta
Planetas      → órbitas suaves
Particles     → desplazamiento/pulso
Glow          → respiración de luz
Frame         → movimiento general mínimo
En hover se puede aumentar ligeramente:
- brillo;
- partículas;
- intensidad del aura;
- movimiento de la galaxia;
- brillo del ?.
La animación debe permanecer elegante y no distraer del contenido.
9. Fondos necesarios para el nuevo sistema
No se debe crear un fondo diferente y gigante para cada pantalla.
Se trabajará con assets reutilizables.
Fondo global de rangos
Necesitamos un fondo oscuro y sutil para la galería:
/public/images/ranks/ranks-bg.webp
Características:
- negro/azul muy oscuro;
- estrellas pixel-art muy discretas;
- nebulosa mínima;
- partículas suaves;
- suficiente contraste para las tarjetas;
- sin personaje ni elementos narrativos grandes.
Fondo de detalle de rango
Puede reutilizarse ranks-bg.webp con una capa de glow/gradiente según el rango.
No generar diez fondos independientes salvo que posteriormente aporten una función narrativa real.
Fondo especial de Peak
El fondo galáctico ya generado para Peak será tratado como asset independiente y se dividirá posteriormente si necesitamos animación por capas.
Fondo especial de Leyenda
Puede utilizar el fondo global de rangos con una capa adicional de partículas/glow. Si se necesita una composición exclusiva, se generará después, no antes de implementar el sistema base.
10. Assets UI adicionales necesarios
Además de los emblemas de rangos, necesitaremos:
rank-lock.webp
rank-current-glow.webp       (opcional)
rank-arrow.webp              (opcional)
rank-progress-fill.webp      (opcional)
ranks-bg.webp
No todos tienen que ser imágenes. Cuando un efecto pueda realizarse mejor con CSS/Framer Motion, se hará por código para evitar peso innecesario.
11. Insignias — rediseño de la Biblioteca
La Biblioteca de insignias seguirá el mismo lenguaje visual del sistema de rangos.
La pantalla actual basada en tarjetas administrativas será reemplazada progresivamente por una galería de colección gaming.
Debe incluir:
- Título Insignias.
- Progreso de colección.
- Filtros/categorías cuando existan categorías reales.
- Tarjetas de insignias.
- Estados desbloqueada/bloqueada.
- Progreso del requisito cuando corresponda.
- Requisito resumido.
- Tratamiento visual propio de PeakScore.
- Modal de detalle al hacer clic.
12. Insignias bloqueadas
La insignia bloqueada conservará su silueta y diseño, pero se mostrará mediante:
insignia original
      ↓
desaturación
      ↓
oscuramiento
      ↓
overlay
      ↓
candado/estado bloqueado propio
No utilizar candados genéricos como elemento protagonista.
13. Detalle de insignia
Al hacer clic en una insignia:
- Mostrar la insignia grande.
- Nombre.
- Rareza cuando exista.
- Descripción.
- Requisito.
- Progreso.
- Recompensa.
- Estado de desbloqueo.
- Fecha de obtención cuando exista.
Las insignias deben continuar dependiendo de datos reales de Supabase.
14. Fondos de insignias
Se priorizará un único fondo global reutilizable:
/public/images/badges/badges-bg.webp
Puede reutilizarse el lenguaje del fondo de rangos, con pequeñas diferencias visuales.
No crear un fondo completo por insignia.
15. Principio de assets
Para todo el rediseño del perfil:
Asset grande/estático
→ WebP optimizado
Animación compleja
→ capas separadas + CSS/Framer Motion
Efecto sencillo
→ CSS/Framer Motion
Elemento repetitivo
→ componente reutilizable
Los originales PNG se conservarán fuera de public como respaldo.
16. Orden de implementación del rediseño
1. Preparar assets WebP de los 10 rangos
2. Crear fondo global de Rangos
3. Crear candado gaming de Rangos
4. Rediseñar tarjeta Tu rango
5. Rediseñar Biblioteca de Rangos
6. Crear modal Detalle de Rango
7. Conectar estados desbloqueado/bloqueado
8. Preparar detalle dinámico de Leyenda
9. Preparar capas dinámicas de Peak
10. Rediseñar Biblioteca de Insignias
11. Crear modal Detalle de Insignia
12. Conectar progreso/requisitos reales
13. Revisar responsive y rendimiento
17. Regla de implementación
No reconstruir el proyecto ni reemplazar innecesariamente la estructura existente.
El rediseño debe realizarse modularmente sobre los componentes actuales.
La lógica de Supabase continuará siendo la fuente de verdad para:
usuario
temporada
rango
XP
nivel
personajes
insignias
progreso
recompensas
Primero se construirá la experiencia visual con datos controlados/fixtures si es necesario y posteriormente se conectará cada estado con Supabase.
Estado
Cambio 7 — Documentado.
Este cambio redefine oficialmente el sistema visual de Tu rango, Biblioteca de Rangos, detalle de Rangos, estados bloqueados, animaciones especiales de Leyenda/Peak y Biblioteca de Insignias.
El objetivo general pasa a ser el rediseño progresivo de todo el perfil de PeakScore, manteniendo la estructura y lógica existente y evitando reconstruir el proyecto desde cero.
# CAMBIO 8 — REDISEÑO INTEGRAL DEL PERFIL PEAKSCORE
## 8.1 Objetivo
El perfil de PeakScore debe sentirse como una experiencia de videojuego educativa premium, no como un perfil tradicional.
La identidad del usuario debe construirse alrededor de:
- Su personaje.
- Su progreso.
- Su rango.
- Su EXP.
- Sus insignias.
- Sus monedas Peak.
- Su racha.
- Sus simulacros.
- Sus estadísticas.
- Sus misiones.
- Su progreso dentro de la aventura.
No reconstruir el proyecto desde cero. Integrar estas funcionalidades sobre la arquitectura existente.
---
# 8.2 IDENTIDAD DEL USUARIO
El usuario debe tener una identidad visual permanente dentro de PeakScore.
La identidad estará compuesta por:
- Avatar del personaje seleccionado.
- Nombre del usuario.
- Rango actual.
- Nivel/progreso de EXP.
- Racha.
- Monedas Peak.
- Insignias destacadas.
El personaje seleccionado debe sincronizarse con Supabase mediante `profiles.selected_character`.
Cuando el usuario cambie de personaje:
1. Se actualiza el personaje equipado.
2. Se actualiza el avatar global.
3. Se actualiza el avatar del navbar.
4. Se actualiza el avatar del perfil.
5. Se actualiza la tarjeta correspondiente del personaje.
6. El cambio debe persistir después de cerrar sesión y volver a entrar.
No utilizar una inicial genérica como avatar definitivo.
---
# 8.3 NOMBRE DE LA SECCIÓN DEL PERSONAJE
No utilizar como nombre definitivo:
> Tu personaje
El nombre preferido para PeakScore será:
> Mi Peak
"Mi Peak" representa al personaje que acompaña al usuario dentro del universo PeakScore.
La sección debe permitir:
- Ver el personaje equipado.
- Ver personajes desbloqueados.
- Ver personajes bloqueados.
- Equipar otro personaje.
- Consultar información del personaje.
- Mostrar historia.
- Mostrar habilidad/pasiva cuando corresponda.
- Mostrar estado de desbloqueo.
El sistema debe estar preparado para agregar nuevos personajes en el futuro sin modificar la arquitectura principal.
---
# 8.4 PERSONAJES
PeakScore utilizará personajes pixel-art como parte central de la identidad del usuario.
Personajes iniciales:
- Peaky Nova.
- Peaky Nox.
- Zyra.
- Orby.
Los personajes deben manejar estados:
### Desbloqueado
El usuario puede:
- Verlo.
- Seleccionarlo.
- Equiparlo.
### Equipado
Debe existir una identificación visual clara de que el personaje está actualmente equipado.
### Bloqueado
Debe mostrar:
- Imagen desaturada o tratamiento visual de bloqueo.
- Candado.
- Información del requisito.
- Cantidad de monedas Peak necesarias cuando corresponda.
El desbloqueo debe utilizar una interfaz propia de PeakScore y no una alerta genérica del navegador.
---
# 8.5 MONEDA PEAK
La moneda interna de PeakScore será:
> Peak
Representación visual:
- Moneda circular.
- Letra "P" azul como elemento principal.
- Diseño pixel-art/premium.
- Debe poder utilizarse posteriormente para desbloquear personajes y otros elementos cosméticos.
La cantidad de monedas debe mostrarse en:
- Navbar.
- Perfil.
- Menús relacionados con personajes.
- Pantallas donde exista una compra/desbloqueo.
No implementar todavía una economía compleja si no es necesaria.
La arquitectura debe quedar preparada para futuras recompensas.
---
# 8.6 SISTEMA DE RANGOS
PeakScore tendrá un sistema de rangos basado en EXP.
Los rangos deben sentirse como una progresión real dentro del universo PeakScore.
Rangos:
| Rango | EXP |
|---|---:|
| Renacer | 0 – 499 |
| Aprendiz | 500 – 1.499 |
| Explorador | 1.500 – 2.999 |
| Competidor | 3.000 – 4.999 |
| Avanzado | 5.000 – 7.499 |
| Élite | 7.500 – 9.999 |
| Maestro | 10.000 – 14.999 |
| Gran Maestro | 15.000 – 24.999 |
| Leyenda | 25.000 – 34.999 |
| Peak | 35.000+ |
### Regla de inicio
Los usuarios nuevos comienzan como:
> Aprendiz
No comenzar como Renacer.
"Renacer" representa el estado especial posterior a un reinicio de temporada para usuarios veteranos que ya poseen historial.
---
# 8.7 EXP
La EXP representa el progreso global del usuario dentro de PeakScore.
Fuentes iniciales de EXP:
| Acción | EXP aproximada |
|---|---:|
| Completar lección | +20 EXP |
| Responder pregunta | +5 EXP |
| Responder correctamente | +10 EXP |
| Completar simulacro | +100 EXP |
| Completar misión | +50 a +100 EXP |
| Completar mundo | +250 EXP |
Estos valores pueden balancearse posteriormente.
La EXP debe estar controlada por el backend.
Nunca confiar exclusivamente en valores enviados desde el cliente.
El usuario no debe poder modificar manualmente su EXP desde el navegador.
---
# 8.8 PROGRESO DE RANGO
La tarjeta del rango debe mostrar:
- Rango actual.
- EXP actual.
- EXP necesaria para el siguiente rango.
- Barra de progreso.
- Rango siguiente.
- Progreso porcentual.
Ejemplo:
> Explorador  
> 2.350 / 3.000 EXP
La barra debe avanzar dinámicamente.
Cuando el usuario alcance un nuevo rango:
1. Se actualiza el rango.
2. Se muestra una animación de ascenso.
3. Se muestra una notificación.
4. Se registra el evento.
5. Se actualiza el perfil.
6. Se actualiza el navbar si corresponde.
---
# 8.9 TEMPORADAS
El sistema de rangos debe funcionar mediante temporadas.
Cada temporada puede tener:
- Fecha de inicio.
- Fecha de finalización.
- EXP de temporada.
- Rango de temporada.
- Historial de temporadas.
Al finalizar una temporada:
- Los usuarios veteranos pueden pasar a Renacer.
- El historial anterior no se elimina.
- Las estadísticas históricas permanecen.
- La nueva temporada comienza desde el estado correspondiente.
El sistema debe diferenciar entre:
- EXP histórica.
- EXP de temporada.
---
# 8.10 BIBLIOTECA DE RANGOS
La biblioteca de rangos debe ser visual, no una tabla administrativa.
Debe utilizar una galería de tarjetas.
Cada rango debe mostrar:
- Arte del rango.
- Nombre.
- EXP necesaria.
- Estado desbloqueado/bloqueado.
- Progreso del usuario.
Los rangos bloqueados deben utilizar:
- Desaturación.
- Overlay.
- Candado.
- Tratamiento visual propio de PeakScore.
La biblioteca debe sentirse como una colección de videojuego.
---
# 8.11 RANGOS ESPECIALES
Los rangos superiores deben tener mayor tratamiento visual.
Especialmente:
- Leyenda.
- Peak.
Estos rangos pueden utilizar:
- Animaciones.
- Glow.
- Partículas.
- Capas independientes.
- Efectos CSS.
- Framer Motion.
No convertir todo en una única imagen animada pesada.
La arquitectura debe favorecer:
> capas + CSS + Framer Motion
para mantener buen rendimiento.
---
# 8.12 INSIGNIAS
Las insignias deben funcionar como una colección de logros.
La sección debe mostrar:
- Insignias desbloqueadas.
- Insignias bloqueadas.
- Progreso.
- Requisitos.
- Recompensas.
- Rareza cuando corresponda.
La interfaz debe sentirse como una colección de videojuego.
Al seleccionar una insignia:
- Abrir detalle.
- Mostrar nombre.
- Mostrar descripción.
- Mostrar requisito.
- Mostrar progreso.
- Mostrar recompensa.
Las insignias deben quedar preparadas para agregar nuevos logros sin modificar la estructura principal.
---
# 8.13 MISIÓN DIARIA
El perfil tendrá una misión diaria.
Debe mostrar:
- Nombre de la misión.
- Descripción.
- Progreso.
- Recompensa.
- Estado completado/no completado.
Ejemplo:
> Completa 10 preguntas correctamente.
Recompensa:
- EXP.
- Monedas Peak.
- Posiblemente otros recursos en el futuro.
No generar misiones infinitamente desde el cliente.
La misión debe poder validarse desde backend.
---
# 8.14 ESTADÍSTICAS
El perfil debe mostrar estadísticas relevantes:
- Monedas Peak.
- Racha.
- Simulacros completados.
- Promedio ICFES.
- EXP.
- Rango.
- Progreso.
Las estadísticas deben ser visuales y fáciles de entender.
No sobrecargar la interfaz con números innecesarios.
---
# 8.15 SKELETON LOADING
El perfil debe utilizar skeleton loading profesional.
Mientras se cargan los datos:
- Skeleton del avatar.
- Skeleton del nombre.
- Skeleton del rango.
- Skeleton de estadísticas.
- Skeleton de personajes.
- Skeleton de insignias.
- Skeleton de misión.
No mostrar una pantalla vacía.
No utilizar spinners genéricos como solución principal.
El skeleton debe mantener la estructura final de la interfaz para evitar saltos visuales.
---
# 8.16 NAVBAR GLOBAL
El navbar debe ser global y reutilizable.
Debe aparecer de forma consistente en:
- Landing.
- Dashboard.
- Perfil.
- Simulacros.
- Aprender.
- Retos.
- Comunidad.
- Precios.
- Otras áreas de PeakScore.
Navbar autenticado:
### Izquierda
- Logo PeakScore.
### Centro
- Aprender ▼
- Progreso
- Retos
- Comunidad ▼
- Precios
- Bug
### Derecha
- Tema.
- Notificaciones.
- Avatar.
El avatar debe utilizar el personaje seleccionado por el usuario.
---
# 8.17 MENÚ DEL USUARIO
El menú del avatar tendrá inicialmente una estructura sencilla:
- Avatar.
- Nombre.
- Racha.
- Monedas Peak.
- Perfil.
- Mi cuaderno.
- Cerrar sesión.
Las notificaciones pueden permanecer inicialmente como elemento visual hasta implementar el sistema completo.
---
# 8.18 AVENTURA
La sección Aventura representará el progreso del usuario dentro del universo PeakScore.
Inicialmente puede funcionar como área visual/preparada para futuras funcionalidades.
La arquitectura debe permitir posteriormente:
- Mundos.
- Niveles.
- Progreso.
- Personajes.
- Biomas.
- Jefes.
- Cinemáticas.
- Recompensas.
Los mundos estarán relacionados con las áreas principales del ICFES.
---
# 8.19 BIOMAS Y PERSONAJES
Cada personaje podrá estar asociado posteriormente a un universo/bioma.
Los biomas deben poder representar visualmente diferentes mundos dentro de PeakScore.
No implementar todo el sistema de juego de una vez.
La arquitectura debe quedar preparada para crecer progresivamente.
---
# 8.20 PEAKY FUNDADOR
El personaje Fundador tendrá un tratamiento especial dentro de PeakScore.
Debe poder utilizarse posteriormente en:
- Introducciones.
- Cinemáticas.
- Diálogos.
- Explicaciones.
- Presentación de mundos.
- Momentos importantes del progreso.
El Fundador debe utilizar animaciones y diálogos propios de PeakScore.
No convertirlo simplemente en una imagen estática dentro de una tarjeta.
---
# 8.21 PRINCIPIOS DE IMPLEMENTACIÓN
No reconstruir PeakScore desde cero.
Mantener:
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Supabase.
- Arquitectura modular existente.
Priorizar:
- Componentes reutilizables.
- Buenas prácticas.
- Seguridad.
- Escalabilidad.
- Buen rendimiento.
- UX premium.
- Diseño consistente.
- Código mantenible.
Los datos importantes deben validarse en backend.
No confiar en:
- EXP enviada desde el cliente.
- Monedas enviadas desde el cliente.
- Rango enviado desde el cliente.
- Desbloqueos enviados desde el cliente.
---
# 8.22 REGLA DE ASSETS
No agregar nuevas rutas de imágenes al documento hasta que los assets hayan sido:
1. Subidos al proyecto.
2. Verificados físicamente.
3. Comprobada su ruta real.
4. Probado que cargan correctamente.
Primero se verifica el asset.
Después se registra su ruta.
No inventar rutas de imágenes.
Los assets estáticos deben priorizar WebP.
Las animaciones complejas deben utilizar:
- Capas.
- CSS.
- Framer Motion.
- Assets separados cuando sea necesario.
Evitar imágenes animadas pesadas cuando una composición por capas sea más eficiente.
---
# 8.23 ORDEN DE IMPLEMENTACIÓN
El desarrollo del nuevo perfil debe realizarse en este orden:
1. Skeleton loading.
2. Identidad del usuario.
3. Mi Peak.
4. Personajes desbloqueados/bloqueados.
5. Equipar personaje.
6. Avatar global.
7. Estadísticas.
8. Rango + EXP.
9. Biblioteca de rangos.
10. Insignias.
11. Misión diaria.
12. Aventura.
13. Biomas.
14. Cinemáticas y Fundador.
15. Animaciones especiales.
16. Optimización.
17. Seguridad.
18. Pruebas finales.
No implementar todo simultáneamente.
Cada sistema debe quedar funcional antes de comenzar el siguiente.
CAMBIO 9 — ESPECIFICACIÓN DEFINITIVA DE PEAKSCORE
EXP, RANGOS, TEMPORADAS, APRENDER, BATALLAS, BOSSES, SIMULACROS, MISIONES, INSIGNIAS Y PEAK COINS
IMPORTANTE: Esta sección pasa a ser la referencia vigente para los sistemas de progresión y gamificación de PeakScore. Cuando exista una contradicción con una sección anterior de este documento, prevalece esta especificación.

9.1 Objetivo general
PeakScore debe tener una progresión que combine:
EDUCACIÓN
+
VIDEOJUEGO
+
PROGRESIÓN
+
PREPARACIÓN ICFES
El usuario debe sentir que estudiar, practicar y mejorar realmente hace avanzar a su personaje.
La progresión debe ser:
- clara;
- motivadora;
- alcanzable humanamente;
- difícil de abusar;
- segura;
- validada por backend;
- escalable;
- independiente de la interfaz.
9.2 PRINCIPIOS DE LA ECONOMÍA DE PROGRESIÓN
PeakScore tendrá dos sistemas diferentes:
EXP
La EXP representa:
progreso
actividad
constancia
dominio
rango
Peak Coins
Las Peak Coins representan:
economía
colección
desbloqueos
personajes
cosméticos
recompensas
Nunca deben confundirse.
Ejemplo:
Completar una actividad
→ +EXP
→ posiblemente +Peak Coins
Una recompensa puede entregar ambos recursos, pero cada uno tendrá su propia lógica.
9.3 FUENTES OFICIALES DE EXP
Las únicas fuentes principales de EXP serán:
1. Aprender
2. Batallas / Bosses
3. Simulacros
4. Misiones
5. Rachas
6. Insignias
7. Completar mundos
No se añadirá una nueva fuente de EXP sin actualizar esta especificación.
9.4 APRENDER
Aprender será el sistema educativo principal de PeakScore.
Las materias principales serán:
Matemáticas
Lectura Crítica
Sociales
Ciencias Naturales
Inglés
La arquitectura deberá permitir agregar nuevas materias posteriormente.
9.5 NIVELES DE APRENDER
La estructura inicial propuesta es:
1 materia
→ 5 niveles
→ 5 páginas por nivel
Por materia:
5 niveles
×
5 páginas
=
25 páginas
Para las cinco materias iniciales:
5 materias
×
5 niveles
×
5 páginas
=
125 páginas
La arquitectura debe permitir agregar más niveles sin modificar el sistema central.
9.6 RECOMPENSA POR COMPLETAR UN NIVEL
Completar un nivel nuevo entrega:
+25 EXP
La recompensa es única.
Ejemplo:
Nivel no completado
↓
usuario completa nivel
↓
+25 EXP
↓
nivel queda registrado como completado
Si el usuario vuelve a estudiar el nivel:
nivel ya completado
↓
0 EXP
Esto evita farming infinito.
El usuario puede repetir contenido para practicar, pero no para generar EXP ilimitadamente.
9.7 BATALLAS
Las batallas serán una segunda forma de demostrar conocimiento.
La idea general:
Pregunta
↓
Respuesta
↓
Resultado
↓
Daño al enemigo
↓
Progreso de batalla
Respuesta correcta:
ataque exitoso
Respuesta incorrecta:
no se realiza el ataque
La batalla debe estar conectada con el contenido educativo.
9.8 BOSSES
Los Bosses representan desafíos de conocimiento.
Podrán existir:
Boss normal
Boss avanzado
Boss épico
Boss de mundo
Boss especial
Boss semanal
Los nombres, dificultad y contenido serán definidos por materia/mundo.
9.9 RECOMPENSAS INICIALES DE BOSSES
Valores iniciales para balance:
Boss normal
+20 EXP

Boss avanzado
+40 EXP

Boss épico
+75 EXP

Boss de mundo
+150 EXP
Estos valores son configurables.
No deben quedar escritos directamente en componentes visuales.
9.10 FARMING DE BOSSES
Un Boss no debe convertirse en una fuente infinita de EXP.
La primera victoria podrá entregar:
recompensa completa
Las repeticiones podrán entregar:
recompensa reducida
o:
0 EXP
dependiendo del tipo de Boss.
Repetir un Boss puede seguir siendo útil para:
- practicar;
- mejorar estadísticas;
- dominar el contenido;
- competir;
- conseguir recompensas específicas.
Pero no debe permitir farming infinito de EXP.
9.11 BOSS SEMANAL
PeakScore podrá incluir un:
BOSS SEMANAL
Será una actividad recurrente de temporada.
Puede incluir:
10–20 preguntas
y recompensas especiales:
EXP
Peak Coins
Insignias
Recompensas cosméticas
La recompensa deberá validarse en backend.
9.12 SIMULACROS SIMPLES
Los simulacros simples entregarán EXP según su tamaño.
Propuesta inicial:
5 preguntas
+3 EXP

10 preguntas
+6 EXP

20 preguntas
+12 EXP

50 preguntas
+30 EXP
La recompensa se entrega al completar correctamente el intento.
No se entrega EXP simplemente por abrir el simulacro.
9.13 SIMULACRO COMPLETO
El simulacro completo será una actividad de alta dedicación.
Recompensa base:
+150 EXP
El simulacro completo podrá estar compuesto por:
Sesión 1
+
Sesión 2
La recompensa se entrega una vez que el intento válido haya sido completado.
El backend deberá impedir:
reclamar dos veces el mismo intento
alterar el resultado desde el cliente
fabricar un intento terminado
duplicar recompensas
9.14 RESULTADO DE SIMULACRO
El resultado académico y la EXP son conceptos diferentes.
El porcentaje ICFES sirve para:
medir desempeño académico
La EXP sirve para:
medir progresión dentro de PeakScore
Por lo tanto:
90% en un simulacro
≠
90 EXP
La EXP base del simulacro es independiente del porcentaje.
Posteriormente podrá existir un pequeño bonus por desempeño, siempre que el balance lo justifique.
9.15 MISIONES
Las misiones serán actividades concretas.
Podrán ser:
mini-lecciones
preguntas
prácticas
simulacros
retos
actividades especiales
Las misiones tendrán:
id
nombre
descripción
objetivo
progreso
recompensa
estado
fecha
9.16 MISIONES DIARIAS
Cada usuario podrá recibir una misión diaria.
Ejemplos:
Completa una mini-lección
+2 EXP

Responde correctamente una cantidad determinada de preguntas
recompensa configurable

Completa una actividad de Aprender
recompensa configurable
Las misiones no deben generar EXP infinitamente.
La misión diaria tendrá:
disponible
→ en progreso
→ completada
Una vez completada:
reclamo válido
↓
recompensa
↓
estado completado
9.17 RACHAS
La racha representa constancia.
No se entrega EXP solamente por abrir PeakScore.
La actividad válida será la que mantenga la racha.
Hitos iniciales:
3 días
+6 EXP

6 días
+12 EXP

12 días
+25 EXP

20 días
+40 EXP

30 días
+75 EXP

60 días
+150 EXP

100 días
+300 EXP
Cada hito debe poder reclamarse una sola vez por ciclo correspondiente.
Los valores pueden ajustarse después de probar la economía.
9.18 INSIGNIAS
Las insignias son logros permanentes.
Cada insignia tendrá:
id
nombre
descripción
rareza
requisito
progreso
recompensa
estado
fecha de obtención
Una insignia solo puede entregar su recompensa una vez.
9.19 RECOMPENSA DE INSIGNIAS
Propuesta inicial:
Fácil
+10 EXP

Media
+25 EXP

Difícil
+50 EXP

Épica
+100 EXP

Legendaria
+250 EXP
Las insignias también podrán entregar:
Peak Coins
personajes
cosméticos
marcos
títulos
según el tipo de logro.
9.20 COMPLETAR UN MUNDO
Cuando un usuario complete todos los niveles disponibles de un mundo:
Mundo completado
↓
+100 EXP
↓
Peak Coins
↓
posible insignia
La recompensa exacta será configurable.
9.21 TEMPORADAS
La duración oficial de una temporada será:
60 días
Es decir:
1 temporada = 2 meses
La temporada tendrá:
id
nombre
fecha de inicio
fecha de finalización
estado
La EXP utilizada para determinar el rango competitivo será:
EXP de temporada
9.22 EXP HISTÓRICA Y EXP DE TEMPORADA
PeakScore debe separar:
EXP histórica
de:
EXP de temporada
Ejemplo:
EXP histórica:
47.820

EXP temporada:
2.148

Rango actual:
Maestro
Al terminar la temporada:
EXP histórica
→ se conserva

EXP temporada
→ se reinicia
9.23 RANGOS OFICIALES
La progresión competitiva será:
Aprendiz
↓
Explorador
↓
Competidor
↓
Avanzado
↓
Élite
↓
Maestro
↓
Gran Maestro
↓
Leyenda
↓
Peak
Renacer es un estado especial de reinicio para usuarios veteranos.
9.24 CUENTA NUEVA
Una cuenta nueva comienza en:
APRENDIZ
No comienza en:
RENACER
Renacer no representa a un usuario nuevo.
9.25 USUARIO VETERANO
Cuando un usuario ya participó en una temporada y comienza una nueva:
Fin de temporada
↓
Historial conservado
↓
Nueva temporada
↓
Renacer
Después podrá progresar:
Renacer
↓
Explorador
↓
Competidor
↓
Avanzado
↓
Élite
↓
Maestro
↓
Gran Maestro
↓
Leyenda
↓
Peak
Aprendiz no vuelve a aparecer para un usuario veterano.
9.26 BALANCE DE RANGOS
Los requisitos de rango NO se deben considerar definitivos hasta realizar una simulación completa de 60 días.
Propuesta inicial de trabajo:
Renacer
0 EXP

Aprendiz
0+ EXP para cuenta nueva

Explorador
300 EXP

Competidor
650 EXP

Avanzado
1.100 EXP

Élite
1.600 EXP

Maestro
2.150 EXP

Gran Maestro
2.700 EXP

Leyenda
3.300 EXP

Peak
4.000+ EXP
Importante
Estos números son objetivos de balance de temporada, no valores que deban duplicarse directamente en la UI.
Deben vivir en una única configuración central.
9.27 SIMULACIÓN DE ALCANZABILIDAD
Antes de considerar los rangos definitivos se debe probar una temporada de 60 días con perfiles hipotéticos:
Usuario casual
Usuario regular
Usuario dedicado
Usuario hardcore
Se debe calcular:
EXP diaria
EXP semanal
EXP mensual
EXP total en 60 días
rango máximo alcanzado
Objetivo:
Casual
→ progreso visible

Regular
→ progreso fuerte

Dedicado
→ posibilidad real de Leyenda

Hardcore
→ posibilidad real de Peak
Peak debe ser difícil, pero humanamente alcanzable.
9.28 REGLA DE BALANCE
La EXP debe premiar:
constancia
+
aprendizaje
+
práctica
+
desempeño
No debe premiar:
repetición infinita
+
spam
+
abrir pantallas
+
farmear una sola actividad
La economía deberá evitar que una única actividad sea claramente superior a todas las demás.
9.29 SISTEMA DE NIVELES
El nivel del usuario y el rango competitivo son conceptos diferentes.
Nivel
Representa la progresión general del usuario.
Rango
Representa el desempeño competitivo de la temporada.
Por ejemplo:
Nivel 18
Rango Maestro
No deben mezclarse.
La arquitectura debe permitir que ambos sistemas evolucionen independientemente.
9.30 REGLA ANTI-FARMING GLOBAL
No deben entregar EXP infinitamente:
abrir la aplicación
abrir el perfil
abrir un menú
repetir una lección completada
reclamar dos veces una misión
reclamar dos veces una insignia
reclamar dos veces un simulacro
manipular el cliente
enviar una cantidad de EXP arbitraria
Toda recompensa deberá tener un identificador único o mecanismo equivalente de idempotencia.
9.31 VALIDACIÓN BACKEND
El cliente solicita una acción.
Ejemplo:
POST /api/gamification/reward
El servidor verifica:
usuario autenticado
↓
actividad válida
↓
actividad perteneciente al usuario
↓
actividad completada
↓
recompensa todavía no reclamada
↓
cantidad de EXP correcta
↓
cantidad de monedas correcta
Después:
actualizar EXP
actualizar monedas
actualizar progreso
registrar recompensa
Nunca aceptar:
{
  "xp": 5000
}
enviado directamente desde el cliente como fuente de verdad.
9.32 REGISTRO DE RECOMPENSAS
Se recomienda tener un registro persistente de recompensas.
Conceptualmente:
reward_events
Cada evento puede registrar:
id
user_id
type
source
source_id
xp_amount
coins_amount
created_at
Ejemplo:
user_id
123

type
LEVEL_COMPLETED

source_id
math-level-03

xp_amount
25

coins_amount
10
Esto permitirá evitar duplicaciones.
9.33 ARQUITECTURA CENTRAL DE GAMIFICACIÓN
La lógica deberá centralizarse.
Ejemplo conceptual:
lib/
└── gamification/
    ├── ranks.ts
    ├── xp.ts
    ├── rewards.ts
    ├── seasons.ts
    └── constants.ts
La estructura exacta puede adaptarse a la arquitectura existente.
Objetivo:
Perfil
Aprender
Batallas
Simulacros
Misiones
Insignias
Dashboard
deben utilizar las mismas reglas.
9.34 PERFIL — INFORMACIÓN DEFINITIVA
El perfil debe poder mostrar:
Avatar
Nombre
Mi Peak
Rango
EXP
Nivel
Racha
Peak Coins

Mejor rango
Mejor temporada
Temporadas completadas

Simulacros
Promedio ICFES

Progreso de Aprender
Aventura

Personajes
Insignias
Misiones
No todo debe aparecer simultáneamente.
La prioridad visual será:
Identidad
↓
Mi Peak
↓
Rango / EXP
↓
Estadísticas
↓
Aventura
↓
Mis Personajes
↓
Insignias
↓
Misión
9.35 MI PEAK
La sección principal del personaje se llamará:
MI PEAK
Debe mostrar:
personaje equipado
nombre
rareza/tipo
historia
habilidad
estado
El personaje debe ser el protagonista visual.
9.36 PERSONAJES INICIALES
Personajes iniciales:
Peaky Nova
Peaky Nox
Zyra
Orby
Cada uno deberá tener:
id
name
description
story
ability
rarity
profile_image
card_image
price
Los assets solo se incorporarán al código cuando hayan sido realmente creados y verificados.
No inventar rutas de imágenes.
9.37 EQUIPAR PERSONAJE
Flujo:
Usuario selecciona personaje
↓
backend valida que está desbloqueado
↓
profiles.selected_character se actualiza
↓
perfil actualiza personaje
↓
navbar actualiza avatar
↓
resto de la plataforma refleja el cambio
Supabase sigue siendo la fuente de verdad.
9.38 PEAK COINS
La moneda se llamará:
Peak Coins
Representación:
moneda circular
+
P azul
+
pixel-art premium
Podrán utilizarse para:
desbloquear personajes
cosméticos
elementos de colección
recompensas futuras
La economía monetaria deberá balancearse separadamente de la EXP.
9.39 BIBLIOTECA DE RANGOS
La biblioteca será una galería gaming.
Debe mostrar:
Renacer
Aprendiz
Explorador
Competidor
Avanzado
Élite
Maestro
Gran Maestro
Leyenda
Peak
Cada tarjeta:
asset
nombre
requisito
estado
Los bloqueados:
desaturación
+
oscurecimiento
+
overlay
+
candado propio
No utilizar emojis como sustituto de los assets definitivos.
9.40 DETALLE DE RANGO
Al seleccionar un rango:
Emblema grande
Nombre
EXP
Descripción
Estado
Requisito
Siguiente rango
Progreso
El usuario debe entender:
qué es
cómo se consigue
qué tan cerca está
qué viene después
9.41 LEYENDA
Leyenda tendrá un tratamiento visual superior.
Podrá utilizar:
glow
partículas
microanimaciones
capas
Framer Motion
No debe convertirse en una animación pesada.
9.42 PEAK
Peak será el rango máximo.
Su detalle tendrá una composición especial.
Concepto:
entidad cósmica
+
conocimiento
+
galaxias
+
planetas
+
?
Paleta:
azul
cian
violeta
pequeños acentos dorados
No usar montañas.
9.43 CAPAS DE PEAK
Cuando se implementen assets animables, la composición podrá dividirse en:
peak/
├── frame.webp
├── galaxy.webp
├── planets.webp
├── entity.webp
├── question.webp
├── orbit-rings.webp
├── particles.webp
└── glow.webp
La animación será mediante:
CSS
+
Framer Motion
cuando sea suficiente.
9.44 INSIGNIAS
La biblioteca de insignias será una colección.
Debe mostrar:
progreso de colección
insignias desbloqueadas
insignias bloqueadas
requisitos
progreso
recompensas
rareza
Las insignias deberán depender de Supabase.
9.45 AVENTURA
La sección:
AVENTURA
representará el progreso narrativo/educativo de PeakScore.
La arquitectura debe permitir:
mundos
niveles
biomas
Bosses
personajes
cinemáticas
recompensas
No implementar todo simultáneamente.
Se desarrollará por fases.
9.46 MUNDOS
Los mundos estarán relacionados con las materias principales:
Matemáticas
Lectura Crítica
Sociales
Ciencias Naturales
Inglés
Cada mundo tendrá posteriormente:
bioma
niveles
personajes
Bosses
narrativa
recompensas
9.47 PEAKY FUNDADOR
Peaky Fundador tendrá una función narrativa especial.
Podrá utilizarse para:
introducciones
diálogos
explicaciones
cinemáticas
presentación de mundos
momentos importantes
No debe convertirse únicamente en una imagen decorativa.
9.48 ASSETS
Regla global:
Asset estático grande
→ WebP optimizado

Animación compleja
→ capas separadas

Efecto simple
→ CSS / Framer Motion

Elemento repetido
→ componente reutilizable
Los assets originales se conservarán como respaldo fuera del bundle de producción cuando corresponda.
No agregar rutas ficticias.
9.49 NAVBAR
El navbar seguirá siendo global.
Debe mantener:
Logo
Aprender
Progreso
Retos
Comunidad
Precios
Bug
Tema
Notificaciones
Avatar
El avatar utiliza:
profiles.selected_character
El menú del avatar:
Avatar
Nombre
Racha
Peak Coins

Perfil
Mi cuaderno

Cerrar sesión
Las notificaciones permanecerán visuales hasta implementar el sistema real.
9.50 SKELETON
El perfil tendrá skeleton loading profesional.
Debe representar:
navbar
identidad
Mi Peak
rango
estadísticas
aventura
personajes
insignias
misión
No mostrar:
Cargando PeakScore...
como pantalla principal de carga.
9.51 RESPONSIVE
Todo el rediseño debe funcionar en:
Desktop
Laptop
Tablet
Móvil
La versión móvil no será simplemente una versión desktop comprimida.
Los componentes deberán reorganizarse según el ancho disponible.
9.52 RENDIMIENTO
No cargar assets pesados innecesariamente.
Priorizar:
WebP
lazy loading
componentes reutilizables
animaciones ligeras
CSS
Framer Motion
Las animaciones complejas solo se activarán cuando aporten valor real.
9.53 SEGURIDAD
Toda acción que afecte:
EXP
Peak Coins
rango
recompensas
personajes
insignias
progreso
debe ser validada en backend.
El usuario no debe poder alterar estos valores manipulando:
DevTools
requests
body JSON
localStorage
cookies
frontend state
La seguridad real dependerá de:
Supabase Auth
RLS
validación server-side
validación de ownership
idempotencia
9.54 REGLA DE FUENTE DE VERDAD
Supabase será la fuente de verdad para:
usuario
personaje equipado
personajes desbloqueados
EXP
nivel
rango
temporada
Peak Coins
racha
insignias
progreso
recompensas
El frontend únicamente representa esos datos.
9.55 ORDEN DEFINITIVO DE DESARROLLO
El desarrollo completo se realizará en este orden:
FASE 1
Sistema central de gamificación

FASE 2
Configuración de EXP y rangos

FASE 3
Temporadas

FASE 4
Perfil / skeleton

FASE 5
Mi Peak

FASE 6
Mis Personajes

FASE 7
Estadísticas

FASE 8
Tu Rango

FASE 9
Biblioteca de Rangos

FASE 10
Insignias

FASE 11
Misiones

FASE 12
Aprender

FASE 13
Niveles

FASE 14
Batallas

FASE 15
Bosses

FASE 16
Simulacros + recompensas

FASE 17
Aventura / Mundos

FASE 18
Peak Coins

FASE 19
Recompensas

FASE 20
Seguridad / anti-farming

FASE 21
Responsive

FASE 22
Rendimiento

FASE 23
Pruebas completas
9.56 REGLA DE DESARROLLO
No avanzar a una fase compleja si la anterior no tiene una base funcional estable.
Cada sistema deberá tener:
UI
+
lógica
+
backend
+
persistencia
+
validación
cuando corresponda.
9.57 PRUEBAS DE ECONOMÍA
Antes de fijar definitivamente los rangos se ejecutarán simulaciones de:
60 días
con:
Usuario casual
Usuario regular
Usuario dedicado
Usuario hardcore
Se analizará:
EXP diaria
EXP semanal
EXP total
rango alcanzado
cantidad de actividades necesarias
posibilidad de farming
Los requisitos se modificarán si los resultados muestran que:
Peak es imposible
o:
Peak es demasiado fácil
o:
un solo método domina la economía
9.58 OBJETIVO FINAL DE PROGRESIÓN
El usuario debe sentir:
Hoy aprendí algo
↓
gané progreso
↓
mi Peak avanzó
↓
mi rango aumentó
↓
desbloqueé algo
↓
quiero volver mañana
La progresión debe reforzar el aprendizaje real y no reemplazarlo.
9.59 ESTADO OFICIAL
A partir de este Cambio 9:
EXP
Rangos
Temporadas
Aprender
Batallas
Bosses
Simulacros
Misiones
Rachas
Insignias
Peak Coins
Aventura
Mi Peak
quedan definidos como sistemas relacionados pero independientes.
La economía de EXP todavía requiere una simulación matemática de 60 días antes de congelar definitivamente los requisitos de cada rango.
9.60 SIGUIENTE PASO DE IMPLEMENTACIÓN
Una vez guardado este documento en el proyecto:
1. Revisar estructura actual de app/perfil/page.tsx
2. Extraer configuración de gamificación
3. Crear sistema central de rangos
4. Crear sistema central de EXP
5. Crear skeleton definitivo
6. Rediseñar Mi Peak
7. Rediseñar Tu Rango
8. Rediseñar Mis Personajes
9. Conectar progresivamente con Supabase
No reconstruir PeakScore.
Trabajar sobre la arquitectura existente.
ESTADO FINAL DEL PLAN
NAVBAR
✓ definido

SKELETON
✓ definido

MI PEAK
✓ definido

PERSONAJES
✓ definido

PEAK COINS
✓ definido

EXP
✓ definido conceptualmente

RANGOS
✓ definidos conceptualmente

TEMPORADAS
✓ definidas: 60 días

APRENDER
✓ definido conceptualmente

BATALLAS
✓ definido conceptualmente

BOSSES
✓ definido conceptualmente

SIMULACROS
✓ definido conceptualmente

MISIONES
✓ definido conceptualmente

RACHAS
✓ definido conceptualmente

INSIGNIAS
✓ definido conceptualmente

AVENTURA
✓ definida conceptualmente

MUNDOS
✓ definidos conceptualmente

PEAKY FUNDADOR
✓ definido conceptualmente

SEGURIDAD
✓ definida conceptualmente

BALANCE DE EXP
⏳ pendiente de simulación de 60 días

IMPLEMENTACIÓN
⏳ siguiente fase
Regla principal de PeakScore
No queremos construir solamente un perfil bonito. Queremos construir un sistema de progresión educativo completo donde cada parte de PeakScore tenga un propósito y esté conectada con el progreso real del estudiante.