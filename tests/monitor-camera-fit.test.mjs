import test from "node:test";
import assert from "node:assert/strict";
import { calculateMonitorCameraDistance } from "../lib/geometry/monitor-camera-fit.mjs";

function halfAngles(verticalFovDegrees, aspect) {
  const vertical = verticalFovDegrees * Math.PI / 360;
  return {
    vertical: vertical,
    horizontal: Math.atan(Math.tan(vertical) * aspect),
  };
}

test("monitor camera fit contains the complete screen in a landscape viewport", () => {
  const width = 1.044; // 1.16m plane scaled by the 0.9 monitor assembly
  const height = 0.585; // 0.65m plane scaled by the same assembly
  const fov = 48;
  const aspect = 920 / 517.5;
  const fill = 0.88;
  const distance = calculateMonitorCameraDistance({
    width,
    height,
    verticalFovDegrees: fov,
    aspect,
    fillRatio: fill,
  });
  assert.ok(distance && Number.isFinite(distance));

  const angles = halfAngles(fov, aspect);
  const horizontalOccupancy = width / (2 * distance * Math.tan(angles.horizontal));
  const verticalOccupancy = height / (2 * distance * Math.tan(angles.vertical));
  assert.ok(horizontalOccupancy <= fill + 1e-9);
  assert.ok(verticalOccupancy <= fill + 1e-9);
  assert.ok(Math.max(horizontalOccupancy, verticalOccupancy) >= fill - 1e-9);
});

test("monitor camera fit is determined by width on a narrow viewport", () => {
  const input = { width: 1.044, height: 0.585, verticalFovDegrees: 48, aspect: 0.62, fillRatio: 0.88 };
  const distance = calculateMonitorCameraDistance(input);
  const angles = halfAngles(input.verticalFovDegrees, input.aspect);
  const horizontalOccupancy = input.width / (2 * distance * Math.tan(angles.horizontal));
  const verticalOccupancy = input.height / (2 * distance * Math.tan(angles.vertical));
  assert.ok(distance > 0);
  assert.ok(verticalOccupancy <= input.fillRatio + 1e-9);
  assert.ok(horizontalOccupancy <= input.fillRatio + 1e-9);
  assert.ok(horizontalOccupancy >= verticalOccupancy);
});

test("monitor camera fit rejects invalid dimensions and projection parameters", () => {
  const base = { width: 1, height: 0.5, verticalFovDegrees: 48, aspect: 16 / 9 };
  for (const patch of [
    { width: 0 },
    { height: -1 },
    { verticalFovDegrees: 0 },
    { verticalFovDegrees: 180 },
    { aspect: 0 },
    { fillRatio: 0 },
    { fillRatio: 1.1 },
    { width: Number.NaN },
  ]) {
    assert.equal(calculateMonitorCameraDistance({ ...base, ...patch }), null);
  }
});
