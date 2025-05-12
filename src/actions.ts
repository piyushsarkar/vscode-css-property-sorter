import type { Selection, TextDocumentWillSaveEvent, TextEditor } from "vscode";
import { Range, window } from "vscode";
import { findStyleTagRanges, getStyleLangFromSelection } from "./utils";
import { getConfig, setConfig, supportedNonCssFiles, supportedLanguages } from "./config";
import { sorter, type SortOrder } from "./sorter";

export const sortCss = async (textEditor: TextEditor) => {
  const currentFile = textEditor.document;

  /* check for ignored files and return if found */
  const ignoredFiles: string[] = getConfig("ignoredFiles") || [];
  if (ignoredFiles.some((val) => textEditor.document.uri.path.includes(val))) return;

  const manualOrder: string[] = getConfig("manualOrder") || [];
  const manualOrderCompareFunction = (a: string, b: string) =>
    (manualOrder.indexOf(a) - manualOrder.indexOf(b)) as -1 | 0 | 1;

  const order =
    getConfig("sortingStrategy") === "manual"
      ? manualOrderCompareFunction
      : getConfig<SortOrder>("sortingStrategy");

  let selection: Selection | Range = textEditor.selection;
  const isFullDocument = selection.isEmpty;
  const isNonCssFile = supportedNonCssFiles.has(currentFile.languageId);

  if (isFullDocument) {
    selection = new Range(
      currentFile.lineAt(0).range.start,
      currentFile.lineAt(currentFile.lineCount - 1).range.end,
    );
  }

  const text = currentFile.getText(selection);
  let sortedOutput = text;

  if (isFullDocument && isNonCssFile) {
    const styleTagRanges = findStyleTagRanges(text);
    if (styleTagRanges.length === 0) return;

    const results = await Promise.all(
      styleTagRanges.map((range) => {
        const textInRange = text.slice(range.start, range.end);
        return sorter(textInRange, order, range.lang, range);
      }),
    );

    results.forEach((result) => {
      const { output, range, originalOutput } = result;
      if (range && output !== originalOutput) {
        sortedOutput = sortedOutput.slice(0, range.start) + output + sortedOutput.slice(range.end);
      }
    });
  } else {
    const language = isNonCssFile
      ? getStyleLangFromSelection(currentFile, selection)
      : currentFile.languageId;
    const { output } = await sorter(text, order, language);
    sortedOutput = output;
  }

  if (sortedOutput !== text) {
    await textEditor.edit((editBuilder) => {
      editBuilder.replace(selection, sortedOutput);
    });
  }
};

export const sortOnSave = async (e: TextDocumentWillSaveEvent) => {
  if (getConfig("sortOnSave") && supportedLanguages.has(e.document.languageId)) {
    const editor = window.visibleTextEditors.find(
      (ed) => ed.document.uri.toString() === e.document.uri.toString(),
    );
    if (editor) {
      await sortCss(editor);
      if (e.document.isDirty) {
        await e.document.save();
      }
    }
  }
};

export const toggleSortOnSave = () => {
  const currentConfig = getConfig("sortOnSave");
  setConfig("sortOnSave", !currentConfig || undefined, true);
  window.showInformationMessage(
    `Sort CSS properties on save is turned ${!currentConfig ? "on" : "off"}.`,
  );
};
