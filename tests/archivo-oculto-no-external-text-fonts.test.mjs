import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/games/ArchivoOcultoLibrary3D.tsx", import.meta.url), "utf8");

test("3D keyboard legends are local textures, not Troika font requests", () => {
  assert.doesNotMatch(source, /from ["\']troika-three-text["\']/);
  assert.doesNotMatch(source, /\bText\s*[,}]/);
  assert.doesNotMatch(source, /<Text\b|configureTextBuilder/);
  assert.match(source, /getKeyboardLegendTexture/);
  assert.match(source, /new THREE\.CanvasTexture\(canvas\)/);
});
