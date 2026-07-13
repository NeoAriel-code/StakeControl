import test from "node:test";
import assert from "node:assert/strict";
import { getCountryRegistrationDefaults } from "../src/lib/countries";

test("getCountryRegistrationDefaults maps supported local currencies", () => {
  assert.equal(getCountryRegistrationDefaults("CL").currency, "CLP");
  assert.equal(getCountryRegistrationDefaults("MX").currency, "MXN");
});

test("getCountryRegistrationDefaults falls back to USD for unsupported currencies", () => {
  assert.equal(getCountryRegistrationDefaults("VE").currency, "USD");
  assert.equal(getCountryRegistrationDefaults("BR").currency, "USD");
  assert.equal(getCountryRegistrationDefaults("UNKNOWN").currency, "USD");
});

