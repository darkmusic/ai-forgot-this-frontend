import {Theme} from "../../constants/data/data.ts";
import { getJson } from "../../lib/api";

export const fetchThemes = async () : Promise<Theme[]> => {
  return await getJson<Theme[]>(`/api/themes`);
}

export const switchTheme = (props: { themeId: number }) => {
  if (props.themeId === 1) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else if (props.themeId === 2) {
    document.documentElement.setAttribute("data-theme", "light");
  }
}
