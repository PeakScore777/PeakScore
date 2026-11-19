/**
 * Returns the camera distance required to fit a physical monitor plane inside
 * a perspective camera frustum without cropping either axis.
 *
 * width/height are world-space dimensions, not CSS pixels.
 */
export function calculateMonitorCameraDistance({
  width,
  height,
  verticalFovDegrees,
  aspect,
  fillRatio = 0.88,
}) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(verticalFovDegrees) ||
    !Number.isFinite(aspect) ||
    !Number.isFinite(fillRatio) ||
    width <= 0 ||
    height <= 0 ||
    verticalFovDegrees <= 1 ||
    verticalFovDegrees >= 179 ||
    aspect <= 0 ||
    fillRatio <= 0 ||
    fillRatio > 1
  ) {
    return null;
  }

  const verticalHalfAngle = (verticalFovDegrees * Math.PI) / 360;
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect);
  const horizontalDistance = width / (2 * Math.tan(horizontalHalfAngle) * fillRatio);
  const verticalDistance = height / (2 * Math.tan(verticalHalfAngle) * fillRatio);
  const distance = Math.max(horizontalDistance, verticalDistance);

  return Number.isFinite(distance) && distance > 0 ? distance : null;
}
