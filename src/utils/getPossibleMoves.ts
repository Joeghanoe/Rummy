import { Card } from "../@types/game";


const minimumCards = 3;

const validateSetByTile = (cards: Card[]) => {
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
        const isLastSet = currentSet && currentSet.cards.length < minimumCards;

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
    if (currentSet && currentSet.cards.length < minimumCards) {
        cardSetsByTile.pop();
    }

    return cardSetsByTile;
}


const validateSetByNumber = (cards: Card[]) => {
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
            if (currentSet && currentSet.cards.length < minimumCards) {
                // If the previous set had too few cards, remove it from the array
                cardSetsByNumber.pop();
            }

            // Create a new set with the current card as the first card
            currentSet = { card: card.card, cards: [card] };
            cardSetsByNumber.push(currentSet);
        }
    }

    // Remove last entry if it has too few cards
    if (currentSet && currentSet.cards.length < minimumCards) {
        cardSetsByNumber.pop();
    }

    return cardSetsByNumber;
}


export const playCards = (cards: Card[]) => {
    if (cards.length < minimumCards) {
        return {
            moves: []
        }
    }

    // Initialize an empty array to hold sets of cards with the same tile number
    const cardSetsByTile = validateSetByTile(cards)

    // remove all cards that are in the cardSets.sets from the sortedCards
    const remainingCards = cards.filter((card) => {
        const isSet = cardSetsByTile.some((set) => set.cards.some((setCard) => setCard.tile === card.tile));
        return !isSet;
    })

    // sort by number field and group them together
    const sortedRemainingCards = remainingCards.sort((a, b) => a.number - b.number)
    const cardSetsByNumber = validateSetByNumber(sortedRemainingCards)

    return {
        moves: [
            ...cardSetsByTile,
            ...cardSetsByNumber
        ],
    }
}

// const dummyCards = [
//     {
//         "suit": "clubs",
//         "card": "three",
//         "tile": 2,
//         "number": 3
//     },
//     {
//         "suit": "clubs",
//         "card": "six",
//         "tile": 5,
//         "number": 6
//     },
//     {
//         "suit": "diamonds",
//         "card": "five",
//         "tile": 17,
//         "number": 5
//     },
//     {
//         "suit": "spades",
//         "card": "queen",
//         "tile": 37,
//         "number": 11
//     },
//     {
//         "suit": "diamonds",
//         "card": "queen",
//         "tile": 24,
//         "number": 11
//     },
//     {
//         "suit": "clubs",
//         "card": "ace",
//         "tile": 0,
//         "number": 0
//     },
//     {
//         "suit": "clubs",
//         "card": "two",
//         "tile": 1,
//         "number": 2
//     },
//     {
//         "suit": "clubs",
//         "card": "ten",
//         "tile": 9,
//         "number": 10
//     },
//     {
//         "suit": "clubs",
//         "card": "jack",
//         "tile": 10,
//         "number": 10
//     },

//     {
//         "suit": "hearts",
//         "card": "jack",
//         "tile": 49,
//         "number": 10
//     },
//     {
//         "suit": "hearts",
//         "card": "queen",
//         "tile": 50,
//         "number": 11
//     },
// ] as Card[]
// const cards = playCards(dummyCards)
// cards.moves.forEach((cards) => {
//     console.log(cards.cards)
// });