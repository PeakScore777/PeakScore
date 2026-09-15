"use client";

import { useId } from "react";

import type {
  MathGraphVisualData,
} from "@/lib/visuals/types";

import {
  createNiceScale,
  formatChartValue,
  clamp,
} from "@/components/visuals/charts/chartUtils";

import {
  getAcademicSeriesColor,
  ICFES_VISUAL_THEME,
} from "@/lib/visuals/visualTheme";

/* =========================================================
   PEAKSCORE — MATH GRAPH VISUAL

   Visualizador matemático académico.

   Soporta:

   - Plano cartesiano.
   - Puntos.
   - Etiquetas de puntos.
   - Funciones.
   - Rectas.
   - Parábolas.
   - Polinomios básicos.
   - Múltiples funciones.
   - Dominios individuales.
   - Leyenda.
   - Escalas académicas.
   - Clipping seguro.

   SEGURIDAD:

   Las expresiones matemáticas NO utilizan:

   - eval()
   - Function()
   - ejecución arbitraria de JavaScript

   Se utiliza un parser matemático controlado.
========================================================= */

interface MathGraphVisualProps {
  data: MathGraphVisualData;
}

/* =========================================================
   CONFIGURACIÓN SVG
========================================================= */

const WIDTH = 800;
const HEIGHT = 460;

const PADDING = {
  top: 42,
  right: 44,
  bottom: 64,
  left: 76,
};

const FUNCTION_SAMPLE_COUNT = 360;

/* =========================================================
   TIPOS DEL PARSER
========================================================= */

type TokenType =
  | "number"
  | "variable"
  | "operator"
  | "leftParen"
  | "rightParen";

interface Token {
  type: TokenType;
  value: string;
}

type MathNode =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "variable";
    }
  | {
      type: "unary";
      operator: "+" | "-";
      argument: MathNode;
    }
  | {
      type: "binary";
      operator:
        | "+"
        | "-"
        | "*"
        | "/"
        | "^";
      left: MathNode;
      right: MathNode;
    };

/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface RenderableFunction {
  id: string;
  label: string;
  expression: string;
  domain: [number, number];
  color: string;
  evaluate: (x: number) => number;
}

interface GraphSamplePoint {
  x: number;
  y: number;
}

/* =========================================================
   UTILIDADES NUMÉRICAS
========================================================= */

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function approximatelyEqual(
  a: number,
  b: number,
  epsilon = 0.0000001
): boolean {
  return Math.abs(a - b) < epsilon;
}

/* =========================================================
   NORMALIZAR RANGO
========================================================= */

function normalizeRange(
  minValue: unknown,
  maxValue: unknown,
  fallbackMin: number,
  fallbackMax: number
): [number, number] {
  let min =
    isFiniteNumber(minValue)
      ? minValue
      : fallbackMin;

  let max =
    isFiniteNumber(maxValue)
      ? maxValue
      : fallbackMax;

  if (min > max) {
    [min, max] = [max, min];
  }

  if (
    approximatelyEqual(
      min,
      max
    )
  ) {
    const padding =
      Math.abs(min) > 0
        ? Math.abs(min) * 0.1
        : 1;

    min -= padding;
    max += padding;
  }

  return [min, max];
}

/* =========================================================
   VERIFICAR PUNTO EN RANGO
========================================================= */

function isPointInsideRange(
  x: number,
  y: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): boolean {
  return (
    x >= xMin &&
    x <= xMax &&
    y >= yMin &&
    y <= yMax
  );
}

/* =========================================================
   NORMALIZAR EXPRESIÓN
========================================================= */

function normalizeExpression(
  expression: string
): string {
  let result =
    expression
      .trim()
      .toLowerCase();

  result = result.replace(
    /\s+/g,
    ""
  );

  /*
   * Símbolos matemáticos.
   */
  result = result
    .replace(/×/g, "*")
    .replace(/·/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/–/g, "-")
    .replace(/—/g, "-");

  /*
   * Superíndices comunes.
   */
  result = result
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");

  /*
   * y = expresión
   */
  if (result.startsWith("y=")) {
    result = result.slice(2);
  }

  /*
   * f(x)=expresión
   * g(x)=expresión
   * etc.
   */
  const functionMatch =
    result.match(
      /^[a-z]+\([a-z]\)=/
    );

  if (functionMatch) {
    result = result.slice(
      functionMatch[0].length
    );
  }

  return result;
}

/* =========================================================
   TOKENIZER
========================================================= */

function tokenizeExpression(
  expression: string
): Token[] | null {
  const normalized =
    normalizeExpression(
      expression
    );

  if (!normalized) {
    return null;
  }

  const tokens: Token[] = [];

  let index = 0;

  while (
    index <
    normalized.length
  ) {
    const character =
      normalized[index];

    /*
     * Número.
     */
    if (
      /[0-9.]/.test(
        character
      )
    ) {
      let value = "";
      let decimalPoints = 0;

      while (
        index <
          normalized.length &&
        /[0-9.]/.test(
          normalized[index]
        )
      ) {
        if (
          normalized[index] ===
          "."
        ) {
          decimalPoints += 1;

          if (
            decimalPoints > 1
          ) {
            return null;
          }
        }

        value +=
          normalized[index];

        index += 1;
      }

      const parsedValue =
        Number(value);

      if (
        !Number.isFinite(
          parsedValue
        )
      ) {
        return null;
      }

      tokens.push({
        type: "number",
        value,
      });

      continue;
    }

    /*
     * Variable x.
     */
    if (character === "x") {
      tokens.push({
        type: "variable",
        value: "x",
      });

      index += 1;
      continue;
    }

    /*
     * Operadores.
     */
    if (
      [
        "+",
        "-",
        "*",
        "/",
        "^",
      ].includes(character)
    ) {
      tokens.push({
        type: "operator",
        value: character,
      });

      index += 1;
      continue;
    }

    /*
     * Paréntesis.
     */
    if (character === "(") {
      tokens.push({
        type: "leftParen",
        value: character,
      });

      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({
        type: "rightParen",
        value: character,
      });

      index += 1;
      continue;
    }

    /*
     * Cualquier otro carácter es rechazado.
     */
    return null;
  }

  /* =======================================================
     MULTIPLICACIÓN IMPLÍCITA

     2x       -> 2*x
     2(x+1)   -> 2*(x+1)
     (x+1)x   -> (x+1)*x
     (x+1)(x-1)
  ======================================================= */

  const normalizedTokens: Token[] =
    [];

  for (
    let tokenIndex = 0;
    tokenIndex <
    tokens.length;
    tokenIndex += 1
  ) {
    const current =
      tokens[tokenIndex];

    const next =
      tokens[tokenIndex + 1];

    normalizedTokens.push(
      current
    );

    if (!next) {
      continue;
    }

    const currentCanMultiply =
      current.type ===
        "number" ||
      current.type ===
        "variable" ||
      current.type ===
        "rightParen";

    const nextCanMultiply =
      next.type ===
        "number" ||
      next.type ===
        "variable" ||
      next.type ===
        "leftParen";

    if (
      currentCanMultiply &&
      nextCanMultiply
    ) {
      normalizedTokens.push({
        type: "operator",
        value: "*",
      });
    }
  }

  return normalizedTokens;
}

/* =========================================================
   PARSER RECURSIVO

   PRECEDENCIA:

   1. Paréntesis
   2. Potencias
   3. Signos unarios
   4. Multiplicación / división
   5. Suma / resta

   Esto corrige específicamente:

   -x^2

   que debe interpretarse como:

   -(x^2)

   y NO:

   (-x)^2
========================================================= */

class ExpressionParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[]
  ) {}

  parse(): MathNode | null {
    const expression =
      this.parseAddition();

    if (!expression) {
      return null;
    }

    if (
      this.index !==
      this.tokens.length
    ) {
      return null;
    }

    return expression;
  }

  private current():
    | Token
    | undefined {
    return this.tokens[
      this.index
    ];
  }

  private consume():
    | Token
    | undefined {
    const token =
      this.tokens[this.index];

    this.index += 1;

    return token;
  }

  /*
   * Suma y resta.
   */
  private parseAddition():
    | MathNode
    | null {
    let node =
      this.parseMultiplication();

    if (!node) {
      return null;
    }

    while (true) {
      const token =
        this.current();

      if (
        token?.type !==
          "operator" ||
        ![
          "+",
          "-",
        ].includes(
          token.value
        )
      ) {
        break;
      }

      const operator =
        this.consume()
          ?.value as
          | "+"
          | "-";

      const right =
        this.parseMultiplication();

      if (!right) {
        return null;
      }

      node = {
        type: "binary",
        operator,
        left: node,
        right,
      };
    }

    return node;
  }

  /*
   * Multiplicación y división.
   */
  private parseMultiplication():
    | MathNode
    | null {
    let node =
      this.parseUnary();

    if (!node) {
      return null;
    }

    while (true) {
      const token =
        this.current();

      if (
        token?.type !==
          "operator" ||
        ![
          "*",
          "/",
        ].includes(
          token.value
        )
      ) {
        break;
      }

      const operator =
        this.consume()
          ?.value as
          | "*"
          | "/";

      const right =
        this.parseUnary();

      if (!right) {
        return null;
      }

      node = {
        type: "binary",
        operator,
        left: node,
        right,
      };
    }

    return node;
  }

  /*
   * Signo unario.

   * IMPORTANTE:
   *
   * El signo se procesa DESPUÉS de potencia.
   *
   * -x^2
   * =
   * -(x^2)
   */
  private parseUnary():
    | MathNode
    | null {
    const token =
      this.current();

    if (
      token?.type ===
        "operator" &&
      [
        "+",
        "-",
      ].includes(
        token.value
      )
    ) {
      const operator =
        this.consume()
          ?.value as
          | "+"
          | "-";

      const argument =
        this.parseUnary();

      if (!argument) {
        return null;
      }

      return {
        type: "unary",
        operator,
        argument,
      };
    }

    return this.parsePower();
  }

  /*
   * Potencias.

   * La potencia es asociativa
   * hacia la derecha:

   x^2^3
   =
   x^(2^3)
   */
  private parsePower():
    | MathNode
    | null {
    let node =
      this.parsePrimary();

    if (!node) {
      return null;
    }

    const token =
      this.current();

    if (
      token?.type ===
        "operator" &&
      token.value === "^"
    ) {
      this.consume();

      const right =
        this.parsePower();

      if (!right) {
        return null;
      }

      node = {
        type: "binary",
        operator: "^",
        left: node,
        right,
      };
    }

    return node;
  }

  /*
   * Números, variable y paréntesis.
   */
  private parsePrimary():
    | MathNode
    | null {
    const token =
      this.current();

    if (!token) {
      return null;
    }

    if (
      token.type ===
      "number"
    ) {
      this.consume();

      const value =
        Number(token.value);

      if (
        !Number.isFinite(
          value
        )
      ) {
        return null;
      }

      return {
        type: "number",
        value,
      };
    }

    if (
      token.type ===
      "variable"
    ) {
      this.consume();

      return {
        type: "variable",
      };
    }

    if (
      token.type ===
      "leftParen"
    ) {
      this.consume();

      const node =
        this.parseAddition();

      if (!node) {
        return null;
      }

      const closing =
        this.current();

      if (
        closing?.type !==
        "rightParen"
      ) {
        return null;
      }

      this.consume();

      return node;
    }

    return null;
  }
}

/* =========================================================
   COMPILAR EXPRESIÓN
========================================================= */

function compileExpression(
  expression: string
):
  | ((x: number) => number)
  | null {
  const tokens =
    tokenizeExpression(
      expression
    );

  if (!tokens) {
    return null;
  }

  const parser =
    new ExpressionParser(
      tokens
    );

  const tree =
    parser.parse();

  if (!tree) {
    return null;
  }

  function evaluate(
    node: MathNode,
    x: number
  ): number {
    switch (node.type) {
      case "number":
        return node.value;

      case "variable":
        return x;

      case "unary": {
        const value =
          evaluate(
            node.argument,
            x
          );

        if (
          !Number.isFinite(
            value
          )
        ) {
          return NaN;
        }

        return node.operator ===
          "-"
          ? -value
          : value;
      }

      case "binary": {
        const left =
          evaluate(
            node.left,
            x
          );

        const right =
          evaluate(
            node.right,
            x
          );

        if (
          !Number.isFinite(
            left
          ) ||
          !Number.isFinite(
            right
          )
        ) {
          return NaN;
        }

        switch (
          node.operator
        ) {
          case "+":
            return (
              left + right
            );

          case "-":
            return (
              left - right
            );

          case "*":
            return (
              left * right
            );

          case "/":
            if (
              Math.abs(
                right
              ) <
              0.0000000001
            ) {
              return NaN;
            }

            return (
              left / right
            );

          case "^": {
            const result =
              Math.pow(
                left,
                right
              );

            return Number.isFinite(
              result
            )
              ? result
              : NaN;
          }

          default:
            return NaN;
        }
      }

      default:
        return NaN;
    }
  }

  return (
    x: number
  ) => {
    if (
      !Number.isFinite(x)
    ) {
      return NaN;
    }

    const result =
      evaluate(
        tree,
        x
      );

    return Number.isFinite(
      result
    )
      ? result
      : NaN;
  };
}

/* =========================================================
   CONSTRUIR SEGMENTOS DE FUNCIÓN
========================================================= */

function buildFunctionSegments({
  evaluate,
  domain,
  xMin,
  xMax,
  yMin,
  yMax,
}: {
  evaluate: (
    x: number
  ) => number;

  domain: [
    number,
    number
  ];

  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}): GraphSamplePoint[][] {
  const visibleDomainMin =
    Math.max(
      domain[0],
      xMin
    );

  const visibleDomainMax =
    Math.min(
      domain[1],
      xMax
    );

  if (
    visibleDomainMin >
    visibleDomainMax
  ) {
    return [];
  }

  const segments:
    GraphSamplePoint[][] =
    [];

  let currentSegment:
    GraphSamplePoint[] =
    [];

  const visibleRange =
    Math.max(
      Math.abs(
        yMax - yMin
      ),
      1
    );

  /*
   * Detectamos saltos extremadamente grandes.
   *
   * Esto ayuda con discontinuidades como:
   *
   * 1 / x
   *
   * sin cortar funciones normales
   * innecesariamente.
   */
  const jumpThreshold =
    visibleRange * 1.5;

  let previousY:
    | number
    | null = null;

  for (
    let index = 0;
    index <=
      FUNCTION_SAMPLE_COUNT;
    index += 1
  ) {
    const progress =
      index /
      FUNCTION_SAMPLE_COUNT;

    const x =
      visibleDomainMin +
      progress *
        (
          visibleDomainMax -
          visibleDomainMin
        );

    const y =
      evaluate(x);

    const isFinite =
      Number.isFinite(y);

    const isVisible =
      isFinite &&
      y >= yMin &&
      y <= yMax;

    const hasLargeJump =
      previousY !== null &&
      isFinite &&
      Math.abs(
        y - previousY
      ) >
        jumpThreshold;

    if (
      !isVisible ||
      hasLargeJump
    ) {
      if (
        currentSegment.length >
        1
      ) {
        segments.push(
          currentSegment
        );
      }

      currentSegment = [];

      previousY =
        isFinite
          ? y
          : null;

      continue;
    }

    currentSegment.push({
      x,
      y,
    });

    previousY = y;
  }

  if (
    currentSegment.length >
    1
  ) {
    segments.push(
      currentSegment
    );
  }

  return segments;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function MathGraphVisual({
  data,
}: MathGraphVisualProps) {
  /* =======================================================
     RANGOS
  ======================================================= */

  const [rawXMin, rawXMax] =
    Array.isArray(
      data.x_range
    )
      ? data.x_range
      : [-10, 10];

  const [rawYMin, rawYMax] =
    Array.isArray(
      data.y_range
    )
      ? data.y_range
      : [-10, 10];

  const [
    normalizedXMin,
    normalizedXMax,
  ] = normalizeRange(
    rawXMin,
    rawXMax,
    -10,
    10
  );

  const [
    normalizedYMin,
    normalizedYMax,
  ] = normalizeRange(
    rawYMin,
    rawYMax,
    -10,
    10
  );

  /* =======================================================
     ESCALAS
  ======================================================= */

  const xScale =
    createNiceScale({
      min: normalizedXMin,
      max: normalizedXMax,
      targetTicks: 6,
    });

  const yScale =
    createNiceScale({
      min: normalizedYMin,
      max: normalizedYMax,
      targetTicks: 6,
    });

  const xMin = xScale.min;
  const xMax = xScale.max;

  const yMin = yScale.min;
  const yMax = yScale.max;

  const xTicks =
    xScale.ticks;

  const yTicks =
    yScale.ticks;

  /* =======================================================
     ÁREA DEL PLANO
  ======================================================= */

  const graphLeft =
    PADDING.left;

  const graphTop =
    PADDING.top;

  const graphRight =
    WIDTH -
    PADDING.right;

  const graphBottom =
    HEIGHT -
    PADDING.bottom;

  const graphWidth =
    graphRight -
    graphLeft;

  const graphHeight =
    graphBottom -
    graphTop;

  /* =======================================================
     CONVERSIÓN DE COORDENADAS
  ======================================================= */

  const getX = (
    value: number
  ): number => {
    const range =
      xMax - xMin;

    if (
      !Number.isFinite(
        range
      ) ||
      range === 0
    ) {
      return (
        graphLeft +
        graphWidth / 2
      );
    }

    const percentage =
      (value - xMin) /
      range;

    return (
      graphLeft +
      percentage *
        graphWidth
    );
  };

  const getY = (
    value: number
  ): number => {
    const range =
      yMax - yMin;

    if (
      !Number.isFinite(
        range
      ) ||
      range === 0
    ) {
      return (
        graphTop +
        graphHeight / 2
      );
    }

    const percentage =
      (value - yMin) /
      range;

    return (
      graphBottom -
      percentage *
        graphHeight
    );
  };

  /* =======================================================
     CONFIGURACIÓN
  ======================================================= */

  const shouldShowGrid =
    data.show_grid !== false;

  const shouldShowAxes =
    data.show_axes !== false;

  const shouldShowAxisNumbers =
    data.show_axis_numbers !==
    false;

  /* =======================================================
     EJES
  ======================================================= */

  const hasXAxis =
    yMin <= 0 &&
    yMax >= 0;

  const hasYAxis =
    xMin <= 0 &&
    xMax >= 0;

  const xAxisY =
    hasXAxis
      ? getY(0)
      : null;

  const yAxisX =
    hasYAxis
      ? getX(0)
      : null;

  /* =======================================================
     PUNTOS VÁLIDOS
  ======================================================= */

  const validPoints =
    Array.isArray(
      data.points
    )
      ? data.points.filter(
          (point) =>
            isFiniteNumber(
              point.x
            ) &&
            isFiniteNumber(
              point.y
            )
        )
      : [];

  /* =======================================================
     FUNCIONES RENDERIZABLES
  ======================================================= */

  const renderableFunctions:
    RenderableFunction[] =
    [];

  if (
    Array.isArray(
      data.functions
    )
  ) {
    data.functions.forEach(
      (
        mathFunction,
        index
      ) => {
        if (
          mathFunction.visible ===
          false
        ) {
          return;
        }

        if (
          !mathFunction.expression ||
          typeof mathFunction.expression !==
            "string"
        ) {
          return;
        }

        const evaluate =
          compileExpression(
            mathFunction.expression
          );

        if (!evaluate) {
          return;
        }

        let domain: [
          number,
          number
        ] = [
          xMin,
          xMax,
        ];

        if (
          Array.isArray(
            mathFunction.domain
          ) &&
          mathFunction.domain.length ===
            2
        ) {
          const [
            domainMin,
            domainMax,
          ] = normalizeRange(
            mathFunction.domain[0],
            mathFunction.domain[1],
            xMin,
            xMax
          );

          domain = [
            domainMin,
            domainMax,
          ];
        }

        renderableFunctions.push({
          id:
            mathFunction.id ||
            `function-${index}`,

          label:
            mathFunction.label ||
            mathFunction.expression,

          expression:
            mathFunction.expression,

          domain,

          color:
            getAcademicSeriesColor(
              index
            ),

          evaluate,
        });
      }
    );
  }

  /* =======================================================
     SEGMENTOS
  ======================================================= */

  const functionSegments =
    renderableFunctions.map(
      (mathFunction) => ({
        ...mathFunction,

        segments:
          buildFunctionSegments({
            evaluate:
              mathFunction.evaluate,

            domain:
              mathFunction.domain,

            xMin,
            xMax,
            yMin,
            yMax,
          }),
      })
    );

  /* =======================================================
     ID SVG ÚNICO

     useId evita colisiones cuando existen
     varias gráficas iguales en una misma página.
  ======================================================= */

  const reactId =
    useId();

  const clipPathId =
    `math-graph-clip-${reactId.replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    )}`;

  /* =======================================================
     PATH SVG
  ======================================================= */

  function createPath(
    points: GraphSamplePoint[]
  ): string {
    return points
      .map(
        (
          point,
          index
        ) => {
          const x =
            getX(point.x);

          const y =
            getY(point.y);

          return index === 0
            ? `M ${x} ${y}`
            : `L ${x} ${y}`;
        }
      )
      .join(" ");
  }

  /* =======================================================
     LEYENDA
  ======================================================= */

  const hasLegend =
    renderableFunctions.length >
    0;

  /* =======================================================
     TEMA VISUAL
  ======================================================= */

  const axisColor =
    ICFES_VISUAL_THEME.axis.color;

  const axisWidth =
    ICFES_VISUAL_THEME.axis.width;

  const axisTickWidth =
    ICFES_VISUAL_THEME.axis
      .tickWidth;

  const axisTickLength =
    ICFES_VISUAL_THEME.axis
      .tickLength;

  const gridColor =
    ICFES_VISUAL_THEME.grid.color;

  const gridWidth =
    ICFES_VISUAL_THEME.grid.width;

  const gridOpacity =
    ICFES_VISUAL_THEME.grid.opacity;

  const gridDashArray =
    ICFES_VISUAL_THEME.grid
      .dashArray;

  const fontFamily =
    ICFES_VISUAL_THEME.typography
      .fontFamily;

  const tickLabelSize =
    ICFES_VISUAL_THEME.typography
      .tickLabelSize;

  const axisLabelSize =
    ICFES_VISUAL_THEME.typography
      .axisLabelSize;

  const regularFontWeight =
    ICFES_VISUAL_THEME.typography
      .fontWeight.regular;

  const mediumFontWeight =
    ICFES_VISUAL_THEME.typography
      .fontWeight.medium;

  const primaryText =
    ICFES_VISUAL_THEME.text.primary;

  const secondaryText =
    ICFES_VISUAL_THEME.text.secondary;

  /* =======================================================
     COLOR DEL PUNTO
  ======================================================= */

  const pointColor =
    getAcademicSeriesColor(
      0
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
      "
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      {data.title && (
        <header
          className="
            border-b
            border-slate-200
            bg-slate-50/70
            px-5
            py-3
          "
        >
          <h3
            className="
              text-center
              text-sm
              font-semibold
              tracking-tight
              text-slate-800
            "
          >
            {data.title}
          </h3>
        </header>
      )}

      {/* ===================================================
          LEYENDA
      =================================================== */}

      {hasLegend && (
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-6
            gap-y-2
            border-b
            border-slate-100
            bg-white
            px-5
            py-3
          "
        >
          {renderableFunctions.map(
            (mathFunction) => (
              <div
                key={
                  mathFunction.id
                }
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    h-[3px]
                    w-7
                    shrink-0
                    rounded-full
                  "
                  style={{
                    backgroundColor:
                      mathFunction.color,
                  }}
                />

                <span
                  className="
                    text-xs
                    font-medium
                    text-slate-600
                  "
                >
                  {
                    mathFunction.label
                  }
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* ===================================================
          GRÁFICO
      =================================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          p-4
          sm:p-6
        "
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="
            block
            min-w-[650px]
            w-full
            select-none
          "
          role="img"
          aria-label={
            data.description ??
            data.title ??
            "Gráfica matemática"
          }
          style={{
            fontFamily,
          }}
        >
          {/* ===============================================
              DEFINICIONES
          =============================================== */}

          <defs>
            <clipPath
              id={clipPathId}
            >
              <rect
                x={graphLeft}
                y={graphTop}
                width={graphWidth}
                height={graphHeight}
              />
            </clipPath>
          </defs>

          {/* ===============================================
              FONDO
          =============================================== */}

          <rect
            x="0"
            y="0"
            width={WIDTH}
            height={HEIGHT}
            fill="#ffffff"
          />

          {/* ===============================================
              ÁREA DEL PLANO
          =============================================== */}

          <rect
            x={graphLeft}
            y={graphTop}
            width={graphWidth}
            height={graphHeight}
            fill="#ffffff"
            stroke={ICFES_VISUAL_THEME.axis.color}
            strokeOpacity={0.35}
            strokeWidth="1"
          />

          {/* ===============================================
              GRID VERTICAL
          =============================================== */}

          {shouldShowGrid &&
            xTicks.map(
              (
                value,
                index
              ) => {
                const x =
                  clamp(
                    getX(value),
                    graphLeft,
                    graphRight
                  );

                return (
                  <line
                    key={`vertical-grid-${index}`}
                    x1={x}
                    y1={graphTop}
                    x2={x}
                    y2={graphBottom}
                    stroke={
                      gridColor
                    }
                    strokeWidth={
                      gridWidth
                    }
                    opacity={
                      gridOpacity
                    }
                    strokeDasharray={
                      gridDashArray
                    }
                  />
                );
              }
            )}

          {/* ===============================================
              GRID HORIZONTAL
          =============================================== */}

          {shouldShowGrid &&
            yTicks.map(
              (
                value,
                index
              ) => {
                const y =
                  clamp(
                    getY(value),
                    graphTop,
                    graphBottom
                  );

                return (
                  <line
                    key={`horizontal-grid-${index}`}
                    x1={graphLeft}
                    y1={y}
                    x2={graphRight}
                    y2={y}
                    stroke={
                      gridColor
                    }
                    strokeWidth={
                      gridWidth
                    }
                    opacity={
                      gridOpacity
                    }
                    strokeDasharray={
                      gridDashArray
                    }
                  />
                );
              }
            )}

          {/* ===============================================
              EJE X
          =============================================== */}

          {shouldShowAxes &&
            xAxisY !== null && (
              <line
                x1={graphLeft}
                y1={xAxisY}
                x2={graphRight}
                y2={xAxisY}
                stroke={axisColor}
                strokeWidth={
                  axisWidth
                }
              />
            )}

          {/* ===============================================
              EJE Y
          =============================================== */}

          {shouldShowAxes &&
            yAxisX !== null && (
              <line
                x1={yAxisX}
                y1={graphTop}
                x2={yAxisX}
                y2={graphBottom}
                stroke={axisColor}
                strokeWidth={
                  axisWidth
                }
              />
            )}

          {/* ===============================================
              TICKS X
          =============================================== */}

          {shouldShowAxes &&
            xTicks.map(
              (
                value,
                index
              ) => {
                const x =
                  clamp(
                    getX(value),
                    graphLeft,
                    graphRight
                  );

                const tickY =
                  xAxisY ??
                  graphBottom;

                return (
                  <line
                    key={`x-tick-${index}`}
                    x1={x}
                    y1={tickY}
                    x2={x}
                    y2={
                      tickY +
                      axisTickLength
                    }
                    stroke={
                      axisColor
                    }
                    strokeWidth={
                      axisTickWidth
                    }
                  />
                );
              }
            )}

          {/* ===============================================
              TICKS Y
          =============================================== */}

          {shouldShowAxes &&
            yTicks.map(
              (
                value,
                index
              ) => {
                const y =
                  clamp(
                    getY(value),
                    graphTop,
                    graphBottom
                  );

                const tickX =
                  yAxisX ??
                  graphLeft;

                return (
                  <line
                    key={`y-tick-${index}`}
                    x1={
                      tickX -
                      axisTickLength
                    }
                    y1={y}
                    x2={tickX}
                    y2={y}
                    stroke={
                      axisColor
                    }
                    strokeWidth={
                      axisTickWidth
                    }
                  />
                );
              }
            )}

          {/* ===============================================
              ETIQUETAS X
          =============================================== */}

          {shouldShowAxisNumbers &&
            xTicks.map(
              (
                value,
                index
              ) => {
                /*
                 * El cero se muestra
                 * mediante el origen.
                 */
                if (
                  Math.abs(value) <
                  0.000001
                ) {
                  return null;
                }

                const x =
                  clamp(
                    getX(value),
                    graphLeft,
                    graphRight
                  );

                return (
                  <text
                    key={`x-label-${index}`}
                    x={x}
                    y={
                      graphBottom +
                      24
                    }
                    textAnchor="middle"
                    fontSize={
                      tickLabelSize
                    }
                    fontWeight={
                      regularFontWeight
                    }
                    fill={
                      secondaryText
                    }
                  >
                    {formatChartValue(
                      value
                    )}
                  </text>
                );
              }
            )}

          {/* ===============================================
              ETIQUETAS Y
          =============================================== */}

          {shouldShowAxisNumbers &&
            yTicks.map(
              (
                value,
                index
              ) => {
                if (
                  Math.abs(value) <
                  0.000001
                ) {
                  return null;
                }

                const y =
                  clamp(
                    getY(value),
                    graphTop,
                    graphBottom
                  );

                return (
                  <text
                    key={`y-label-${index}`}
                    x={
                      graphLeft -
                      14
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize={
                      tickLabelSize
                    }
                    fontWeight={
                      regularFontWeight
                    }
                    fill={
                      secondaryText
                    }
                  >
                    {formatChartValue(
                      value
                    )}
                  </text>
                );
              }
            )}

          {/* ===============================================
              ORIGEN
          =============================================== */}

          {shouldShowAxisNumbers &&
            shouldShowAxes &&
            xAxisY !== null &&
            yAxisX !== null && (
              <text
                x={
                  yAxisX - 10
                }
                y={
                  xAxisY + 18
                }
                textAnchor="end"
                fontSize={
                  tickLabelSize
                }
                fontWeight={
                  mediumFontWeight
                }
                fill={
                  axisColor
                }
              >
                0
              </text>
            )}

          {/* ===============================================
              CONTENIDO MATEMÁTICO
          =============================================== */}

          <g
            clipPath={`url(#${clipPathId})`}
          >
            {/* =============================================
                FUNCIONES
            ============================================= */}

            {functionSegments.map(
              (
                mathFunction
              ) =>
                mathFunction.segments.map(
                  (
                    segment,
                    segmentIndex
                  ) => (
                    <path
                      key={`${mathFunction.id}-segment-${segmentIndex}`}
                      d={createPath(
                        segment
                      )}
                      fill="none"
                      stroke={
                        mathFunction.color
                      }
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                )
            )}

            {/* =============================================
                PUNTOS
            ============================================= */}

            {validPoints.map(
              (
                point,
                index
              ) => {
                const isInsideGraph =
                  isPointInsideRange(
                    point.x,
                    point.y,
                    xMin,
                    xMax,
                    yMin,
                    yMax
                  );

                if (
                  !isInsideGraph
                ) {
                  return null;
                }

                const cx =
                  getX(
                    point.x
                  );

                const cy =
                  getY(
                    point.y
                  );

                const shouldShowLabel =
                  point.show_label !==
                  false;

                return (
                  <g
                    key={
                      point.id ??
                      `${point.x}-${point.y}-${index}`
                    }
                  >
                    {/* Halo */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="8.5"
                      fill="#ffffff"
                      opacity="0.96"
                    />

                    {/* Punto */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill={
                        pointColor
                      }
                      stroke="#ffffff"
                      strokeWidth="2"
                    >
                      <title>
                        {`(${formatChartValue(
                          point.x
                        )}, ${formatChartValue(
                          point.y
                        )})${
                          point.label
                            ? ` — ${point.label}`
                            : ""
                        }`}
                      </title>
                    </circle>

                    {/* Etiqueta */}
                    {shouldShowLabel &&
                      point.label && (
                        <text
                          x={
                            cx + 11
                          }
                          y={
                            cy - 10
                          }
                          fontSize={
                            axisLabelSize
                          }
                          fontWeight={
                            mediumFontWeight
                          }
                          fill={
                            primaryText
                          }
                          paintOrder="stroke"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinejoin="round"
                        >
                          {
                            point.label
                          }
                        </text>
                      )}
                  </g>
                );
              }
            )}
          </g>

          {/* ===============================================
              BORDE FINAL
          =============================================== */}

          <rect
            x={graphLeft}
            y={graphTop}
            width={graphWidth}
            height={graphHeight}
            fill="none"
            stroke={
              ICFES_VISUAL_THEME.axis.color
            }
            strokeOpacity={0.35}
            strokeWidth="1"
            pointerEvents="none"
          />
        </svg>
      </div>

      {/* ===================================================
          LABELS DE EJES
      =================================================== */}

      {(data.x_label ||
        data.y_label) && (
        <footer
          className="
            flex
            items-center
            justify-between
            gap-4
            border-t
            border-slate-100
            px-5
            py-3
          "
        >
          <span
            className="
              text-[11px]
              font-medium
              text-slate-500
            "
          >
            {data.x_label ??
              ""}
          </span>

          <span
            className="
              text-right
              text-[11px]
              font-medium
              text-slate-500
            "
          >
            {data.y_label ??
              ""}
          </span>
        </footer>
      )}
    </section>
  );
}