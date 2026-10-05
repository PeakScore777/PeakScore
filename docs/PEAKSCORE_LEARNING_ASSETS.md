# PeakScore — Arquitectura de personajes, explicaciones y niveles 2D

> Documento de referencia del sistema visual/educativo de PeakScore.  
> Objetivo: mantener separadas las ilustraciones de explicación, las animaciones 2D de gameplay y los personajes/NPC/enemigos.

## 1. Regla principal

**NO usar una sola imagen grande como personaje animado cuando el objetivo sea animarlo por partes.**

Las animaciones 2D de niveles se construirán por **capas independientes** para poder mover, cambiar y animar cada elemento desde código.

Ejemplo conceptual:

- cuerpo
- cabeza
- ojos
- boca
- brazos
- manos
- cabello
- ropa
- accesorios
- mochila
- efectos

Las capas rasterizadas deben preferiblemente utilizar **WebP con transparencia** para reducir peso. No convertir este sistema en una colección de PNG completos.

## 2. Peaky de explicaciones

Las ilustraciones de explicación son independientes del gameplay.

Ruta actual:

`public/characters/peaky/explanations/`

Archivos actuales:

- `thinking.webp`
- `confused.webp`
- `explaining.webp`
- `happy.webp`
- `idea.webp`
- `pointing.webp`
- `surprised.webp`
- `celebrating.webp`

Estas imágenes representan estados de Peaky durante una explicación educativa.

Ejemplo:

1. `thinking.webp` — plantea una idea/pregunta.
2. El usuario pulsa continuar/`...`.
3. `explaining.webp` — Peaky desarrolla la explicación.
4. `idea.webp` — presenta una idea clave.
5. `happy.webp` o `celebrating.webp` — cierre/recompensa.

**No confundir estas ilustraciones con el personaje 2D de gameplay.**

## 3. Peaky 2D de gameplay

El gameplay de los niveles será una experiencia **programada por PeakScore**, no un mundo libre jugable inicialmente.

La aplicación controla:

- posición de Peaky
- movimiento
- encuentros
- diálogos
- enemigos
- preguntas/desafíos
- vida
- daño
- oportunidades
- victoria
- transición entre escenas

Peaky avanzará porque **nosotros programamos el recorrido del nivel**.

### Ejemplo de Nivel 1

1. Introducción.
2. Peaky aparece.
3. Peaky avanza por el escenario.
4. Llega a una aldea.
5. Encuentra a un sabio.
6. El sabio explica un tema.
7. Peaky aprende mediante una lección.
8. El sabio indica que debe continuar.
9. Peaky sale de la aldea por una puerta.
10. Final del Nivel 1.

### Ejemplo de Nivel 2

1. Fondo oscuro.
2. Peaky aparece.
3. Peaky camina.
4. Encuentra un enemigo.
5. El enemigo plantea un desafío relacionado con el tema aprendido.
6. El usuario responde.
7. Respuesta correcta → el enemigo pierde vida.
8. Respuesta incorrecta → Peaky recibe daño.
9. Se muestran las consecuencias visuales.
10. Hay hasta **3 oportunidades**.
11. Victoria → transición al siguiente tramo/nivel.

## 4. Estados de gameplay

Los estados visuales de gameplay son diferentes de las ilustraciones de explicación.

Ejemplos:

- idle
- walk
- attack/action
- hurt/dolor
- victory
- defeat/finalización, si posteriormente se necesita

Estos estados serán animados mediante capas y/o frames 2D según la escena.

### Importante

Los estados como **victoria** y **dolor** pertenecen al gameplay.

No deben reutilizarse automáticamente como si fueran estados de explicación.

## 5. Estructura de assets

Estructura conceptual:

```
public/
└── characters/
    ├── peaky/
    │   ├── explanations/
    │   │   ├── thinking.webp
    │   │   ├── confused.webp
    │   │   ├── explaining.webp
    │   │   ├── happy.webp
    │   │   ├── idea.webp
    │   │   ├── pointing.webp
    │   │   ├── surprised.webp
    │   │   └── celebrating.webp
    │   │
    │   └── gameplay/
    │       ├── idle/
    │       ├── walk/
    │       ├── actions/
    │       ├── hurt/
    │       └── victory/
    │
    ├── npcs/
    │   ├── sages/
    │   └── villagers/
    │
    └── enemies/
        ├── mathematics/
        ├── reading/
        ├── sciences/
        ├── social/
        └── english/
```

La estructura puede evolucionar, pero **no se debe mezclar explanations con gameplay**.

## 6. Capas del personaje

Cuando creemos el Peaky 2D definitivo, evitar guardar todo el personaje animable como una única imagen.

La idea es trabajar con piezas independientes, por ejemplo:

```
peaky/
└── gameplay/
    └── character/
        ├── body/
        ├── head/
        ├── eyes/
        ├── mouth/
        ├── hair/
        ├── arms/
        ├── hands/
        ├── outfit/
        ├── backpack/
        └── effects/
```

Las piezas concretas se definirán cuando diseñemos el primer personaje 2D completo.

## 7. Cinemáticas

Las cinemáticas son otra capa del sistema.

Se usarán principalmente para:

- entrada a un mundo
- entrada a un nivel
- aparición de un enemigo importante
- aparición de un sabio/personaje clave
- transición al boss
- victoria importante
- desbloqueos/recompensas

No hacer una cinemática completa para cada pregunta.

### Ejemplo

**Inicio de mundo:**

Peaky → portal → transición → mundo.

**Nivel:**

Peaky aparece → avanza → escena programada → NPC → explicación → salida → enemigo.

## 8. Sistema educativo

La progresión propuesta:

**Materia → Mundo → Nivel → Tema → Lección → Práctica → Desafío/Boss → Recompensa**

Los niveles deben enseñar antes de exigir el desafío.

El desafío final debe aplicar el conocimiento aprendido, por ejemplo:

> “Explica/resuelve X para derrotar al enemigo.”

## 9. Reglas visuales

- Mantener identidad visual consistente de Peaky.
- No poner logos de PeakScore innecesariamente en la ropa, libros o accesorios del personaje.
- Mantener transparencia en los assets que se superpongan al escenario.
- Preferir WebP para assets rasterizados.
- No degradar calidad solo por reducir peso.
- Optimizar cada asset con Squoosh cuando corresponda.
- Mantener separados los assets educativos de los assets de gameplay.
- El escenario, personaje, NPC, enemigo y efectos deben poder controlarse por separado.

## 10. Regla de desarrollo

Primero se define y prueba visualmente el sistema.

Después:

1. assets
2. estructura de escenas
3. animaciones
4. lógica del nivel
5. preguntas/desafíos
6. vida/daño
7. recompensas
8. persistencia en Supabase

**No crear todavía tablas de Supabase para aprendizaje hasta validar el prototipo visual y la arquitectura del primer nivel.**

## 11. Primer objetivo de implementación

Construir un **Nivel 1 de Matemáticas** como prototipo.

Concepto:

**Mundo 01 — El Templo de los Números**

Flujo:

```
Cinemática de entrada
        ↓
Peaky aparece
        ↓
Peaky avanza automáticamente
        ↓
Aldea
        ↓
Sabio
        ↓
Explicación del tema
        ↓
Pequeña práctica
        ↓
Peaky continúa
        ↓
Puerta de salida
        ↓
Final del Nivel 1
```

Después se construirá el Nivel 2 con el primer enemigo y sistema de combate educativo.

---

## Estado actual

### Completado

- [x] Definición conceptual de explanations vs gameplay.
- [x] Estados de Peaky para explicaciones.
- [x] Assets de explicación convertidos a WebP.
- [x] Separación de carpetas `explanations/` y `gameplay/`.
- [x] Definición conceptual del gameplay 2D.
- [x] Definición de niveles programados por PeakScore.
- [x] Sistema de 3 oportunidades para desafíos.
- [x] Concepto de vida/daño/victoria.

### Siguiente

- [ ] Definir exactamente las capas del Peaky 2D.
- [ ] Crear el primer set de assets 2D por capas.
- [ ] Definir escenario del Nivel 1.
- [ ] Definir sabio del Nivel 1.
- [ ] Definir enemigo del Nivel 2.
- [ ] Programar el primer prototipo visual.
- [ ] Validar rendimiento.
- [ ] Después definir persistencia/progreso en Supabase.
