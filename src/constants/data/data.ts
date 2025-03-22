export interface User {
    id: number | null;
    name: string;
    username: string;
    password_hash?: string;
    admin?: boolean;
    active?: boolean;
    profile_pic_url?: string;
    decks?: Deck[];
}

export interface AiModel {
    id: number | null;
    name: string;
    model: string;
}

export interface Deck {
    id: number | null;
    name: string;
    description: string;
    cards: Card[];
    tags?: Tag[];
    user?: User;
}

export interface Card {
    id: number | null;
    front: string;
    back: string;
    tags?: Tag[];
    deck?: Deck;
}

export interface Tag {
    id: number | null;
    name: string;
}

export interface UserAuthResponse {
    authenticated: boolean;
    roles: string[];
    username: string;
}