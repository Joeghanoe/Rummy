import { useCallback, useEffect, useState } from 'react';
import { Card } from '../@types/game';
import { CardExtensions } from '../utils/cardExtensions';
import { usePlayer } from './usePlayer';

export function useGameV2() {
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

    const getCardsFromDiscardStack = useCallback((index: number) => {
        if (player.state === 'WAITING') {
            return alert('Not your turn')
        }

        const discardSlice = discardStack.slice(index, discardStack.length);
        const cards = [...discardSlice, ...player.deck];
        const moves = CardExtensions.getPossibleMoves(cards);
        const move = moves.moves.find(() => true);


        if (move && move?.cards.length > 0) {
            console.log(moves);
            player.setCards(cards);
            player.selectingTurn();
            setDiscardStack((cards) => cards.slice(0, index));
        }

    }, [discardStack, player.deck, player.state])

    function sleep(callback: () => void) {
        setTimeout(callback, 1000)
    }

    // Perform opponent actions
    useEffect(() => {
        if (opponent.state === 'DRAWING') {
            sleep(() => {
                opponent.drawCard(stack);
            })
        }
        if (opponent.state === 'SELECTING') {
            sleep(() => {
                const opponentMoves = CardExtensions.getPossibleMoves(opponent.deck);
                const move = opponentMoves.moves.find(() => true);
                if (move) {
                    opponent.selectCards(move.cards.map((x) => x.tile));
                    opponent.playingTurn();
                }
                else {
                    opponent.discardingTurn();
                }
            })
        }
        if (opponent.state === 'PLAYING') {
            sleep(() => {
                opponent.play(player.submitted);
                opponent.selectingTurn();
            })
        }
        if (opponent.state === 'DISCARDING') {
            sleep(() => {
                const firstCard = opponent.deck.find(() => true);
                opponent.discard(firstCard?.tile!)
                opponent.endTurn();
                player.startTurn();
            })
        }
    }, [opponent.state, player.submitted, stack])

    useEffect(() => {
        const stack = CardExtensions.initialize();
        player.initializeDeck(CardExtensions.getHand(stack))
        opponent.initializeDeck(CardExtensions.getHand(stack))
        setStack(stack);
    }, [])

    return {
        player: player,
        opponent: opponent,
        stack,
        discardStack,
        getCardsFromDiscardStack
    };
}
