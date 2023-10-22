export interface Card {
    suit: CardSuit;
    card: CardNumber;
    tile: number;
    number: number;
}

export type CardSuit = 'clubs' | 'diamonds' | 'spades' | 'hearts';
export type CardNumber = 'ace' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven' | 'eight' | 'nine' | 'ten' | 'jack' | 'queen' | 'king';

export type SubmittedCard = {
    cards: Card[];
}

export type PlayerState = 'DRAWING' | 'SELECTING' | 'PLAYING' | 'DISCARDING' | 'WAITING';