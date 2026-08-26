import * as assert from "assert";
import { getPostcssSyntax, sorter, type SortOrder } from "../../sorter";

const declarationOrder = (css: string) =>
  [...css.matchAll(/^\s*([\w-]+)\s*:/gm)].map((match) => match[1]);

suite("Sorter Test Suite", () => {
  suite("getPostcssSyntax", () => {
    test("returns the same syntax for scss and sass", () => {
      assert.strictEqual(typeof getPostcssSyntax("scss")?.parse, "function");
      assert.strictEqual(getPostcssSyntax("scss"), getPostcssSyntax("sass"));
    });

    test("returns a dedicated syntax for less", () => {
      assert.strictEqual(typeof getPostcssSyntax("less")?.parse, "function");
      assert.notStrictEqual(getPostcssSyntax("less"), getPostcssSyntax("scss"));
    });

    test("returns undefined for css and unknown languages", () => {
      assert.strictEqual(getPostcssSyntax("css"), undefined);
      assert.strictEqual(getPostcssSyntax("html"), undefined);
      assert.strictEqual(getPostcssSyntax(undefined), undefined);
    });
  });

  suite("sorter", () => {
    test("sorts declarations alphabetically", async () => {
      const input = ["a {", "  color: red;", "  background: blue;", "}", ""].join("\n");
      const { output } = await sorter(input, "alphabetical", "css");

      assert.strictEqual(
        output,
        ["a {", "  background: blue;", "  color: red;", "}", ""].join("\n"),
      );
    });

    test("returns the original text alongside the sorted output", async () => {
      const input = "a { color: red; background: blue; }";
      const { output, originalOutput } = await sorter(input, "alphabetical", "css");

      assert.strictEqual(originalOutput, input);
      assert.notStrictEqual(output, input);
    });

    test("passes the given range straight through", async () => {
      const range = { start: 7, end: 19 };
      const { range: returnedRange } = await sorter(
        "a { color: red; }",
        "alphabetical",
        "css",
        range,
      );

      assert.deepStrictEqual(returnedRange, range);
    });

    test("keeps declarations untouched when they are already sorted", async () => {
      const input = ["a {", "  background: blue;", "  color: red;", "}", ""].join("\n");
      const { output } = await sorter(input, "alphabetical", "css");

      assert.strictEqual(output, input);
    });

    test("sorts layout before painting with concentric-css", async () => {
      const input = [
        "a {",
        "  color: red;",
        "  display: block;",
        "  position: absolute;",
        "}",
      ].join("\n");
      const { output } = await sorter(input, "concentric-css", "css");

      assert.deepStrictEqual(declarationOrder(output), ["display", "position", "color"]);
    });

    test("supports every built-in sorting strategy", async () => {
      const input = [
        "a {",
        "  color: red;",
        "  display: block;",
        "  position: absolute;",
        "}",
      ].join("\n");
      const orders: SortOrder[] = ["alphabetical", "concentric-css", "smacss", "frakto"];

      const results = await Promise.all(
        orders.map(async (order) => ({ order, ...(await sorter(input, order, "css")) })),
      );

      results.forEach(({ order, output }) => {
        const properties = declarationOrder(output);

        assert.strictEqual(properties.length, 3, `${order} dropped declarations`);
        assert.deepStrictEqual(
          [...properties].sort(),
          ["color", "display", "position"],
          `${order} changed the declaration set`,
        );
      });
    });

    test("sorts using a custom compare function", async () => {
      const manualOrder = ["color", "display", "position"];
      const compare = (a: string, b: string) =>
        (manualOrder.indexOf(a) - manualOrder.indexOf(b)) as -1 | 0 | 1;
      const input = [
        "a {",
        "  position: absolute;",
        "  display: block;",
        "  color: red;",
        "}",
      ].join("\n");

      const { output } = await sorter(input, compare, "css");

      assert.deepStrictEqual(declarationOrder(output), manualOrder);
    });

    test("falls back to alphabetical when no order is given", async () => {
      const input = ["a {", "  color: red;", "  background: blue;", "}"].join("\n");
      const { output } = await sorter(input, undefined, "css");

      assert.deepStrictEqual(declarationOrder(output), ["background", "color"]);
    });

    test("sorts scss with line comments and nesting", async () => {
      const input = [
        ".card {",
        "  // a scss comment",
        "  color: red;",
        "  background: blue;",
        "",
        "  .title {",
        "    z-index: 1;",
        "    align-items: center;",
        "  }",
        "}",
      ].join("\n");

      const { output } = await sorter(input, "alphabetical", "scss");

      assert.ok(output.includes("// a scss comment"));
      assert.deepStrictEqual(declarationOrder(output), [
        "background",
        "color",
        "align-items",
        "z-index",
      ]);
    });

    test("sorts less with line comments", async () => {
      const input = [
        ".card {",
        "  // a less comment",
        "  color: red;",
        "  background: blue;",
        "}",
      ].join("\n");

      const { output } = await sorter(input, "alphabetical", "less");

      assert.ok(output.includes("// a less comment"));
      assert.deepStrictEqual(declarationOrder(output), ["background", "color"]);
    });

    test("sorts each rule of a multi-rule stylesheet independently", async () => {
      const input = [
        "a {",
        "  color: red;",
        "  background: blue;",
        "}",
        "b {",
        "  width: 1px;",
        "  height: 2px;",
        "}",
      ].join("\n");

      const { output } = await sorter(input, "alphabetical", "css");

      assert.deepStrictEqual(declarationOrder(output), ["background", "color", "height", "width"]);
    });

    test("sorts declarations inside at-rules", async () => {
      const input = [
        "@media (min-width: 100px) {",
        "  a {",
        "    color: red;",
        "    background: blue;",
        "  }",
        "}",
      ].join("\n");

      const { output } = await sorter(input, "alphabetical", "css");

      assert.deepStrictEqual(declarationOrder(output), ["background", "color"]);
    });

    test("returns the input unchanged when it cannot be parsed", async () => {
      const input = "a { color: red;";
      const { output, originalOutput } = await sorter(input, "alphabetical", "css");

      assert.strictEqual(output, input);
      assert.strictEqual(originalOutput, input);
    });

    test("returns the input unchanged when scss syntax is used on broken input", async () => {
      const input = ".card { color: red;";
      const { output } = await sorter(input, "alphabetical", "scss");

      assert.strictEqual(output, input);
    });

    test("handles an empty stylesheet", async () => {
      const { output } = await sorter("", "alphabetical", "css");

      assert.strictEqual(output, "");
    });
  });
});
