import * as assert from "assert";
import { commands, extensions, window, workspace } from "vscode";

const extensionId = "piyushsarkar.sort-css-properties";

suite("Web Extension Test Suite", () => {
  window.showInformationMessage("Start all tests.");

  test("the extension is installed", () => {
    assert.ok(extensions.getExtension(extensionId));
  });

  test("the extension activates for a css document", async () => {
    const extension = extensions.getExtension(extensionId);
    await workspace.openTextDocument({ language: "css", content: "a { color: red; }" });
    await extension?.activate();

    assert.strictEqual(extension?.isActive, true);
  });

  test("the contributed commands are registered", async () => {
    await extensions.getExtension(extensionId)?.activate();
    const registered = await commands.getCommands(true);

    assert.ok(registered.includes("sortcss.run"));
    assert.ok(registered.includes("toggle-sort-on-save"));
  });

  test("sortcss.run sorts the active editor", async () => {
    await workspace.getConfiguration("sortcss").update("sortingStrategy", "alphabetical", true);
    const document = await workspace.openTextDocument({
      language: "css",
      content: "a { color: red; background: blue; }",
    });
    await window.showTextDocument(document);

    const edited = new Promise<void>((resolve) => {
      const listener = workspace.onDidChangeTextDocument((event) => {
        if (event.document !== document) return;
        listener.dispose();
        resolve();
      });
    });

    await commands.executeCommand("sortcss.run");
    await edited;

    assert.strictEqual(document.getText(), "a { background: blue; color: red; }");

    await workspace.getConfiguration("sortcss").update("sortingStrategy", undefined, true);
    await commands.executeCommand("workbench.action.closeAllEditors");
  });
});
