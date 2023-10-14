import { useEffect, useState } from 'react';
import { Card } from '../@types/game';
import cardsdata from '../constants/cardsheet.json';
import { playCards } from '../utils/getPossibleMoves';
import { usePlayer } from './usePlayer';

function createStack() {
    const cards = cardsdata.map((card) => ({
        suit: card.suit,
        card: card.card,
        tile: card.tile,
    }) as Card);
    return shuffle(cards);
}

function shuffle(array: Card[]) {
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

export function useGameV2() {
    // Constants
    const initialHandCount = 10;

    // The stack of cards that are not in the player's or opponent's hand
    // Player(s) cards + stack are always equal to 52
    const [stack, setStack] = useState<Card[]>([]);
    const [discardStack, setDiscardStack] = useState<Card[]>([]);
    const player = usePlayer({
        playerName: 'Player',
        discardCard: (card) => {
            setDiscardStack((cards) => [...cards, card])
        }
    })
    const opponent = usePlayer({
        playerName: 'Opponent',
        defaultState: 'WAITING',
        discardCard: (card) => {
            setDiscardStack((cards) => [...cards, card])
        }
    })

    // Perform opponent actions
    useEffect(() => {
        if (opponent.state === 'DRAWING') {
            opponent.drawCard(stack);
            console.log('hi')
        }
        if (opponent.state === 'SELECTING') {
            const opponentMoves = playCards(opponent.deck);

            const move = opponentMoves.moves.find(x => true);
            console.log(move)
            if (move) {
                opponent.selectCards(move.cards.map((x) => x.tile));
                opponent.playingTurn();
            }
            else {
                opponent.discardingTurn();
            }
        }
        if(opponent.state === 'PLAYING') {
            opponent.play();
            opponent.selectingTurn();
        }
        if (opponent.state === 'DISCARDING') {
            const firstCard = opponent.deck.find(() => true);
            opponent.discard(firstCard?.tile!)
            opponent.endTurn();
            player.startTurn();
        }
    }, [opponent.state, stack])

    useEffect(() => {
        const stack = createStack();
        player.initializeDeck(stack.splice(0, initialHandCount))
        opponent.initializeDeck(stack.splice(0, initialHandCount))
        setStack(stack);
    }, [])

    return {
        player: player,
        opponent: opponent,
        stack,
        discardStack,
    };
}
