import { Card } from "./card";

export class Player {
  public hand: Card[] = [];
  
  constructor(public id: string, public name: string) {}

  addCard(card: Card): void {
    this.hand.push(card);
    // Sort cards for easier management
    this.sortHand();
  }

  removeCard(index: number): Card | undefined {
    if (index >= 0 && index < this.hand.length) {
      const card = this.hand[index];
      this.hand.splice(index, 1);
      return card;
    }
    return undefined;
  }

  private sortHand(): void {
    this.hand.sort((a, b) => {
      // First sort by suit
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      // Then by value
      return a.getValue() - b.getValue();
    });
  }
}
