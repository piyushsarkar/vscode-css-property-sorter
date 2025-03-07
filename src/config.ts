import { workspace } from 'vscode';

export const getConfig = <T>(section: string): T | undefined => {
  return workspace.getConfiguration('sortcss').get(section);
};

export const setConfig = async <T>(section: string, value: T, configurationTarget = true) => {
  return await workspace.getConfiguration('sortcss').update(section, value, configurationTarget);
};
