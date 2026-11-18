/**
 * Maps a rectangular DOM element onto a projected four-corner screen quad.
 * The returned CSS matrix3d uses the column-major coefficient order required
 * by CSS Transforms. Coordinates are in the overlay parent's CSS pixels.
 *
 * @param {readonly {x:number,y:number}[]} points
 * @param {number} width
 * @param {number} height
 * @returns {string|null}
 */
export function projectMonitorQuad(points, width, height) {
  if (
    !Array.isArray(points) ||
    points.length !== 4 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    points.some((point) =>
      !point ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y)
    )
  ) {
    return null;
  }

  const source = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const matrix = [];

  for (let i = 0; i < 4; i += 1) {
    const [x, y] = source[i];
    const { x: u, y: v } = points[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  // Solve the 8 homography coefficients with partial-pivot Gauss-Jordan.
  for (let column = 0; column < 8; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
        pivot = row;
      }
    }

    if (Math.abs(matrix[pivot][column]) < 1e-9) return null;
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];

    const divisor = matrix[column][column];
    for (let j = column; j <= 8; j += 1) {
      matrix[column][j] /= divisor;
    }

    for (let row = 0; row < 8; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let j = column; j <= 8; j += 1) {
        matrix[row][j] -= factor * matrix[column][j];
      }
    }
  }

  const coefficients = matrix.map((row) => row[8]);
  if (!coefficients.every(Number.isFinite)) return null;

  const [a, b, c, d, e, f, g, h] = coefficients;

  // For CSS matrix3d (column-major):
  // x' = (a*x + b*y + c) / (g*x + h*y + 1)
  // y' = (d*x + e*y + f) / (g*x + h*y + 1)
  // The old ordering swapped these terms, collapsing the overlay into a band.
  const values = [
    a, d, 0, g,
    b, e, 0, h,
    0, 0, 1, 0,
    c, f, 0, 1,
  ].map((value) => Object.is(value, -0) ? 0 : value);

  return `matrix3d(${values.join(",")})`;
}
