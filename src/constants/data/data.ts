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
  alwaysAppliedTemplateFront?: string | null;
  alwaysAppliedTemplateBack?: string | null;
  presentationConfigJson?: string | null;
  ttsEnabled?: boolean;
  ttsModelId?: string | null;
  ttsConfigJson?: string | null;
}

export interface Card {
  id: number | null;
  front: string;
  back: string;
  tags?: Tag[];
  deck?: Deck;
  ttsConfigJson?: string | null;
}

export interface DeckTtsSettings {
  ttsEnabled: boolean;
  ttsModelId?: string | null;
  ttsConfigJson?: string | null;
}

export interface TtsPlaybackItem {
  target: string;
  variant: string;
  label: string;
  language?: string | null;
  textSource?: string | null;
  text: string;
  displaySide: "FRONT" | "BACK";
  modelId?: string | null;
  audioId?: number | null;
  audioUrl?: string | null;
  cached: boolean;
}

export interface TtsAudioResponse {
  id: number;
  cardId: number;
  deckId: number;
  cacheKey: string;
  contentType: string;
  generatedAt: number;
  modelId: string;
  target?: string | null;
  variant?: string | null;
  language?: string | null;
  textSource?: string | null;
  resolvedText?: string | null;
  voice?: string | null;
  speed?: number | null;
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
