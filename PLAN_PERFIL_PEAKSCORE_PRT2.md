# PEAKSCORE — PLAN / NOTAS DE CONTINUIDAD PRT. 2

> Documento de continuidad. NO reemplaza `PLAN_PERFIL_PEAKSCORE_DEFINITIVO.md`.
> Guarda decisiones y requisitos nuevos para continuar sin desviarnos de la arquitectura ya definida.

## 1. REGLA PRINCIPAL

No reconstruir PeakScore desde cero. No cambiar innecesariamente la estructura. No crear sistemas duplicados. El definitivo sigue siendo la referencia principal; este documento añade continuidad y nuevas decisiones.

## 2. GAMIFICACIÓN YA IMPLEMENTADA

Archivos:
- `lib/gamification/ranks.ts`
- `lib/gamification/xp.ts`
- `lib/gamification/seasons.ts`
- `lib/gamification/constants.ts`

### Rangos oficiales
1. Renacer
2. Aprendiz
3. Explorador
4. Competidor
5. Avanzado
6. Élite
7. Maestro
8. Gran Maestro
9. Leyenda
10. Peak

Reglas:
- Cuenta nueva: `Aprendiz`.
- Después de participar en una temporada, el usuario veterano comienza la siguiente en `Renacer`.
- `Aprendiz` no reaparece para veteranos.
- El rango usa EXP de temporada.
- La EXP histórica permanece.
- La EXP de temporada se reinicia.

### EXP propuesta inicial
- Explorador: 300
- Competidor: 650
- Avanzado: 1100
- Élite: 1600
- Maestro: 2150
- Gran Maestro: 2700
- Leyenda: 3300
- Peak: 4000+

Estos valores siguen siendo provisionales hasta simular 60 días.

### Fuentes de EXP
- Learn: +25
- Batalla normal: +20
- Batalla avanzada: +40
- Batalla épica: +75
- Batalla/mundo: +150
- Simulacro 5: +3
- Simulacro 10: +6
- Simulacro 20: +12
- Simulacro 50: +30
- Simulacro completo: +150
- Mini-lección diaria: +2
- Racha 3/6/12/20/30/60/100 días: +6/+12/+25/+40/+75/+150/+300
- Insignias fácil/media/difícil/épica/legendaria: +10/+25/+50/+100/+250
- Finalización de mundo: +100

No dan EXP: abrir la app, abrir perfil, entrar al dashboard, duplicados o repetir contenido sin recompensa válida.

La EXP y las monedas deben concederse en servidor. El cliente nunca puede decidir cuánto recibe.

## 3. TEMPORADAS

Duración: **60 días**.

Tablas creadas:
- `seasons`
- `user_seasons`

Temporada 1 creada como `active`.

`user_seasons.season_xp` es la fuente de verdad para el rango actual.

Existe `profiles.season_xp`, creada durante el desarrollo. Es redundante y NO debe convertirse en una segunda fuente de verdad. No crear lógica nueva de rangos basada en ella.

RPC creado:
`public.ensure_current_user_season()`

El RPC:
- usa `auth.uid()`;
- obtiene la temporada activa;
- evita duplicados;
- crea `Aprendiz` para usuarios nuevos;
- crea `Renacer` para veteranos;
- usa `SECURITY DEFINER`.

## 4. SERVICIO DE TEMPORADA

Archivo:
`lib/gamification/season-service.ts`

Debe centralizar:
- temporada activa;
- participación;
- historial de participación;
- rango inicial;
- creación/aseguramiento de participación.

La UI no debe contener lógica de base de datos.

## 5. API DEL PERFIL

`app/api/profile/route.ts` debe devolver:
- EXP histórica;
- EXP de temporada;
- temporada actual;
- rango calculado por `ranks.ts`;
- progreso al siguiente rango;
- EXP restante;
- personaje seleccionado;
- personajes;
- insignias.

No volver a hardcodear rangos antiguos dentro del perfil.

## 6. ONBOARDING — NUEVO REQUISITO

Ya se ejecutó el SQL para agregar a `profiles`:

```sql
onboarding_version integer NOT NULL DEFAULT 0
onboarding_completed_at timestamptz
```

Objetivo: saber si el usuario ya vio el onboarding, qué versión vio y cuándo lo terminó.

El onboarding debe estar versionado. Primera versión: `1`.

### Flujo deseado

```text
REGISTRO
  ↓
INICIO DE SESIÓN
  ↓
PRIMER INGRESO
  ↓
CINEMÁTICA PEAKSCORE
  ↓
PEAKY NOVA
  ↓
FUNDADOR
  ↓
HISTORIA DE PEAKSCORE
  ↓
TUTORIAL INTERACTIVO
  ↓
DASHBOARD
```

Debe aparecer solo cuando corresponda, no en cada login.

## 7. PEAKY NOVA

Primera escena:
- presenta a Peaky Nova;
- explica que es el personaje principal;
- introduce el universo de PeakScore;
- crea sensación de comienzo de aventura.

La experiencia debe sentirse como videojuego educativo moderno, no como una landing genérica.

## 8. FUNDADOR

Después aparece el personaje del fundador.

Rol:
**guía/creador de PeakScore**.

Debe explicar progresivamente:
- qué es PeakScore;
- por qué existe;
- qué representa Peaky;
- cómo funciona el universo;
- qué puede hacer el estudiante;
- progreso;
- mundos;
- niveles;
- recompensas;
- simulacros;
- IA.

No meter toda la explicación en una pantalla.

## 9. ESTILO DE CINEMÁTICAS

Referencia de experiencia: videojuego/tutorial narrativo moderno.

Queremos:
- personaje visible;
- diálogos;
- zoom/cámara;
- expresiones;
- transiciones;
- animaciones;
- texto grande;
- audio;
- botones/interacciones.

GameCode sirve como referencia de experiencia, no para copiar assets o contenido.

Primera versión debe ser simple y funcional; luego se agregan animaciones y escenas más complejas.

## 10. AUDIO DEL FUNDADOR

Se quiere narración con voz del fundador.

Si se usa su propia voz:
- debe estar autorizada por su propietario;
- no usar voces de terceros sin autorización;
- revisar condiciones del proveedor.

Primera versión: audios pre-generados, no generar audio en cada visita.

No inventar rutas de audio hasta revisar los assets reales.

## 11. ARQUITECTURA PROPUESTA DEL ONBOARDING

Ruta:
`app/onboarding/page.tsx`

Componentes posibles:
```text
app/onboarding/
├── page.tsx
└── components/
    ├── OnboardingScene.tsx
    ├── PeakyIntroduction.tsx
    ├── FounderIntroduction.tsx
    ├── FounderTutorial.tsx
    └── OnboardingControls.tsx
```

No crear todo de golpe. Primero base funcional y después dividir cuando sea necesario.

## 12. SEGURIDAD DEL ONBOARDING

No confiar en un `user_id` enviado por el cliente.

Debe existir una API protegida para finalizar onboarding:
1. comprobar sesión;
2. identificar usuario con `auth.uid()`;
3. validar versión;
4. actualizar únicamente el perfil autenticado;
5. registrar `onboarding_completed_at`.

El cliente no debe poder marcar como completado el onboarding de otro usuario.

## 13. ASSETS

Antes de crear referencias:
- verificar `public/` y assets existentes;
- no inventar rutas;
- mantener WebP/formatos optimizados;
- usar capas cuando realmente hagan falta;
- CSS/Framer Motion para movimientos simples;
- componentes reutilizables.

## 14. PEAKY AI — NUEVO REQUISITO FUTURO

Se decidió incorporar **Peaky AI** dentro de Premium.

La idea:
- chat;
- conversación natural;
- audio/voz;
- explicaciones educativas;
- ayuda con ejercicios;
- adaptación al nivel del estudiante;
- tutoría por materia.

La experiencia puede ser muy conversacional, pero debe quedar claro que es una IA educativa; no debe hacerse pasar por una persona real.

### Materias
- Matemáticas
- Lectura Crítica
- Sociales
- Ciencias Naturales
- Inglés

### Peaky AI debe poder
- explicar conceptos;
- explicar preguntas ICFES;
- explicar por qué una respuesta es correcta/incorrecta;
- ayudar paso a paso;
- adaptar explicaciones;
- usar contexto de aprendizaje cuando corresponda.

## 15. VOZ DE PEAKY AI

Premium podrá incluir conversación por voz:

```text
Usuario habla
 ↓
Peaky AI recibe audio
 ↓
Interpreta
 ↓
Genera respuesta
 ↓
Responde con voz
```

La integración de API de voz se hará cuando lleguemos a la fase de IA. No adelantarla ahora.

## 16. SEGURIDAD Y PRIVACIDAD DE PEAKY AI

Nunca exponer claves de proveedores en el navegador.

No poner secretos en `NEXT_PUBLIC_*`.

El backend debe controlar:
- acceso Premium;
- límites;
- créditos;
- modelos;
- costes;
- permisos.

No guardar conversaciones innecesariamente.

Como PeakScore está dirigido a estudiantes, la privacidad y el diseño seguro son prioritarios.

## 17. ROLES NARRATIVOS

### Peaky
Personaje principal y símbolo de progreso.

### Peaky Nova
Manifestación/personaje utilizado en la introducción inicial.

### Fundador
Guía y creador que presenta el universo.

### Peaky AI
Tutor educativo artificial.

No confundir estos roles.

## 18. MUNDOS

El plan principal continúa definiendo cinco mundos:
1. Matemáticas
2. Lectura Crítica
3. Sociales
4. Ciencias Naturales
5. Inglés

Cada mundo tendrá progresivamente:
- bioma;
- niveles;
- personajes;
- obstáculos;
- bosses;
- cinemáticas;
- recompensas.

Esto pertenece a Aventura. No construir todo antes de terminar el núcleo actual.

## 19. ORDEN DE DESARROLLO — NO DESVIARNOS

### Ya iniciado
1. Gamificación central.
2. Rangos.
3. EXP.
4. Temporadas.
5. Base de datos de temporadas.
6. RPC seguro.

### Ahora
7. Integración del perfil.
8. Integración segura del onboarding.
9. Primera versión de la cinemática/tutorial.

### Después
10. Mi Peak.
11. Personajes.
12. Estadísticas.
13. Rangos/gallería.
14. Insignias.
15. Misiones.
16. Learn.
17. Niveles.
18. Batallas.
19. Bosses.
20. Simulacros.
21. Peak Coins.
22. Recompensas.
23. Seguridad/performance/responsive/tests.

### Más adelante
24. Peaky AI Premium.
25. Chat.
26. Voz.
27. Aventura completa.
28. Mundos, biomas y cinemáticas avanzadas.

## 20. NO HACER AHORA

No:
- reconstruir todo;
- cambiar Next.js/React/Tailwind sin necesidad;
- rehacer el dashboard;
- crear toda la aventura;
- crear todos los bosses;
- integrar toda la IA;
- integrar pagos antes de tiempo;
- inventar assets/rutas;
- crear dos sistemas de rangos;
- crear dos fuentes de EXP;
- meter lógica sensible únicamente en el cliente.

## 21. REGLA DE TRABAJO

Una etapa a la vez:

1. revisar archivos existentes;
2. cambiar lo mínimo;
3. ejecutar ESLint sobre los archivos modificados;
4. probar;
5. confirmar;
6. continuar.

No hacer cambios masivos sin necesidad.

## 22. CHECKLIST ONBOARDING

- [ ] detectar primer ingreso;
- [ ] mostrar Peaky Nova;
- [ ] diálogo;
- [ ] entrada del fundador;
- [ ] historia de PeakScore;
- [ ] tutorial;
- [ ] navegación entre escenas;
- [ ] audio;
- [ ] finalizar onboarding;
- [ ] guardar versión;
- [ ] guardar fecha;
- [ ] no repetir innecesariamente;
- [ ] proteger API;
- [ ] no aceptar user ID arbitrario;
- [ ] no romper dashboard;
- [ ] responsive;
- [ ] ESLint limpio.

## 23. CHECKLIST PEAKY AI — FUTURO

- [ ] chat Premium;
- [ ] tutoría por materia;
- [ ] contexto de progreso;
- [ ] explicaciones;
- [ ] voz;
- [ ] límites de uso;
- [ ] control de costes;
- [ ] backend seguro;
- [ ] protección de claves;
- [ ] privacidad;
- [ ] manejo de errores;
- [ ] fallback;
- [ ] experiencia móvil.

## 24. ESTADO ACTUAL

### Hecho
- [x] ranks.ts
- [x] xp.ts
- [x] seasons.ts
- [x] constants.ts
- [x] seasons
- [x] user_seasons
- [x] RLS inicial
- [x] Temporada 1
- [x] ensure_current_user_season()
- [x] profiles.season_xp creado durante el desarrollo
- [x] onboarding_version
- [x] onboarding_completed_at

### En proceso
- [ ] validación final de season-service.ts
- [ ] integración final de API de perfil
- [ ] perfil usando rangos centrales
- [ ] API segura de onboarding
- [ ] página de onboarding
- [ ] primera cinemática

### Después
- [ ] perfil completo
- [ ] Mi Peak
- [ ] insignias
- [ ] misiones
- [ ] niveles
- [ ] batallas
- [ ] bosses
- [ ] simulacros
- [ ] Peak Coins
- [ ] Peaky AI
- [ ] aventura

## 25. PRINCIPIO FINAL

Todas las funcionalidades deben formar una sola progresión:

```text
PERFIL
 ↓
NIVEL
 ↓
EXP
 ↓
RANGO
 ↓
TEMPORADA
 ↓
MISIONES
 ↓
SIMULACROS
 ↓
BATALLAS
 ↓
MUNDOS
 ↓
RECOMPENSAS
 ↓
PROGRESO
 ↓
PEAK AI
```

Las nuevas ideas de Peaky Nova, Fundador, cinemáticas, audio y Peaky AI se integran al proyecto existente; no lo reemplazan.

## 26. PRÓXIMO PASO INMEDIATO

No saltar todavía a Peak AI ni a la aventura completa.

El siguiente bloque es:

**terminar la integración del onboarding inicial de forma segura y modular.**

Orden:
1. verificar `season-service.ts`;
2. verificar API del perfil;
3. centralizar versión del onboarding;
4. crear API segura para finalizarlo;
5. crear `app/onboarding/page.tsx`;
6. integrar detección de primer ingreso;
7. construir primera escena de Peaky Nova;
8. agregar escena del fundador;
9. conectar audio/tutorial.

Después continuamos con el siguiente punto del plan definitivo.
