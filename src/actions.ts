import cssDeclarationSorter from "css-declaration-sorter";
import postcss from "postcss";
import * as postcssLess from "postcss-less";
import * as postcssScss from "postcss-scss";
import type { Selection, TextDocumentWillSaveEvent, TextEditor } from "vscode";
import { Range, window } from "vscode";
import { getConfig, setConfig } from "./config";

export const sortCss = async (textEditor: TextEditor) => {
  const currentFile = textEditor.document;

  /* check for ignored files and return if found */
  const ignoredFiles: string[] = getConfig("ignoredFiles") || [];
  if (ignoredFiles.some((val) => textEditor.document.uri.path.includes(val))) return;
  const syntax =
    currentFile.languageId === "scss" || currentFile.languageId === "sass"
      ? postcssScss
      : currentFile.languageId === "less"
      ? postcssLess
      : undefined;

  const manualOrder: string[] = getConfig("manualOrder") || [];
  const manualOrderCompareFunction = (a: string, b: string) =>
    (manualOrder.indexOf(a) - manualOrder.indexOf(b)) as -1 | 0 | 1;

  const order =
    getConfig("sortingStrategy") === "manual"
      ? manualOrderCompareFunction
      : getConfig<"alphabetical" | "concentric-css" | "smacss">("sortingStrategy");

  let selection: Selection | Range = textEditor.selection;
  if (selection.isEmpty) {
    selection = new Range(
      currentFile.lineAt(0).range.start,
      currentFile.lineAt(currentFile.lineCount - 1).range.end
    );
  }

  const text = currentFile.getText(selection);
  const sortedOutput = await postcss([cssDeclarationSorter({ order })])
    .process(text, { from: undefined, syntax })
    .then((result) => result.css)
    .catch(() => {
      return text;
    });

  if (sortedOutput === text) {
    return;
  }

  textEditor.edit((editBuilder) => {
    editBuilder.replace(selection, sortedOutput);
  });
};

export const sortOnSave = (e: TextDocumentWillSaveEvent) => {
  if (getConfig("sortOnSave") && ["css", "less", "scss"].includes(e.document.languageId)) {
    const editor = window.activeTextEditor;
    if (editor) {
      sortCss(editor);
    }
  }
};

export const toggleSortOnSave = () => {
  const currentConfig = getConfig("sortOnSave");
  setConfig("sortOnSave", !currentConfig || undefined, true);
  window.showInformationMessage(
    `Sort CSS properties on save is turned ${!currentConfig ? "on" : "off"}.`
  );
};
