import { Card } from "../@types/game";
import data from '../constants/cardsheet.json';

export abstract class CardExtensions {
    private static minimumCardsForTurn: number = 3;
    private static defaultHandSize: number = 20;

    private static validateSetByTile(cards: Card[]) {
        // Sort the cards by tile number
        const sortedCardsByTile = cards.sort((a, b) => a.tile - b.tile);

        // Initialize an empty array to hold sets of cards with the same tile number
        const cardSetsByTile: { id: number; cards: Card[] }[] = [];

        // Initialize a variable to keep track of the current set of cards
        let currentSet: { id: number; cards: Card[] } | null = null;

        // Loop through each card in the sorted array
        for (const card of sortedCardsByTile) {
            // Check if the current card is the next one in the current set
            const isNextCard = currentSet && card.tile - currentSet.id === 1;
            const isLastSet = currentSet && currentSet.cards.length < this.minimumCardsForTurn;

            if (isNextCard) {
                // If the current card is the next one in the current set, add it to the set
                currentSet!.cards.push(card);
                currentSet!.id = card.tile;
            } else {
                // If the current card is not the next one in the current set, start a new set
                if (isLastSet) {
                    // If the previous set had too few cards, remove it from the array
                    cardSetsByTile.pop();
                }

                // Create a new set with the current card as the first card
                currentSet = { id: card.tile, cards: [card] };
                cardSetsByTile.push(currentSet);
            }
        }

        // Remove last entry if it has too few cards
        if (currentSet && currentSet.cards.length < this.minimumCardsForTurn) {
            cardSetsByTile.pop();
        }

        return cardSetsByTile;
    }

    private static validateSetByNumber(cards: Card[]) {
        // Sort the cards by number
        const sortedCardsByNumber = cards.sort((a, b) => a.number - b.number)

        // Initialize an empty array to hold sets of cards with the same tile number
        const cardSetsByNumber: { card: string; cards: Card[] }[] = [];

        // Initialize a variable to keep track of the current set of cards
        let currentSet: { card: string; cards: Card[] } | null = null;

        // Loop through each card in the sorted array
        for (const card of sortedCardsByNumber) {
            // Check if the current card is the next one in the current set
            const isNextCard = card.card === currentSet?.card;

            if (isNextCard) {
                // If the current card is the next one in the current set, add it to the set
                currentSet!.cards.push(card);
                currentSet!.card = card.card;
            } else {
                // If the current card is not the next one in the current set, start a new set
                if (currentSet && currentSet.cards.length < this.minimumCardsForTurn) {
                    // If the previous set had too few cards, remove it from the array
                    cardSetsByNumber.pop();
                }

                // Create a new set with the current card as the first card
                currentSet = { card: card.card, cards: [card] };
                cardSetsByNumber.push(currentSet);
            }
        }

        // Remove last entry if it has too few cards
        if (currentSet && currentSet.cards.length < this.minimumCardsForTurn) {
            cardSetsByNumber.pop();
        }

        return cardSetsByNumber;
    }

    private static shuffle(array: Card[]) {
        let currentIndex = array.length,
            randomIndex;

        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
            ];
        }

        return array;
    }

    static initialize() {
        const cards = data.map((card) => ({
            suit: card.suit,
            card: card.card,
            tile: card.tile,
            number: card.number,
        }) as Card);
        return this.shuffle(cards);
    }

    static getPossibleMoves(cards: Card[]) {
        if (cards.length < this.minimumCardsForTurn) {
            return {
                moves: []
            }
        }

        // Initialize an empty array to hold sets of cards with the same tile number
        const cardSetsByTile = this.validateSetByTile(cards)
    
        // remove all cards that are in the cardSets.sets from the sortedCards
        const remainingCards = cards.filter((card) => {
            const isSet = cardSetsByTile.some((set) => set.cards.some((setCard) => setCard.tile === card.tile));
            return !isSet;
        })

        // sort by number field and group them together
        const sortedRemainingCards = remainingCards.sort((a, b) => a.number - b.number)
        const cardSetsByNumber = this.validateSetByNumber(sortedRemainingCards)

        return {
            moves: [
                ...cardSetsByTile,
                ...cardSetsByNumber
            ],
        }
    }

    static getHand(cards: Card[]) {
        return cards.splice(0, this.defaultHandSize)
    }
}