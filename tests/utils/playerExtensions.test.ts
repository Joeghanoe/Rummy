//@ts-ignore bun is here.
import { expect, test } from "bun:test";
import { Card, CardNumber, CardSuit, PlayerState, SubmittedCard } from "../../src/@types/game";
import cardsData from "../../src/constants/cardsheet.json";
import { PlayerExtensions } from "../../src/utils/playerExtensions";

const playerName = 'player'
const getCard = (suit: CardSuit, number: CardNumber) =>
    cardsData.find(c => c.suit === suit && c.card === number) as Card;

/*
Example of a test
test("", () => {
    // Arrange
    const data = []
    const state: PlayerState = 'DRAWING'

    // Act
    const result = PlayerExtensions.drawCard(data, state, playerName)

    // Assert
    expect(result).toStrictEqual();
})
*/

// Draw Card Tests
test("drawCards should return a card and the updated state when the player is drawing", () => {
    // Arrange
    const cards: Card[] = [getCard('hearts', 'two')]
    const state: PlayerState = 'DRAWING'
    const playerName = 'Alice'

    // Act
    const result = PlayerExtensions.drawCard(cards, state, playerName)

    // Assert
    expect(result.state).toBe('SELECTING')
    expect(result.card).toBeDefined()
    expect(result.cards).toHaveLength(0)
})

test("drawCards should return the same cards and state when the player is not drawing", () => {
    // Arrange
    const cards = [getCard('hearts', 'two')]
    const state: PlayerState = 'PLAYING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => PlayerExtensions.drawCard(cards, state, playerName)).toThrow(new Error('Alice is not in the DRAWING state.'))
})

test("drawCards should return an empty array of cards when there are no cards left in the deck", () => {
    // Arrange
    const cards = []
    const state: PlayerState = 'DRAWING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => PlayerExtensions.drawCard(cards, state, playerName)).toThrow(new Error('There are no cards to draw.'))
})

// Discard Tests
test("discard should throw an error if the player is not in the DISCARDING state", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const state: PlayerState = 'PLAYING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => {
        PlayerExtensions.discard(cards, state, 1, playerName)
    }).toThrow(`${playerName} is not in the DISCARDING state.`)
})

test("discard should throw an error if the card is not found in the player's hand", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const state: PlayerState = 'DISCARDING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => PlayerExtensions.discard(cards, state, 3, playerName)).toThrow(new Error('Card not found'))
})

test("discard should discard the selected card and return the updated state and remaining cards", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four')]
    const state: PlayerState = 'DISCARDING'
    const playerName = 'Alice'

    // Act
    const result = PlayerExtensions.discard(cards, state, cards[0].tile, playerName)

    // Assert
    expect(result.state).toBe('DISCARDING')
    expect(result.card).toStrictEqual(cards[0])
    expect(result.cards).toStrictEqual([cards[1], cards[2]])
})

// Select Card Tests
test("selectCard should throw an error if the player is not in the SELECTING state", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const state: PlayerState = 'PLAYING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => {
        PlayerExtensions.selectCard(cards, state, 1, playerName)
    }).toThrow(`${playerName} is not in the SELECTING state.`)
})

test("selectCard should throw an error if the card is not found in the player's hand", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const state: PlayerState = 'SELECTING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => PlayerExtensions.selectCard(cards, state, 3, playerName)).toThrow(new Error('Card not found'))
})

test("selectCard should select the specified card", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four')]
    const state: PlayerState = 'SELECTING'
    const playerName = 'Alice'

    // Act
    const result = PlayerExtensions.selectCard(cards, state, cards[0].tile, playerName)

    // Assert
    expect(result).toStrictEqual(cards[0])
})

// Select Cards Tests
test("selectCards should throw an error if the player is not in the SELECTING state", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const state: PlayerState = 'PLAYING'
    const playerName = 'Alice'

    // Act & Assert
    expect(() => PlayerExtensions.selectCards(cards, state, [1], playerName)).toThrow(`${playerName} is not in the SELECTING state.`)
})

test("selectCards should select the specified cards", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four')]
    const state: PlayerState = 'SELECTING'
    const playerName = 'Alice'

    // Act
    const result = PlayerExtensions.selectCards(cards, state, [cards[0].tile, cards[1].tile], playerName)

    // Assert
    expect(result).toStrictEqual([cards[0], cards[1]])
})

// IsSelected Tests
test("isSelected should return true if the card is selected", () => {
    // Arrange
    const selected = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const tile = selected[0].tile

    // Act
    const result = PlayerExtensions.isSelected(selected, tile)

    // Assert
    expect(result).toBe(true)
})

test("isSelected should return false if the card is not selected", () => {
    // Arrange
    const selected = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const tile = getCard('hearts', 'four').tile

    // Act
    const result = PlayerExtensions.isSelected(selected, tile)

    // Assert
    expect(result).toBe(false)
})

// Validate Hand Tests
test("validateHand returns true when a sequential and same suit hand is played", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four')]
    const submitted: SubmittedCard[] = []

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(true)
})

test("validateHand returns false when a sequential hand with extra non same suit card is played", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four'), getCard('diamonds', 'four')]
    const submitted: SubmittedCard[] = []

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(false)
})

test("validateHand returns true when different suits with the same numbers hand is played", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('diamonds', 'two'), getCard('clubs', 'two')]
    const submitted: SubmittedCard[] = []

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(true)
})

test("validateHand returns true when different suits with the same numbers and an extra card of different number is played", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('diamonds', 'two'), getCard('clubs', 'two'), getCard('hearts', 'three')]
    const submitted: SubmittedCard[] = []

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(false)
})

test("validateHand fails when less than three cards are played", () => {
    // Arrange
    const cards = [getCard('hearts', 'two'), getCard('hearts', 'three')]
    const submitted: SubmittedCard[] = []

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(false)
})

test("validateHand returns true when a card has already been submitted has been played", () => {
    // Arrange
    const cards = [getCard('hearts', 'five'), getCard('hearts', 'six')]
    const submitted: SubmittedCard[] = [{
        cards: [getCard('hearts', 'two'), getCard('hearts', 'three'), getCard('hearts', 'four')] 
    }]

    // Act
    const result = PlayerExtensions.validateHand(cards, submitted)

    // Assert
    expect(result).toBe(true)
})
