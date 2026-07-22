import assert from "node:assert/strict";
import test from "node:test";
import { getHostRedirect } from "../src/lib/host-routing";

test("system routes on the public host move to the application subdomain", () => {
  assert.equal(
    getHostRedirect("www.getstakecontrol.com", "/login", "?next=%2Fdashboard"),
    "https://app.getstakecontrol.com/login?next=%2Fdashboard"
  );
  assert.equal(
    getHostRedirect("getstakecontrol.com", "/bets/abc", ""),
    "https://app.getstakecontrol.com/bets/abc"
  );
});

test("public routes on the application subdomain move to the public host", () => {
  assert.equal(
    getHostRedirect("app.getstakecontrol.com", "/", ""),
    "https://www.getstakecontrol.com/"
  );
  assert.equal(
    getHostRedirect("app.getstakecontrol.com", "/privacy", "?ref=footer"),
    "https://www.getstakecontrol.com/privacy?ref=footer"
  );
});

test("localhost and requests already on the correct host are left unchanged", () => {
  assert.equal(getHostRedirect("localhost:3000", "/login", ""), null);
  assert.equal(getHostRedirect("app.getstakecontrol.com", "/dashboard", ""), null);
  assert.equal(getHostRedirect("www.getstakecontrol.com", "/terms", ""), null);
});
