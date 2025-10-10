export interface User {
    id: number | null;
    name: string;
    username: string;
    password_hash?: string;
    admin?: boolean;
    active?: boolean;
    profile_pic_url?: string;
    decks?: Deck[];
    themeId?: number | null;
}

export interface Deck {
    id: number | null;
    name: string;
    description: string;
    cards: Card[];
    tags?: Tag[];
    user?: User;
    templateFront: string;
    templateBack: string;
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

export interface Theme {
    id: number;
    name: string;
    description: string;
    cssUrl: string;
    active: boolean;
}