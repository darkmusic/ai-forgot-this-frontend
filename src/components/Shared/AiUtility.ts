import {AiModel} from "../../constants/data/data.ts";
import { getJson } from "../../lib/api";

export const fetchModels = async () : Promise<AiModel[]> => {
    return await getJson<AiModel[]>(`/api/ai/models`);
}
