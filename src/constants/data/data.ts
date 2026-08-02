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
  ttsEnabled?: boolean;
  ttsModelId?: string | null;
  ttsDefaultPresetId?: number | null;
}

export interface Card {
  id: number | null;
  front: string;
  back: string;
  tags?: Tag[];
  deck?: Deck;
  ttsText?: string | null;
  ttsPresetId?: number | null;
  ttsDisplaySide?: "FRONT" | "BACK" | null;
}

export interface TtsPreset {
  id: number | null;
  name: string;
  speaker?: string | null;
  language?: string | null;
  caption?: string | null;
  advancedConfigJson?: string | null;
  sortOrder: number;
}

export interface DeckTtsSettings {
  ttsEnabled: boolean;
  ttsModelId?: string | null;
  ttsDefaultPresetId?: number | null;
  presets: TtsPreset[];
}

export interface TtsAudioResponse {
  id: number;
  cardId: number;
  deckId: number;
  presetId?: number | null;
  cacheKey: string;
  contentType: string;
  generatedAt: number;
  modelId: string;
  presetName?: string | null;
  audioUrl: string;
  cached: boolean;
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

export interface SrsCardResponse {
  card: Card;
  deck: Deck; // Include deck separately to avoid JSON serialization issues
  nextReviewAt?: string;
  intervalDays?: number;
  repetitions?: number;
  isNew: boolean;
}

export interface SrsStatsResponse {
  totalCards: number;
  reviewedCards: number;
  newCards: number;
  dueCards: number;
}
