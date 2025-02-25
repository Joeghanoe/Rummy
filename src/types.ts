import type { Card } from "./models/card";
import type { Player } from "./models/player";

export interface WebSocketData {
  gameId?: string;
  playerId?: string;
}

export interface WebSocketMessage {
  action: string;
  gameId?: string;
  playerName?: string;
  playerId?: string;
  cardIndex?: number;
  melds?: Meld[];
  discardIndex?: number;
}

export interface GameStateData {
  players: Player[];
  currentPlayer: string;
  discardPile: Card[];
  state: GameState;
  deckCount: number;
  winner: string;
}

export interface ActiveGame {
  id: string;
  playerCount: number;
  state: 'waiting' | 'active' | 'finished';
}

export interface BroadcastMessage {
  event: GameEvent | string;
  gameId?: string;
  playerId?: string;
  player?: {
    id: string;
    name: string;
  };
  gameState?: GameState;
  card?: Card;
  source?: string;
  melds?: Meld[];
  winner?: string;
  hand?: Card[];
  error?: string;
}

export enum GameState {
  WAITING = "waiting",
  DEALING = "dealing",
  PLAYING = "playing",
  FINISHED = "finished",
}

export enum GameEvent {
  GAME_CREATED = "game_created",
  PLAYER_JOINED = "player_joined",
  GAME_STARTED = "game_started",
  CARDS_DEALT = "cards_dealt",
  TURN_CHANGED = "turn_changed",
  CARD_DRAWN = "card_drawn",
  CARD_DISCARDED = "card_discarded",
  PLAYER_WENT_OUT = "player_went_out",
  GAME_ENDED = "game_ended",
}

export interface Meld {
  type: "set" | "run";
  cards: Card[];
}

export enum Suit {
  HEARTS = "hearts",
  DIAMONDS = "diamonds",
  CLUBS = "clubs",
  SPADES = "spades",
}

export enum Rank {
  ACE = "A",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "10",
  JACK = "J",
  QUEEN = "Q",
  KING = "K",
}