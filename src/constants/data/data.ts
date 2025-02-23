
export interface User {
    id: number
    name: string;
    username: string;
}

export interface AiModel {
    id: number;
    name: string;
    model: string;
}

export const USERS: User[] = [
    {
        id: 1,
        name: 'John Doe',
        username: 'johndoe'
    },
    {
        id: 2,
        name: 'Jane Doe',
        username: 'janedoe'
    },
    {
        id: 0,
        name: '<new>',
        username: '<new>'
    }
];

export const AI_MODELS : AiModel[] = [
    {
        id: 1,
        name: 'huggingface.co/bartowski/Qwen2-VL-7B-Instruct-GGUF:latest',
        model: 'huggingface.co/bartowski/Qwen2-VL-7B-Instruct-GGUF:latest'
    },
    {
        id: 2,
        name: 'llama2:latest',
        model: 'llama2:latest'
    },
    {
        id: 0,
        name: '<new>',
        model: '<new>'
    }
];