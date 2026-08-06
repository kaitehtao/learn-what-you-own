import assert from "node:assert/strict";
import test from "node:test";
import { needsDarkLogoBackground } from "../app/CompanyLogo";

function repeatedPixel(red: number, green: number, blue: number, alpha = 255, count = 64) {
  return new Uint8ClampedArray(Array.from({ length: count }, () => [red, green, blue, alpha]).flat());
}

test("places predominantly white logo artwork on a dark tile", () => {
  assert.equal(needsDarkLogoBackground(repeatedPixel(255, 255, 255)), true);
});

test("keeps dark and full-color logo artwork on the neutral tile", () => {
  assert.equal(needsDarkLogoBackground(repeatedPixel(15, 42, 33)), false);
  assert.equal(needsDarkLogoBackground(repeatedPixel(22, 120, 82)), false);
});

test("ignores transparent pixels when choosing logo contrast", () => {
  assert.equal(needsDarkLogoBackground(repeatedPixel(255, 255, 255, 0)), false);
});
