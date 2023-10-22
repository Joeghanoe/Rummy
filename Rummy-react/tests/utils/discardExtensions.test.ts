//@ts-ignore bun is here.
import { expect, test } from "bun:test";
import { Card, CardNumber, CardSuit } from "../../src/@types/game";
import cardsData from "../../src/constants/cardsheet.json";
import { DiscardExtensions } from "../../src/utils/discardExtensions";
import failedMove from "../mocks/failedmove-1.json";

const getCard = (suit: CardSuit, number: CardNumber) =>
    cardsData.find(c => c.suit === suit && c.card === number) as Card;

test("determine why this results in an error", () => {
    // Arrange
    const discardedCards = failedMove.discards as Card[]
    const state = 'DRAWING'
    const deck = failedMove.player  as Card[]
    const index = 0

    // Act
    const result = DiscardExtensions.canGetCardsFromDiscardStack(discardedCards, deck, state, index);

    // Assert
    expect(result).toBe(true);
})