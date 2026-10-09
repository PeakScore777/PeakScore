# PeakScore — Proyecto Órbita
**Fecha de creación:** 9 de octubre de 2026  
**Tipo de documento:** Hoja de ruta de cambios y pendientes

## Objetivo general
Reorganizar la experiencia de PeakScore alrededor del navbar global, rehacer el perfil y desarrollar los sistemas de personajes e insignias. Después, conectar progresivamente los módulos con Supabase y los servicios externos necesarios.

## 1. Perfil, personajes e insignias
- [ ] Rehacer **Mi perfil**.
- [ ] Diseñar e implementar el sistema de **personajes** del perfil.
- [ ] Crear el sistema de **insignias**.
- [ ] Cambiar el emoji de moneda del perfil por la imagen oficial `peakcoin.webp`.
- [ ] Guardar la moneda en `public/images/currency/peakcoin.webp`.
- [ ] Preparar animaciones de compra y desbloqueo de personajes, rangos e insignias.
- [ ] Comprobar que los efectos y las animaciones se puedan probar durante el desarrollo.

## 2. Navbar global y navegación
- [ ] Modificar el **navbar global** para que sea el principal medio de navegación.
- [ ] Eliminar el dashboard tradicional como centro principal de navegación.
- [ ] Hacer que el control de tema claro/oscuro del navbar cambie el tema de toda la plataforma.
- [ ] Revisar el acceso al menú de usuario y sus opciones.

### Secciones del navbar

**Aprender**
- [ ] Conectar los simulacros.
- [ ] Permitir generar simulacros en modo **Simple** y **Completo**.
- [ ] Desarrollar los niveles que aún faltan.

**Progreso**
- [ ] Trasladar aquí las estadísticas del dashboard.
- [ ] Mostrar cuántos simulacros completos ha realizado el usuario.
- [ ] Mostrar su meta y avance.
- [ ] Incorporar las demás estadísticas de progreso que ya existían en el dashboard.

**Retos**
- [ ] Ubicar aquí las misiones y los retos diarios.

**Comunidad**
- [ ] Crear un sistema de ranking.
- [ ] Diseñar la comunidad de PeakScore.
- [ ] Evaluar la conexión con la API de WhatsApp y el canal de WhatsApp de PeakScore.
- [ ] Comparar alternativas antes de decidir la integración definitiva.

**Precios**
- [ ] Definir y publicar los planes **Normal** y **Premium**.
- [ ] Decidir el precio de cada plan más adelante.

**Bug**
- [ ] Configurar Resend para enviar los reportes de errores al correo del administrador.
- [ ] Mostrar también los reportes en el panel de administración.
- [ ] Comprar/configurar el dominio necesario para completar esta integración.
- [ ] Mientras falte el dominio, dejar esta sección pendiente tal como está.

## 3. Panel de administración
Al abrir el menú del perfil de usuario, debajo de **Ver perfil** y **Mi cuaderno**, debe aparecer una sección llamada **Panel admin**, visible únicamente para el administrador.

Herramientas del panel:
- [ ] **Generar preguntas**.
- [ ] **Ver banco de preguntas**.
- [ ] **Importar PDF**.
- [ ] **Solicitudes institucionales**.
- [ ] **Revisión de cuentas**: revisar datos de usuario y decidir si corresponde aplicar un bloqueo o baneo.
- [ ] **Gestión de economía y experiencia**: permitir al administrador asignar la cantidad de monedas y XP necesaria para pruebas.

### Permisos y pruebas del administrador
- [ ] Restringir las herramientas administrativas al rol de administrador; los usuarios normales no deben verlas ni utilizarlas.
- [ ] Crear un mecanismo seguro para que el administrador pueda otorgarse monedas y XP de prueba.
- [ ] Usarlo para probar compras y animaciones de desbloqueo de personajes, rangos e insignias sin completar todo el progreso manualmente.
- [ ] Al conectar Supabase, comprobar que los permisos y validaciones del servidor impidan que un usuario normal modifique sus monedas, XP o desbloqueos.

**Nota de implementación:** las asignaciones de monedas y XP para pruebas deben realizarse mediante una operación administrativa protegida en el servidor, no confiando únicamente en ocultar botones en la interfaz.

## 4. Notificaciones
- [ ] Hacer funcional el sistema de notificaciones.
- [ ] Posponer su integración completa hasta una fase posterior.

## 5. Orden de trabajo propuesto
1. [ ] Rehacer **Mi perfil**.
2. [ ] Crear el sistema de **personajes**.
3. [ ] Crear el sistema de **insignias**.
4. [ ] Incorporar la moneda `peakcoin.webp` en el perfil.
5. [ ] Ajustar el navbar global y la navegación principal.
6. [ ] Trasladar estadísticas y metas a **Progreso**.
7. [ ] Conectar simulacros y niveles en **Aprender**.
8. [ ] Construir misiones y retos diarios en **Retos**.
9. [ ] Diseñar ranking y comunidad.
10. [ ] Preparar el **Panel admin**, incluida la gestión de monedas y XP de prueba.
11. [ ] Configurar los reportes de errores con Resend cuando esté disponible el dominio.
12. [ ] Definir los planes Normal y Premium.
13. [ ] Conectar el sistema de notificaciones en una fase posterior.
14. [ ] Integrar y validar la lógica progresivamente con Supabase.

## 6. Criterios generales
- Mantener la identidad visual de PeakScore y la estética ya creada para sus personajes y rangos.
- Separar las herramientas administrativas de las funciones de usuario normal.
- Evitar que las pruebas de compra y desbloqueo dependan de ganar XP o monedas manualmente.
- No conectar toda la lógica a Supabase antes de preparar y probar los sistemas visuales y sus flujos principales.
- Verificar permisos, validaciones y comportamiento en móvil y escritorio al implementar cada módulo.

---
**Documento de seguimiento:** *Proyecto Órbita — Hoja de ruta de PeakScore*  
**Fecha:** 09/10/2026
