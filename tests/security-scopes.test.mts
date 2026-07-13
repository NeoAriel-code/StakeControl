import test from "node:test";
import assert from "node:assert/strict";
import { assertSameUser, buildUserScopedWhere } from "../src/lib/security-scopes";

test("buildUserScopedWhere always includes resource id and current user id", () => {
  assert.deepEqual(buildUserScopedWhere("user-1", "resource-1"), {
    id: "resource-1",
    userId: "user-1",
  });
});

test("buildUserScopedWhere rejects missing identifiers", () => {
  assert.throws(() => buildUserScopedWhere("", "resource-1"), /Missing user scope/);
  assert.throws(() => buildUserScopedWhere("user-1", ""), /Missing user scope/);
});

test("assertSameUser blocks cross-user access", () => {
  assert.doesNotThrow(() => assertSameUser("user-1", "user-1"));
  assert.throws(() => assertSameUser("user-2", "user-1"), /does not belong/);
});
