import { workspace } from "vscode";

export const getConfig = <T>(section: string): T | undefined => {
  return workspace.getConfiguration("sortcss").get(section);
};

export const setConfig = async (section: string, value: any, configurationTarget = true) => {
  return await workspace.getConfiguration("sortcss").update(section, value, configurationTarget);
};
