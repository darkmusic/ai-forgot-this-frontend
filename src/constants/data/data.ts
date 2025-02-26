
export interface User {
    id: number
    name: string;
    username: string;
    avatar?: string;
    isAdmin?: boolean;
}

export interface AiModel {
    id: number;
    name: string;
    model: string;
}

export interface Deck {
    id: number;
    name: string;
    description: string;
    cards: Card[];
    tags?: Tag[];
}

export interface Card {
    id: number;
    front: string;
    back: string;
    tags?: Tag[];
    deck?: Deck;
}

export interface Tag {
    id: number;
    name: string;
}

export const USERS: User[] = [
    {
        id: 1,
        name: 'John Doe',
        username: 'johndoe',
        avatar: '/vite.svg',
        isAdmin: true
    },
    {
        id: 2,
        name: 'Jane Doe',
        username: 'janedoe',
        avatar: '/vite.svg',
        isAdmin: false
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
];

export const TAGS: Tag[] = [
    {
        id: 1,
        name: 'Japanese'
    },
    {
        id: 2,
        name: 'Marathi'
    },
];

export const CARDS_JAPANESE: Card[] = [
    {
        id: 1,
        front: 'Front of Japanese Card 1',
        back: 'Back of Japanese Card 1',
        tags: [TAGS[0]],
    },
    {
        id: 2,
        front: 'Front of Japanese Card 2',
        back: 'Back of Japanese Card 2',
        tags: [TAGS[0]]
    },
];

export const CARDS_MARATHI: Card[] = [
    {
        id: 1,
        front: 'Front of Marathi Card 1',
        back: 'Back of Marathi Card 1',
        tags: [TAGS[1]],
    },
    {
        id: 2,
        front: 'Front of Marathi Card 2',
        back: 'Back of Marathi Card 2',
        tags: [TAGS[1]]
    },
];

export const DECKS: Deck[] = [
    {
        id: 1,
        name: 'Japanese I',
        description: 'Japanese N5 Vocabulary',
        cards: CARDS_JAPANESE,
        tags: [TAGS[0]]
    },
    {
        id: 2,
        name: 'Marathi I',
        description: 'Basic Marathi Vocabulary',
        cards: CARDS_MARATHI,
        tags: [TAGS[1]]
    },
];

CARDS_JAPANESE[0].deck = DECKS[0];
CARDS_JAPANESE[1].deck = DECKS[0];
CARDS_MARATHI[0].deck = DECKS[1];
CARDS_MARATHI[1].deck = DECKS[1];