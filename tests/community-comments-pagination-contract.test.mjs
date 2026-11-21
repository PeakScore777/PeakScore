import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const page = await readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8");

testCase("comment reads are bounded to a 100-row cursor page", () => {
  assert.match(page, /const COMMENT_PAGE_SIZE = 100/);
  assert.match(page, /\.limit\(COMMENT_PAGE_SIZE\)/);
  assert.match(page, /order\("created_at", \{ ascending: false \}\)[\s\S]*?order\("id", \{ ascending: false \}\)/);
  assert.match(page, /created_at\.lt\." \+ before\.created_at/);
  assert.match(page, /setCommentHasMore\(pageRows\.length === COMMENT_PAGE_SIZE\)/);
});

testCase("reply pages retrieve missing roots so threads are not orphaned", () => {
  assert.match(page, /const missingRootIds = Array\.from\(new Set\(/);
  assert.match(page, /\.is\("parent_comment_id", null\)[\s\S]*?\.in\("id", missingRootIds\)/);
  assert.match(page, /Cargar comentarios anteriores/);
  assert.match(page, /append \? \[\.\.\.current, \.\.\.hydrated\] : hydrated/);
});

testCase("opening a thread resets its cursor and comment list", () => {
  assert.match(page, /setComments\(\[\]\);\s*setCommentHasMore\(false\);\s*setCommentCursor\(null\);\s*setReplyTo\(null\);\s*await loadComments\(messageId\)/);
});
