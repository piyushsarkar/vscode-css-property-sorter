import cssDeclarationSorter from "css-declaration-sorter";
import postcss from "postcss";
import * as postcssLess from "postcss-less";
import * as postcssScss from "postcss-scss";

export type SortOrder = "alphabetical" | "concentric-css" | "smacss";
type SortFunction = (propertyNameA: string, propertyNameB: string) => -1 | 0 | 1;

export const getPostcssSyntax = (languageId?: string) => {
  switch (languageId) {
    case "scss":
    case "sass":
      return postcssScss;
    case "less":
      return postcssLess;
    default:
      return undefined;
  }
};

export const sorter = async (
  text: string,
  order: SortOrder | SortFunction | undefined,
  language: string | undefined,
  range?: { start: number; end: number },
) => {
  try {
    const syntax = getPostcssSyntax(language);
    const { css } = await postcss([cssDeclarationSorter({ order })]).process(text, {
      from: undefined,
      syntax,
    });
    return {
      output: css,
      originalOutput: text,
      range,
    };
  } catch (error) {
    console.error(error);
    return {
      output: text,
      originalOutput: text,
      range,
    };
  }
};
