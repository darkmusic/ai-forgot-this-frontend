import {AiModel} from "../../constants/data/data.ts";
import {TOMCAT_SERVER_URL} from "../../constants/router/router.tsx";

export const fetchModels = async () : Promise<AiModel[]> => {
    const response = await fetch(TOMCAT_SERVER_URL + '/api/ai/models');
    return await response.json();
}
