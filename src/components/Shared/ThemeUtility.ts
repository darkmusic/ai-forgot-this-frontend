import {Theme} from "../../constants/data/data.ts";

export const fetchThemes = async () : Promise<Theme[]> => {
    const response = await fetch('/api/themes');
    return await response.json();
}

export const switchTheme = (props: { themeId: number }) => {
  if (props.themeId === 1) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else if (props.themeId === 2) {
    document.documentElement.setAttribute("data-theme", "light");
  }
}
