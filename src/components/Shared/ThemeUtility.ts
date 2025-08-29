import {Theme} from "../../constants/data/data.ts";
import {TOMCAT_SERVER_URL} from "../../constants/router/router.tsx";

export const fetchThemes = async () : Promise<Theme[]> => {
    const response = await fetch(TOMCAT_SERVER_URL + '/api/themes');
    return await response.json();
}

export const switchTheme = (props: { themeId: number }) => {
  if (props.themeId === 1) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else if (props.themeId === 2) {
    document.documentElement.setAttribute("data-theme", "light");
  }
}
