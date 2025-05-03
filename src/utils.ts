import { type Range, type Selection, type TextDocument } from "vscode";
import { supportedNonCssFiles } from "./config";

type StyleTagInfo = {
  start: number;
  end: number;
  lang?: string;
};

export const findStyleTagRanges = (text: string): StyleTagInfo[] => {
  const ranges: StyleTagInfo[] = [];
  const styleTagRegex = /<style([^>]*?)>([\s\S]*?)<\/style>/g;
  let match;

  while ((match = styleTagRegex.exec(text)) !== null) {
    const attributes = match[1];
    const langMatch = attributes.match(/lang=["']([^"']+)["']/);
    ranges.push({
      start: match.index + match[0].indexOf(">") + 1,
      end: match.index + match[0].length - "</style>".length,
      lang: langMatch ? langMatch[1] : undefined,
    });
  }

  return ranges.reverse();
};

export const getStyleLangFromSelection = (
  textDocument: TextDocument,
  selection?: Selection | Range,
) => {
  if (supportedNonCssFiles.has(textDocument.languageId)) {
    if (selection && !selection.isEmpty) {
      const selectionStart = textDocument.offsetAt(selection.start);
      const styleRanges = findStyleTagRanges(textDocument.getText());
      const styleTag = styleRanges.find(
        (range) => selectionStart >= range.start && selectionStart <= range.end,
      );
      return styleTag?.lang;
    }
  }
};
