import test from "node:test";
import assert from "node:assert/strict";
import { projectMonitorQuad } from "../lib/geometry/projective-quad.mjs";

function transformPoint(matrix, x, y) {
  const values = matrix
    .match(/^matrix3d\((.+)\)$/)?.[1]
    .split(",")
    .map(Number);
  assert.equal(values?.length, 16, "expected a CSS matrix3d with 16 values");

  const denominator = values[3] * x + values[7] * y + values[15];
  return {
    x: (values[0] * x + values[4] * y + values[12]) / denominator,
    y: (values[1] * x + values[5] * y + values[13]) / denominator,
  };
}

function assertPointClose(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual.x - expected.x) <= epsilon, `x: ${actual.x} != ${expected.x}`);
  assert.ok(Math.abs(actual.y - expected.y) <= epsilon, `y: ${actual.y} != ${expected.y}`);
}

test("projectMonitorQuad maps every DOM corner to its projected CRT corner", () => {
  const width = 920;
  const height = 600;
  const screenCorners = [
    { x: 420, y: 180 },
    { x: 1320, y: 205 },
    { x: 1270, y: 785 },
    { x: 450, y: 760 },
  ];

  const matrix = projectMonitorQuad(screenCorners, width, height);
  assert.ok(matrix);

  const domCorners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];

  domCorners.forEach(([x, y], index) => {
    assertPointClose(transformPoint(matrix, x, y), screenCorners[index]);
  });
});

test("projectMonitorQuad keeps a front-facing rectangular screen undistorted", () => {
  const matrix = projectMonitorQuad([
    { x: 100, y: 50 },
    { x: 1020, y: 50 },
    { x: 1020, y: 650 },
    { x: 100, y: 650 },
  ], 920, 600);

  assert.ok(matrix);
  assertPointClose(transformPoint(matrix, 0, 0), { x: 100, y: 50 });
  assertPointClose(transformPoint(matrix, 920, 600), { x: 1020, y: 650 });
});

test("projectMonitorQuad rejects a mirrored back-face quad", () => {
  const mirrored = [
    { x: 1020, y: 50 },
    { x: 100, y: 50 },
    { x: 100, y: 650 },
    { x: 1020, y: 650 },
  ];
  assert.equal(projectMonitorQuad(mirrored, 920, 600), null);
});

test("projectMonitorQuad rejects invalid or degenerate input", () => {
  assert.equal(projectMonitorQuad([], 920, 600), null);
  assert.equal(projectMonitorQuad([{ x: 0, y: 0 }], 920, 600), null);
  assert.equal(projectMonitorQuad([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
  ], 920, 600), null);
  assert.equal(projectMonitorQuad([
    { x: Number.NaN, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ], 920, 600), null);
});

test("projectMonitorQuad rejects a side-on, unreadable CRT projection", () => {
  const sideOn = [
    { x: 480, y: 60 },
    { x: 650, y: 65 },
    { x: 650, y: 645 },
    { x: 480, y: 640 },
  ];
  assert.equal(projectMonitorQuad(sideOn, 920, 600), null);
});

test("projectMonitorQuad rejects a non-convex projected screen", () => {
  const folded = [
    { x: 100, y: 50 },
    { x: 1020, y: 50 },
    { x: 400, y: 300 },
    { x: 100, y: 650 },
  ];
  assert.equal(projectMonitorQuad(folded, 920, 600), null);
});
