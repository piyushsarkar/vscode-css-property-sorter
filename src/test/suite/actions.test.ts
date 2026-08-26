import * as assert from "assert";
import type { TextDocument, TextDocumentWillSaveEvent, TextEdit } from "vscode";
import { Selection, TextDocumentSaveReason, commands, window, workspace } from "vscode";
import { sortCss, sortOnSave, toggleSortOnSave } from "../../actions";
import { getConfig, setConfig } from "../../config";

const openEditor = async (language: string, content: string, selection?: Selection) => {
  const document = await workspace.openTextDocument({ language, content });
  const editor = await window.showTextDocument(document);
  if (selection) editor.selection = selection;
  return editor;
};

const runSortOnSave = async (document: TextDocument) => {
  let pending: Thenable<TextEdit[]> | undefined;
  sortOnSave({
    document,
    reason: TextDocumentSaveReason.Manual,
    waitUntil: (value: Thenable<TextEdit[]>) => {
      pending = value;
    },
  } as unknown as TextDocumentWillSaveEvent);
  return pending ? await pending : undefined;
};

const resetConfig = async () => {
  await setConfig("sortingStrategy", undefined);
  await setConfig("manualOrder", undefined);
  await setConfig("ignoredFiles", undefined);
  await setConfig("sortOnSave", undefined);
};

/* configuration updates land asynchronously, so wait for the change event */
const nextConfigChange = (section: string) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(finish, 2000);
    const listener = workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`sortcss.${section}`)) finish();
    });

    function finish() {
      clearTimeout(timer);
      listener?.dispose();
      resolve();
    }
  });

suite("Actions Test Suite", () => {
  setup(async () => {
    await resetConfig();
    await setConfig("sortingStrategy", "alphabetical");
  });

  teardown(async () => {
    await resetConfig();
    await commands.executeCommand("workbench.action.closeAllEditors");
  });

  suite("sortCss", () => {
    test("sorts a whole css document", async () => {
      const editor = await openEditor(
        "css",
        ["a {", "  color: red;", "  background: blue;", "}", ""].join("\n"),
      );

      await sortCss(editor);

      assert.strictEqual(
        editor.document.getText(),
        ["a {", "  background: blue;", "  color: red;", "}", ""].join("\n"),
      );
    });

    test("sorts only the selected declarations", async () => {
      const content = [
        "a {",
        "  color: red;",
        "  background: blue;",
        "}",
        "b {",
        "  width: 1px;",
        "  height: 2px;",
        "}",
      ].join("\n");
      const editor = await openEditor("css", content, new Selection(4, 0, 7, 1));

      await sortCss(editor);

      assert.strictEqual(
        editor.document.getText(),
        [
          "a {",
          "  color: red;",
          "  background: blue;",
          "}",
          "b {",
          "  height: 2px;",
          "  width: 1px;",
          "}",
        ].join("\n"),
      );
    });

    test("sorts an scss document", async () => {
      const editor = await openEditor(
        "scss",
        [".card {", "  // comment", "  color: red;", "  background: blue;", "}"].join("\n"),
      );

      await sortCss(editor);

      /* css-declaration-sorter keeps a comment attached to the declaration below it */
      assert.strictEqual(
        editor.document.getText(),
        [".card {", "  background: blue;", "  // comment", "  color: red;", "}"].join("\n"),
      );
    });

    test("sorts every style tag of a markup document", async () => {
      const editor = await openEditor(
        "html",
        [
          "<template><p>hi</p></template>",
          `<style lang="scss">`,
          ".a { color: red; background: blue; }",
          "</style>",
          "<style>",
          ".b { width: 1px; height: 2px; }",
          "</style>",
        ].join("\n"),
      );

      await sortCss(editor);

      const text = editor.document.getText();
      assert.ok(text.includes(".a { background: blue; color: red; }"), text);
      assert.ok(text.includes(".b { height: 2px; width: 1px; }"), text);
      assert.ok(text.includes("<template><p>hi</p></template>"), text);
    });

    test("leaves a html document without style tags untouched", async () => {
      const content = "<div>hello</div>";
      const editor = await openEditor("html", content);

      await sortCss(editor);

      assert.strictEqual(editor.document.getText(), content);
    });

    test("leaves an already sorted document untouched", async () => {
      const content = ["a {", "  background: blue;", "  color: red;", "}", ""].join("\n");
      const editor = await openEditor("css", content);

      await sortCss(editor);

      assert.strictEqual(editor.document.getText(), content);
    });

    test("skips files matching the ignoredFiles setting", async () => {
      const content = ["a {", "  color: red;", "  background: blue;", "}", ""].join("\n");
      const editor = await openEditor("css", content);
      await setConfig("ignoredFiles", [editor.document.uri.path]);

      await sortCss(editor);

      assert.strictEqual(editor.document.getText(), content);
    });

    test("uses the manual order when the strategy is manual", async () => {
      await setConfig("sortingStrategy", "manual");
      await setConfig("manualOrder", ["color", "background"]);
      const editor = await openEditor(
        "css",
        ["a {", "  background: blue;", "  color: red;", "}", ""].join("\n"),
      );

      await sortCss(editor);

      assert.strictEqual(
        editor.document.getText(),
        ["a {", "  color: red;", "  background: blue;", "}", ""].join("\n"),
      );
    });

    test("leaves unparsable css untouched", async () => {
      const content = "a { color: red;";
      const editor = await openEditor("css", content);

      await sortCss(editor);

      assert.strictEqual(editor.document.getText(), content);
    });
  });

  suite("sortOnSave", () => {
    test("does nothing when sortOnSave is disabled", async () => {
      await setConfig("sortOnSave", false);
      const document = await workspace.openTextDocument({
        language: "css",
        content: "a { color: red; background: blue; }",
      });

      assert.strictEqual(await runSortOnSave(document), undefined);
    });

    test("does nothing for an unsupported language", async () => {
      await setConfig("sortOnSave", true);
      const document = await workspace.openTextDocument({
        language: "javascript",
        content: "const a = 1;",
      });

      assert.strictEqual(await runSortOnSave(document), undefined);
    });

    test("returns an edit for a css document", async () => {
      await setConfig("sortOnSave", true);
      const document = await workspace.openTextDocument({
        language: "css",
        content: "a { color: red; background: blue; }",
      });

      const edits = await runSortOnSave(document);

      assert.strictEqual(edits?.length, 1);
      assert.strictEqual(edits?.[0].newText, "a { background: blue; color: red; }");
    });

    test("returns no edit when the document is already sorted", async () => {
      await setConfig("sortOnSave", true);
      const document = await workspace.openTextDocument({
        language: "css",
        content: "a { background: blue; color: red; }",
      });

      assert.deepStrictEqual(await runSortOnSave(document), []);
    });
  });

  suite("toggleSortOnSave", () => {
    test("turns the setting on and back off", async () => {
      await setConfig("sortOnSave", false);

      let changed = nextConfigChange("sortOnSave");
      toggleSortOnSave();
      await changed;
      assert.strictEqual(getConfig("sortOnSave"), true);

      changed = nextConfigChange("sortOnSave");
      toggleSortOnSave();
      await changed;
      assert.strictEqual(getConfig("sortOnSave"), false);
    });
  });
});
