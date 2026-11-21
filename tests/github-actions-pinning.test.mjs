import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import testCase from "node:test";
import path from "node:path";

const workflowDirectory = new URL("../.github/workflows/", import.meta.url);
const entries = await readdir(workflowDirectory);
const workflowFiles = entries.filter((entry) => /\.(yml|yaml)$/i.test(entry));

testCase("all external GitHub Actions are pinned to immutable commit SHAs", async () => {
  assert.ok(workflowFiles.length > 0, "Expected at least one workflow file.");
  const violations = [];

  for (const file of workflowFiles) {
    const content = await readFile(new URL(file, workflowDirectory), "utf8");
    for (const [index, line] of content.split("\n").entries()) {
      const match = line.match(/^\s*uses:\s*([^\s#]+)/);
      if (!match) continue;
      const reference = match[1];
      if (reference.startsWith("./")) continue;
      if (!/^[^@]+@[a-f0-9]{40}$/i.test(reference)) {
        violations.push(file + ":" + (index + 1) + " -> " + reference);
      }
    }
  }

  assert.deepEqual(violations, [], "Unpinned GitHub Actions are supply-chain risks.");
});
