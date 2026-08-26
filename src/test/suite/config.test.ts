import * as assert from "assert";
import { getConfig, setConfig, supportedLanguages, supportedNonCssFiles } from "../../config";

suite("Config Test Suite", () => {
  teardown(async () => {
    await setConfig("sortingStrategy", undefined);
    await setConfig("ignoredFiles", undefined);
  });

  test("treats template languages as non-css files", () => {
    assert.deepStrictEqual([...supportedNonCssFiles].sort(), ["astro", "html", "svelte", "vue"]);
  });

  test("supports the css dialects and the template languages", () => {
    assert.deepStrictEqual([...supportedLanguages].sort(), [
      "astro",
      "css",
      "html",
      "less",
      "sass",
      "scss",
      "svelte",
      "vue",
    ]);
  });

  test("reads the packaged defaults", () => {
    assert.strictEqual(getConfig("sortingStrategy"), "concentric-css");
    assert.strictEqual(getConfig("sortOnSave"), false);
    assert.deepStrictEqual(getConfig("ignoredFiles"), []);
    assert.deepStrictEqual(getConfig("manualOrder"), []);
  });

  test("returns undefined for an unknown section", () => {
    assert.strictEqual(getConfig("doesNotExist"), undefined);
  });

  test("writes and clears a setting", async () => {
    await setConfig("sortingStrategy", "alphabetical");
    assert.strictEqual(getConfig("sortingStrategy"), "alphabetical");

    await setConfig("ignoredFiles", ["sample.css"]);
    assert.deepStrictEqual(getConfig("ignoredFiles"), ["sample.css"]);

    await setConfig("sortingStrategy", undefined);
    assert.strictEqual(getConfig("sortingStrategy"), "concentric-css");
  });
});
