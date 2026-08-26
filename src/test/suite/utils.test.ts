import * as assert from "assert";
import { Selection, workspace } from "vscode";
import { findStyleTagRanges, getStyleLangFromSelection } from "../../utils";

const selectionOf = (text: string, needle: string) => {
  const index = text.indexOf(needle);
  const before = text.slice(0, index);
  const line = before.split("\n").length - 1;
  const character = before.length - (before.lastIndexOf("\n") + 1);
  return new Selection(line, character, line, character + needle.length);
};

suite("Utils Test Suite", () => {
  suite("findStyleTagRanges", () => {
    test("returns no range when there is no style tag", () => {
      assert.deepStrictEqual(findStyleTagRanges("<div>hello</div>"), []);
    });

    test("returns the offsets of the style tag content", () => {
      const text = "<style>a{color:red}</style>";
      const [range] = findStyleTagRanges(text);

      assert.strictEqual(text.slice(range.start, range.end), "a{color:red}");
      assert.strictEqual(range.lang, undefined);
    });

    test("reads the lang attribute", () => {
      const [range] = findStyleTagRanges(`<style lang="scss">a{color:red}</style>`);

      assert.strictEqual(range.lang, "scss");
    });

    test("reads the lang attribute written with single quotes", () => {
      const [range] = findStyleTagRanges(`<style lang='less'>a{color:red}</style>`);

      assert.strictEqual(range.lang, "less");
    });

    test("ignores other attributes on the style tag", () => {
      const [range] = findStyleTagRanges(`<style scoped type="text/css">a{color:red}</style>`);

      assert.strictEqual(range.lang, undefined);
    });

    test("returns multiple style tags in reverse document order", () => {
      const text = [
        `<style lang="scss">a{color:red}</style>`,
        "<div></div>",
        `<style lang="less">b{color:blue}</style>`,
      ].join("\n");

      const ranges = findStyleTagRanges(text);

      assert.strictEqual(ranges.length, 2);
      assert.deepStrictEqual(
        ranges.map((range) => range.lang),
        ["less", "scss"],
      );
      assert.strictEqual(text.slice(ranges[0].start, ranges[0].end), "b{color:blue}");
      assert.strictEqual(text.slice(ranges[1].start, ranges[1].end), "a{color:red}");
    });

    test("handles a multi-line style tag", () => {
      const text = [
        "<template></template>",
        "<style>",
        "a {",
        "  color: red;",
        "}",
        "</style>",
      ].join("\n");
      const [range] = findStyleTagRanges(text);

      assert.strictEqual(text.slice(range.start, range.end), "\na {\n  color: red;\n}\n");
    });
  });

  /* html stands in for vue/svelte/astro: their language ids are not registered in the test host */
  suite("getStyleLangFromSelection", () => {
    test("returns the lang of the style tag containing the selection", async () => {
      const content = [
        "<template><p>hi</p></template>",
        `<style lang="scss">`,
        "a { color: red; }",
        "</style>",
      ].join("\n");
      const document = await workspace.openTextDocument({ language: "html", content });

      const lang = getStyleLangFromSelection(document, selectionOf(content, "a { color: red; }"));

      assert.strictEqual(lang, "scss");
    });

    test("returns undefined when the style tag has no lang", async () => {
      const content = ["<style>", "a { color: red; }", "</style>"].join("\n");
      const document = await workspace.openTextDocument({ language: "html", content });

      const lang = getStyleLangFromSelection(document, selectionOf(content, "a { color: red; }"));

      assert.strictEqual(lang, undefined);
    });

    test("returns undefined when the selection is outside every style tag", async () => {
      const content = [
        "<template><p>hi</p></template>",
        `<style lang="scss">`,
        "a { color: red; }",
        "</style>",
      ].join("\n");
      const document = await workspace.openTextDocument({ language: "html", content });

      const lang = getStyleLangFromSelection(document, selectionOf(content, "<p>hi</p>"));

      assert.strictEqual(lang, undefined);
    });

    test("returns undefined for an empty selection", async () => {
      const content = [`<style lang="scss">`, "a { color: red; }", "</style>"].join("\n");
      const document = await workspace.openTextDocument({ language: "html", content });

      assert.strictEqual(getStyleLangFromSelection(document, new Selection(1, 0, 1, 0)), undefined);
      assert.strictEqual(getStyleLangFromSelection(document), undefined);
    });

    test("returns undefined for a plain css document", async () => {
      const content = "a { color: red; }";
      const document = await workspace.openTextDocument({ language: "css", content });

      const lang = getStyleLangFromSelection(document, selectionOf(content, "color: red;"));

      assert.strictEqual(lang, undefined);
    });
  });
});
