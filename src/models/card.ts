import { Rank, Suit } from "../types";

export class Card {
  constructor(public suit: Suit, public rank: Rank) {}

  toString(): string {
    return `${this.rank}${this.suit.charAt(0).toUpperCase()}`;
  }

  // For comparing cards in runs
  getValue(): number {
    switch (this.rank) {
      case Rank.ACE:
        return 1;
      case Rank.JACK:
        return 11;
      case Rank.QUEEN:
        return 12;
      case Rank.KING:
        return 13;
      default:
        return parseInt(this.rank);
    }
  }
}
