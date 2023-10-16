//@ts-ignore bun is here.
import { expect, test } from "bun:test";
import { Card, CardNumber, CardSuit } from "../../src/@types/game";
import cardsData from "../../src/constants/cardsheet.json";
import { CardExtensions } from "../../src/utils/cardExtensions";

const getCard = (suit: CardSuit, number: CardNumber) =>
    cardsData.find(c => c.suit === suit && c.card === number) as Card;

test("getAllPossibleMoves with no cards", () => {
    // Arrange
    const data = []

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: []
    });
})

test("getAllPossibleMoves with one card", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace')
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: []
    });
})

test("getAllPossibleMoves with two different cards", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('hearts', 'two')
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: []
    });
})

test("getAllPossibleMoves with two of the same card.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('clubs', 'ace'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: []
    });
})

test("getAllPossibleMoves with three cards of different suits.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('diamonds', 'ace'),
        getCard('hearts', 'ace'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                card: 'ace',
                cards: data
            }
        ]
    });
})

test("getAllPossibleMoves with three cards of different suits and one of a different number.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('diamonds', 'ace'),
        getCard('hearts', 'ace'),
    ]
    const differentCards = [
        getCard('hearts', 'two'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves([...data, ...differentCards])

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                card: 'ace',
                cards: data
            }
        ]
    });
})

test("getAllPossibleMoves with four cards of the same suit and consecutive numbers.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('clubs', 'two'),
        getCard('clubs', 'three'),
        getCard('clubs', 'four'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                id: 3,
                cards: data
            }
        ]
    });
})

test("getAllPossibleMoves with four cards of the same suit and non-consecutive numbers.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('clubs', 'two'),
        getCard('clubs', 'four'),
        getCard('clubs', 'five'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: []
    });
})

test("getAllPossibleMoves with five cards of the same suit and consecutive numbers.", () => {
    // Arrange
    const data = [
        getCard('clubs', 'ace'),
        getCard('clubs', 'two'),
        getCard('clubs', 'three'),
        getCard('clubs', 'four'),
        getCard('clubs', 'five'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                id: 4,
                cards: data
            }
        ]
    });
})

test("getAllPossibleMoves with five cards forming a single pair of three of the same suit and non-consecutive numbers.", () => {
    // Arrange
    const firstSet = [
        getCard('clubs', 'ace'),
        getCard('clubs', 'two'),
        getCard('clubs', 'three'),
    ]
    const secondSet = [
        getCard('clubs', 'five'),
        getCard('clubs', 'six'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves([...firstSet, ...secondSet])

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                id: 2,
                cards: firstSet
            }
        ]
    });
})

test("getAllPossibleMoves with cards of consective order and a set of cards with the same suits", () => {
    // Arrange
    const data = [
        getCard('clubs', 'two'),
        getCard('clubs', 'three'),
        getCard('clubs', 'ace'),
        getCard('hearts', 'ace'),
        getCard('diamonds', 'ace'),
        getCard('spades', 'ace'),
    ]

    // Act
    const result = CardExtensions.getPossibleMoves(data)

    // Assert
    expect(result).toStrictEqual({
        moves: [
            {
                id: 2,
                cards: [
                    getCard('clubs', 'ace'),
                    getCard('clubs', 'two'),
                    getCard('clubs', 'three'),
                ]
            },
            {
                card: 'ace',
                cards: [
                    getCard('diamonds', 'ace'),
                    getCard('spades', 'ace'),
                    getCard('hearts', 'ace'),
                ]
            }
        ]
    });
})

test("initialize returns a deck of 52 cards", () => {
    // Arrange
    const expected = 52

    // Act
    const result = CardExtensions.initialize()

    // Assert
    expect(result.length).toBe(expected)
})

test("initialize returns a deck of 52 cards with no duplicates", () => {
    // Arrange
    const expected = 52

    // Act
    const result = CardExtensions.initialize()

    // Assert
    expect(result.length).toBe(expected)
    expect(result).toStrictEqual([...new Set(result)])
})

test("getHand returns a hand of the default amount of cards", () => {
    // Arrange
    const cards = CardExtensions.initialize()
    const totalCards = cards.length;

    // Act
    const result = CardExtensions.getHand(cards)

    // Assert
    expect(totalCards).toBe(cards.length + result.length)
})