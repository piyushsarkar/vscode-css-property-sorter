import type { ExtensionContext, Disposable } from "vscode";
import { commands, workspace } from "vscode";
import { sortCss, toggleSortOnSave, sortOnSave } from "./actions";

let sortOnSaveListener: Disposable | undefined;
let sortOnSaveCommand: Disposable;
let sortCssCommand: Disposable;

// This method is called when your extension is activated
export function activate(context: ExtensionContext) {
  sortOnSaveListener = workspace.onWillSaveTextDocument((e) => sortOnSave(e));
  sortOnSaveCommand = commands.registerCommand("toggle-sort-on-save", toggleSortOnSave);
  sortCssCommand = commands.registerTextEditorCommand("sortcss.run", sortCss);
  context.subscriptions.push(sortOnSaveCommand, sortCssCommand, sortOnSaveListener);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (sortOnSaveListener) sortOnSaveListener.dispose();
  sortOnSaveCommand.dispose();
  sortCssCommand.dispose();
}
