# Caso Cero — escena ambiental

## Arquitectura visual

La escena se compone de capas independientes:

- Fondo maestro del laboratorio: `public/images/backgrounds/caso-cero-laboratorio-nocturno.webp`.
- Vídeo de río: clip nocturno de Pexels 4192175, recortado al área de la ventana.
- Cristal mojado: gotas animadas por CSS sobre la capa de vídeo.
- Tendedero y evidencias: elementos React separados del fondo para que sean seleccionables.
- Audio ambiental: se integrará como pistas separadas y controladas por el ciclo de vida de Caso Cero; no debe reproducirse fuera del juego.

## Fondo maestro

El fondo se generó específicamente para PeakScore y se optimizó a WebP (1672 × 941, aproximadamente 178 KB). Debe guardarse en la ruta indicada arriba. La implementación visual ya referencia esa ruta, pero el archivo binario aún debe incorporarse al repositorio mediante una subida de archivo normal.

## Vídeo

- Fuente: [Pexels — Lights Reflection Over The River Water At Night](https://www.pexels.com/video/lights-reflection-over-the-river-water-at-night-4192175/)
- Archivo de reproducción: `https://videos.pexels.com/video-files/4192175/4192175-hd_1920_1080_25fps.mp4`
- Licencia: licencia de Pexels; revisar sus condiciones antes de cualquier redistribución del archivo independiente.
- Nota de rendimiento: el vídeo se reproduce en silencio, en bucle y en línea. Idealmente se debe optimizar y alojar localmente antes de producción; el componente mantiene una alternativa visual si el vídeo falla.

## Audio por seleccionar

Los siguientes resultados de Freesound son candidatos con licencia CC0, pendientes de escuchar, mezclar y validar en el juego:

- [08-24-rain-river — DanielHren](https://freesound.org/people/DanielHren/sounds/750220/): lluvia y río con trueno suave.
- [Rain_Hitting_Window_6 — SignatureSoundsOrg](https://freesound.org/people/SignatureSoundsOrg/sounds/869848/): lluvia contra una ventana.
- [dark ambient mood — solarpsychedelic](https://freesound.org/people/solarpsychedelic/sounds/847322/): ambiente musical de misterio.

No iniciar audio automáticamente: debe empezar por una interacción del usuario, incluir control de volumen/silencio y detenerse al salir del juego. Confirmar las condiciones de descarga y licencias de cada archivo antes de redistribuirlo.
