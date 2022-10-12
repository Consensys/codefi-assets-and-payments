import { isNil, sleep } from "./utils";

describe("utils", () => {
  describe("isNil", () => {
    it("undefined is nil", () => {
      expect(isNil(undefined)).toBe(true);
    });

    it("null is nil", () => {
      expect(isNil(null)).toBe(true);
    });

    it("false is nil", () => {
      expect(isNil(false)).toBe(false);
    });
  });

  describe("sleep", () => {
    it("sleep", () => {
      sleep(0);
    });
  });
});
