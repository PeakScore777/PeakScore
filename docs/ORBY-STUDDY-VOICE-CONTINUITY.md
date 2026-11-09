# Continuidad: réplica de aula Studdy y voz gratuita

Fecha: 2026-11-09
Rama: `feat/founder-intro`

## Cambios realizados

- Se rehízo la presentación de `components/aprender/OmegaXFreeVoiceTurn.tsx` como aula de pizarra blanca a pantalla completa: título manuscrito sobre resaltado amarillo, contenido sobre el papel, subtítulos centrados en el borde inferior y controles discretos en las esquinas.
- Se quitaron las tarjetas de conversación, la columna lateral «Cómo funciona», los paneles con bordes y las líneas divisorias del aula de voz gratuita.
- Los subtítulos mantienen visible la respuesta del tutor después de terminar la locución; antes podían desaparecer y ser sustituidos por un aviso genérico.
- La identidad del tutor ahora se pasa desde `LessonAITutor`: Orby para el tutor ICFES y OmegaX para English Studio. La identidad también se envía a la ruta de voz y se usa en el prompt.
- La ruta `/api/orby/cloudflare-voice-turn` ahora informa cuál variable de entorno falta, sin exponer credenciales.

## Flujo real de voz gratuita

`LessonAITutor` monta `OmegaXFreeVoiceTurn` cuando `workspaceMode === "voice"` y `cloudflareVoiceMode` está activo. El preflight y los turnos usan `/api/orby/cloudflare-voice-turn`.

La implementación usa:
- Cloudflare Workers AI Whisper para transcribir audio.
- Cloudflare Workers AI Gemma para generar la respuesta.
- Síntesis de voz del navegador (`speechSynthesis`) para leer la respuesta; no se llama a una API de TTS facturable.
- Límite de uso y presupuesto diario; si la cuota gratuita se agota, se detiene sin fallback de pago.

## Bloqueo que requiere configuración externa

El error HTTP 503 observado en `/api/orby/cloudflare-voice-turn` es un preflight que falla antes de pedir permiso al micrófono. El código exige estas variables en el entorno local y en Vercel:

1. `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED=true`, solo después de verificar manualmente que la cuenta está en Workers Free.
2. `CLOUDFLARE_ACCOUNT_ID`, ID de cuenta de 32 caracteres.
3. `CLOUDFLARE_API_TOKEN`, token de API con los permisos de Workers AI necesarios.

No se deben inventar credenciales ni activar la confirmación sin verificar el plan. La modificación de código no puede crear ni recuperar esos secretos. Tras configurar las variables, reiniciar `npm run dev` y volver a probar el GET y POST de `/api/orby/cloudflare-voice-turn`.

## Pendiente de validación

- Ejecutar lint, TypeScript y build en el entorno local.
- Verificar el flujo de voz en Chrome: permiso de micrófono, grabación, transcripción, respuesta, subtítulos persistentes, interrupción de voz y guardado del historial.
- Probar con cuenta Workers Free real y confirmar que no se genera consumo facturable.
- Comparar el resultado visual en escritorio y móvil con las referencias Studdy proporcionadas.

No se afirma que la voz esté habilitada: falta la configuración externa indicada y aún no se ha ejecutado una prueba end-to-end.


## Auditoría de regresiones de `npm run test:orby` — 2026-11-09

Se corrigieron incompatibilidades introducidas por el rediseño y el cambio de proveedor de voz:

- La ruta `cloudflare-voice-turn` vuelve a aplicar el gate compartido `isCloudflareWorkersAIConfigured()`; antes solo se inspeccionaban variables manualmente y se había omitido la validación central que exige la suite y el proveedor.
- El gate ahora informa de forma diferenciada si falta la confirmación Workers Free, el ID de cuenta o el token, y conserva una comprobación final con el gate compartido.
- La prueba de prompt dejó de buscar una frase fija del prompt antiguo dentro de `cloudflare-workers-ai.ts`; ahora comprueba el prompt real que arma la ruta Cloudflare Voice y que admite Orby/OmegaX.
- La prueba de preflight dejó de esperar etiquetas antiguas ("Comprobando acceso"/"Voz no disponible") y comprueba los estados reales de la interfaz nueva ("Conectando voz"/"Voz sin conexión"/"Voz disponible").
- Se corrigió el punto y coma faltante tras `MAX_AUDIO_SECONDS`.

## Estado de verificación

Los cambios están guardados en `feat/founder-intro`. No se ha podido ejecutar `npm run test:orby` en el entorno conectado a GitHub. El check de Vercel sigue mostrando `build-rate-limit`, que es un límite de compilaciones de Vercel y no un resultado de la suite Node. Por tanto, no se declara la suite verde hasta ejecutarla localmente.
