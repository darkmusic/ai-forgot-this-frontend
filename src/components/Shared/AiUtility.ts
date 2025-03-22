import {AiModel} from "../../constants/data/data.ts";

export const fetchModels = async () : Promise<AiModel[]> => {
    const response = await fetch('/api/ai/models');
    return await response.json();
}
