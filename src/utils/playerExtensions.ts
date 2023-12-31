import { Card, CardNumber, PlayerState, SubmittedCard } from "../@types/game";

type PlayerExtensionsResult = {
    state: PlayerState,
    card?: Card,
    cards: Card[]
}

export abstract class PlayerExtensions {
    private static cardScores: { [key in CardNumber]: number } = {
        'two': 5,
        'three': 5,
        'four': 5,
        'five': 5,
        'six': 5,
        'seven': 5,
        'eight': 5,
        'nine': 5,
        'ten': 10,
        'jack': 10,
        'queen': 10,
        'king': 10,
        'ace': 15,
    }

    // Draws a card from the deck 
    static drawCard(cards: Card[], state: PlayerState, playerName: string): PlayerExtensionsResult {
        if (state !== 'DRAWING') {
            throw new Error(`${playerName} is not in the DRAWING state.`)
        }

        if (cards.length === 0) {
            throw new Error(`There are no cards to draw.`)
        }

        return {
            state: 'SELECTING',
            card: cards.pop(),
            cards: cards,
        }
    }

    // Selects a card from the player's hand and discards it
    static discard(cards: Card[], state: PlayerState, tile: number, playerName: string): PlayerExtensionsResult {
        if (state !== 'DISCARDING') {
            throw new Error(`${playerName} is not in the DISCARDING state.`)
        }

        // Find the card in the player's hand
        const currentCardIndex = cards.findIndex((card) => card.tile === tile);
        if ((currentCardIndex ?? -1) === -1) {
            throw new Error('Card not found');
        }

        // Remove the card from the player's hand
        const card = [...cards]
            .splice(currentCardIndex, 1)
            .sort((a, b) => {
                if (a.tile < b.tile) {
                    return -1
                }
                else if (a.tile > b.tile) {
                    return 1
                }
                return 0
            })
            .find(_ => true);

        return {
            state: 'DISCARDING',
            card: card,
            cards: cards.filter((_, index) => index !== currentCardIndex)
        }
    }

    // Selects a card from the player's hand and adds it to the selected cards
    static selectCard(cards: Card[], state: PlayerState, tile: number, playerName: string): Card {
        if (state !== 'SELECTING') {
            throw new Error(`${playerName} is not in the SELECTING state.`)
        }

        // Find the card in the player's hand
        const card = cards.find((card) => card.tile === tile);
        if (!card) {
            throw new Error('Card not found');
        }

        return card
    }

    // Selects multiple cards from the player's hand and adds them to the selected cards
    static selectCards(cards: Card[], state: PlayerState, tiles: number[], playerName: string): Card[] {
        if (state !== 'SELECTING') {
            throw new Error(`${playerName} is not in the SELECTING state.`)
        }

        // Find the cards in the player's hand
        return cards.filter((card) => tiles.includes(card.tile));
    }

    // Determines if a card is selected
    static isSelected(selected: Card[], tile: number): boolean {
        return selected.some((selectedCard) => selectedCard.tile === tile);
    }

    private static isSameSuit = (cards: Card[]): boolean => {
        return cards.every((card) => card.suit === cards[0].suit);
    }

    private static isSameNumber = (cards: Card[]): boolean => {
        return cards.every((card) => card.card === cards[0].card);
    }

    private static isSequentual = (cards: Card[]): boolean => {
        const sortedCards = cards.sort((a, b) => a.tile - b.tile);
        return sortedCards.every((card, index) => {
            if (index === 0) {
                return true;
            }

            return card.tile === sortedCards[index - 1].tile + 1;
        });
    }

    private static isAdditional = (cards: Card[], submitted: SubmittedCard[]): boolean => {
        const flattendSubmitted = submitted.flatMap((set) => set.cards);
        if(flattendSubmitted.length < 3) {
            return false;
        }

        var isSequential = submitted.some((set) => this.isSequentual([...set.cards, ...cards]))
        if(isSequential) {
            return true;
        }
        
        var isSameNumber = submitted.some((set) => this.isSameNumber([...set.cards, ...cards]))
        if(isSameNumber) {
            return true;
        }
        return false;
    }

    static validateHand(cards: Card[], submitted: SubmittedCard[]): boolean {
        if (cards.length === 0) {
            throw new Error(`There are no cards to play.`)
        }
        const isSameSuit = PlayerExtensions.isSameSuit(cards);
        const isSameNumber = PlayerExtensions.isSameNumber(cards);
        const isSequentual = PlayerExtensions.isSequentual(cards);
        const isAdditional = PlayerExtensions.isAdditional(cards, submitted);
        const isMoreThanThreeCards = cards.length >= 3;

        // Sequential means in order of each other
        const isSameSuitAndSequentual = isSameSuit && isSequentual && isMoreThanThreeCards;
        // The cards are the same number but different suits
        const isDifferentSuitAndSameNumber = isSameNumber && !isSameSuit && isMoreThanThreeCards;

        if (isSameSuitAndSequentual || isDifferentSuitAndSameNumber || isAdditional) {
            return true
        }

        return false
    }

    static getScore(submitted: SubmittedCard[]): number {
        return submitted.flatMap(x => x.cards).reduce((total, card) => {
            return total + PlayerExtensions.cardScores[card.card];
        }, 0);
    }
}