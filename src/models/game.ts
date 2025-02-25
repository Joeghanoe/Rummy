import { GameState, type Meld } from "../types";
import { Card } from "./card";
import { Deck } from "./deck";
import { Player } from "./player";

export class Game {
  public id: string;
  public players: Player[] = [];
  public deck: Deck;
  public discardPile: Card[] = [];
  public currentPlayerIndex: number = 0;
  public state: GameState = GameState.WAITING;
  public winner: Player | null = null;
  public cardsPerPlayer: number = 7; // Configurable

  constructor(id: string) {
    this.id = id;
    this.deck = new Deck();
  }

  addPlayer(player: Player): boolean {
    // Typically limit to 2-6 players
    if (this.players.length >= 6 || this.state !== GameState.WAITING) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  start(): boolean {
    if (this.players.length < 2 || this.state !== GameState.WAITING) {
      return false;
    }

    this.state = GameState.DEALING;
    this.deck = new Deck();
    this.discardPile = [];

    // Deal cards to players
    for (let i = 0; i < this.cardsPerPlayer; i++) {
      for (const player of this.players) {
        const card = this.deck.draw();
        if (card) {
          player.addCard(card);
        }
      }
    }

    // Place first card on discard pile
    const firstDiscard = this.deck.draw();
    if (firstDiscard) {
      this.discardPile.push(firstDiscard);
    }

    this.currentPlayerIndex = 0;
    this.state = GameState.PLAYING;
    return true;
  }

  drawFromDeck(playerId: string): Card | null {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId || this.state !== GameState.PLAYING) {
      return null;
    }

    const card = this.deck.draw();
    if (card) {
      player.addCard(card);
      return card;
    }

    // If deck is empty, reshuffle discard pile except top card
    if (this.discardPile.length > 1) {
      const topCard = this.discardPile.pop()!;
      this.deck = new Deck();
      this.discardPile = [topCard];
      return this.drawFromDeck(playerId);
    }

    return null;
  }

  // Check if a player can form a valid meld with a specific card
  canFormMeldWithCards(playerId: string, selectedCards: Card[]): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    // Combine the player's current hand with the selected discard cards.
    // (You may want to keep the original hand intact, hence using a copy.)
    const combinedCards = [...player.hand, ...selectedCards];

    // Check for a valid set: three or more cards of the same rank.
    // We group by rank.
    const rankGroups = combinedCards.reduce((groups, card) => {
      if (!groups[card.rank]) groups[card.rank] = [];
      groups[card.rank].push(card);
      return groups;
    }, {} as Record<string, Card[]>);

    for (const rank in rankGroups) {
      if (rankGroups[rank].length >= 3) {
        return true;
      }
    }

    // Check for a valid run: three or more sequential cards in the same suit.
    // We need to group by suit.
    const suitGroups = combinedCards.reduce((groups, card) => {
      if (!groups[card.suit]) groups[card.suit] = [];
      groups[card.suit].push(card);
      return groups;
    }, {} as Record<string, Card[]>);

    // For each suit, sort by card value then check for sequences.
    for (const suit in suitGroups) {
      const cardsOfSuit = suitGroups[suit].sort((a, b) => a.getValue() - b.getValue());

      // Iterate and check if any sequence of 3+ exists.
      let count = 1;
      for (let i = 1; i < cardsOfSuit.length; i++) {
        if (cardsOfSuit[i].getValue() === cardsOfSuit[i - 1].getValue() + 1) {
          count++;
          if (count >= 3) return true;
        } else if (cardsOfSuit[i].getValue() === cardsOfSuit[i - 1].getValue()) {
          // Duplicate card: skip this card.
          continue;
        } else {
          count = 1; // Reset count if not sequential
        }
      }
    }

    return false;
  }

  private isSequential(cards: Card[]): boolean {
    if (cards.length < 2) return true;

    // Sort by value
    const sortedCards = [...cards].sort((a, b) => a.getValue() - b.getValue());

    // Check if sequential
    for (let i = 1; i < sortedCards.length; i++) {
      if (sortedCards[i].getValue() !== sortedCards[i - 1].getValue() + 1) {
        return false;
      }
    }
    return true;
  }

  // Modify drawFromDiscard to use our new validation.
  drawFromDiscard(playerId: string, cardIndex?: number): Card | null {
    const player = this.getCurrentPlayer();
    if (
      !player ||
      player.id !== playerId ||
      this.state !== GameState.PLAYING ||
      this.discardPile.length === 0
    ) {
      return null;
    }

    // Determine indexToTake from discard pile (default to top card)
    const indexToTake = cardIndex !== undefined ? cardIndex : this.discardPile.length - 1;

    // Validate the index
    if (indexToTake < 0 || indexToTake >= this.discardPile.length) {
      return null;
    }

    // If taking the top card, no meld validation is needed.
    if (indexToTake === this.discardPile.length - 1) {
      const card = this.discardPile.pop()!;
      player.addCard(card);
      return card;
    }

    // Get the selected cards from the discard pile (the selected one and above):
    const selectedCards = this.discardPile.slice(indexToTake);

    // Validate if the combination of selected cards and player's hand
    // allows forming at least one meld.
    if (!this.canFormMeldWithCards(playerId, selectedCards)) {
      return null; // If not valid, disallow the pickup.
    }

    // If validation passes, remove the selected cards from the discard pile
    // and add them to the player's hand.
    const takenCards = this.discardPile.splice(indexToTake);
    takenCards.forEach(card => player.addCard(card));

    // Return the first card the player selected.
    return selectedCards[0];
  }

  discard(playerId: string, cardIndex: number): Card | null {
    const player = this.getCurrentPlayer();
    if (
      !player ||
      player.id !== playerId ||
      this.state !== GameState.PLAYING ||
      cardIndex < 0 ||
      cardIndex >= player.hand.length
    ) {
      return null;
    }

    const card = player.removeCard(cardIndex);
    if (card) {
      this.discardPile.push(card);
      this.nextTurn();
      return card;
    }
    return null;
  }

  declareWinner(playerId: string, melds: Meld[]): boolean {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || this.state !== GameState.PLAYING) {
      return false;
    }

    // Validate that all cards are used in melds
    const meldCards = melds.flatMap((meld) => meld.cards);
    if (meldCards.length !== player.hand.length - 1) {
      return false;
    }

    // Validate each meld
    for (const meld of melds) {
      if (!this.isValidMeld(meld)) {
        return false;
      }
    }

    this.winner = player;
    this.state = GameState.FINISHED;
    return true;
  }

  private isValidMeld(meld: Meld): boolean {
    if (meld.cards.length < 3) {
      return false;
    }

    if (meld.type === "set") {
      // All cards must have the same rank
      const rank = meld.cards[0].rank;
      return meld.cards.every((card) => card.rank === rank);
    } else if (meld.type === "run") {
      // Cards must be sequential and same suit
      const suit = meld.cards[0].suit;
      if (!meld.cards.every((card) => card.suit === suit)) {
        return false;
      }

      // Sort by value
      const sortedCards = [...meld.cards].sort(
        (a, b) => a.getValue() - b.getValue()
      );

      // Check if sequential
      for (let i = 1; i < sortedCards.length; i++) {
        if (sortedCards[i].getValue() !== sortedCards[i - 1].getValue() + 1) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  private nextTurn(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  getCurrentPlayer(): Player | null {
    if (this.state !== GameState.PLAYING) {
      return null;
    }
    return this.players[this.currentPlayerIndex];
  }

  getGameState(forPlayerId?: string): any {
    const state = {
      id: this.id,
      state: this.state,
      currentPlayer: this.getCurrentPlayer()?.id,
      // Send the entire discard pile instead of just the top card
      discardPile: this.discardPile,
      deckCount: this.deck.remainingCards(),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        // Only include actual cards for the requesting player
        hand: p.id === forPlayerId ? p.hand : undefined,
      })),
      winner: this.winner?.id,
    };
    return state;
  }
}
