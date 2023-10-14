export interface Card {
    suit: 'clubs' | 'diamonds' | 'spades' | 'hearts';
    card: string;
    tile: number;
    number: number;
}

export type PlayerState = 'DRAWING' | 'SELECTING' | 'PLAYING' | 'DISCARDING' | 'WAITING';