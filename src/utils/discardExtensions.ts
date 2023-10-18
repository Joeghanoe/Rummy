import { Card, PlayerState } from "../@types/game";
import { CardExtensions } from "./cardExtensions";

export abstract class DiscardExtensions {
    static canGetCardsFromDiscardStack = (cards: Card[], deck: Card[], state: PlayerState, index: number): boolean => {
        if(state === 'WAITING') {
            throw new Error("It's not your turn");
        }

        const discardSlice = cards.slice(index, cards.length);
        const combinedCards = [...discardSlice, ...deck];
        const moves = CardExtensions.getPossibleMoves(combinedCards);
        const move = moves.moves.find(() => true);

        if(move && move?.cards.length > 0){
            return true
            // player.setCards(combinedCards);
            // player.selectingTurn();
            // setDiscardStack((combinedCards) => combinedCards.slice(0, index));
        }
        return false;
    }
}