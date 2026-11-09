# Auditoría de variables de voz — 2026-11-09

**Proyecto Vercel:** `peak-score`  
**Rama de preview:** `feat/founder-intro`  
**Alcance:** inventario de nombres, destinos y presencia de variables. No se leyeron valores secretos.

## Hallazgos

- `CLOUDFLARE_ACCOUNT_ID`: existe únicamente para Preview y está asociado a `feat/founder-intro`.
- `CLOUDFLARE_API_TOKEN`: existe únicamente para Preview y está asociado a `feat/founder-intro`.
- `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED`: no aparece en el inventario de variables.
- `GEMINI_API_KEY`: existe únicamente para Preview y está asociado a `feat/founder-intro`.
- `ORBY_GEMINI_LIVE_ENABLED=true`: existe únicamente para Preview y está asociado a `feat/founder-intro`.
- `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED`: no aparece en el inventario.
- `PEAKSCORE_GEMINI_DATA_USE_APPROVED`: no aparece en el inventario.
- No se detectaron variables de Cloudflare/Gemini para Production en el inventario consultado.

## Consecuencia

1. El aviso Cloudflare de la interfaz es coherente con el servidor: falta la declaración de confirmación del Free Tier. Aunque existen cuenta y token en Preview, el guard de `provider-free-tier.ts` devuelve false sin la variable.
2. Gemini Live tiene la llave y el switch de habilitación en Preview, pero el endpoint sigue bloqueado por dos condiciones separadas: confirmación de Free Tier y aprobación explícita de tratamiento de datos.
3. No se deben añadir automáticamente esas tres declaraciones: una requiere verificación real de la cuenta/modelos Cloudflare y dos son confirmación de plan/consentimiento de datos Google.
4. No se deben copiar secretos a Production ni crear variables allí para “quitar el aviso”. El objetivo inmediato es una prueba controlada en Preview.

## Acción segura pendiente

- Responsable: comprobar en Cloudflare Dashboard que la cuenta sigue en Workers Free, que el modelo concreto usado está disponible en Free y que la cuota diaria de 10.000 Neurons aplica a esa ruta. Solo después, crear `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED=true` para Preview / `feat/founder-intro`.
- Responsable: decidir expresamente si autoriza enviar audio y texto de las sesiones a Google Gemini API bajo las condiciones de datos del Free Tier. Solo con esa aprobación, confirmar `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true` y `PEAKSCORE_GEMINI_DATA_USE_APPROVED=true` para Preview.
- Mantener `ORBY_GEMINI_LIVE_ENABLED=true` restringido a Preview mientras se hace QA; no habilitar producción en esta iteración.
- Tras actualizar variables, generar un nuevo Preview y probar apertura de llamada, audio bidireccional, barge-in, pausa, reconexión y cierre.

**No se leyeron ni se modificaron valores secretos. No se cambió Production, no se creó un deployment y no se hizo bypass de los guards.**
