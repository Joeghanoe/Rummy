import { useCallback, useMemo, useState } from 'react';
import { Card, PlayerState, SubmittedCard } from '../@types/game';
import { PlayerExtensions } from '../utils/playerExtensions';

export function usePlayer({
    discardCard,
    playerName = 'You',
    defaultState = 'DRAWING'
}: {
    discardCard: (card: Card) => void
    playerName: string
    defaultState?: PlayerState
}) {
    const [state, setState] = useState<PlayerState>(defaultState);
    const [deck, setDeck] = useState<Card[]>([]);
    const [selected, setSelected] = useState<Card[]>([]);
    const [submitted, setSubmitted] = useState<SubmittedCard[]>([])

    const initializeDeck = useCallback((cards: Card[]) => [
        setDeck(cards)
    ], [])

    const drawCard = useCallback((stack: Card[]) => {
        try {
            const result = PlayerExtensions.drawCard(
                stack,
                state,
                playerName
            )

            // Remove the card from the stack
            setDeck((deck) => [...deck, result.card!]);
            setState(result.state);
        }
        catch (e) {
            setState('SELECTING');
        }
    }, [state])

    const discard = useCallback((tile: number) => {
        const nextState: PlayerState = 'DISCARDING'
        const { cards, card } = PlayerExtensions.discard(
            deck,
            nextState,
            tile,
            playerName
        );

        setState(nextState)
        setDeck(cards);
        discardCard(card!)
        setSelected([])
    }, [state, deck])

    const selectCard = useCallback((tile: number) => {
        setSelected((cards) => {
            const isSelected = PlayerExtensions.isSelected(cards, tile);
            if (isSelected) {
                return cards?.filter((card) => card.tile !== tile)
            }
            const card = PlayerExtensions.selectCard(deck, state, tile, playerName)
            return [...cards, card!]
        });
    }, [selected, deck, state])

    const selectCards = useCallback((tiles: number[]) => {
        setSelected(PlayerExtensions.selectCards(deck, state, tiles, playerName));
    }, [selected, deck, state])

    const playHand = useCallback((selected: Card[]) => {
        setSubmitted((cards) => {
            let hasBeenAdded = false;

            const sets = cards.map((set) => {
                if (set.cards.some((card) => selected.some((s) => s.tile === card.tile))) {
                    hasBeenAdded = true;
                    return {
                        ...set,
                        set: [...set.cards, ...selected]
                    }
                }
                return set
            })

            if (hasBeenAdded) {
                return sets;
            }

            return [
                ...sets,
                {
                    cards: selected
                } as SubmittedCard
            ]
        })
        setSelected([]);
        setDeck((deck) => deck.filter((card) => !selected.includes(card)));
    }, [])

    const play = useCallback((opponentSubmitted: SubmittedCard[]) => {
        const isValid = PlayerExtensions.validateHand(selected, [...submitted, ...opponentSubmitted]);
        if (!isValid) {
            return alert("The cards you want to play are not different suits, in order of the same suit or on the board already!");
        }
        playHand(selected)
    }, [selected])

    const score = useMemo(() => {
        return PlayerExtensions.getScore(submitted);
    }, [submitted])

    const setCards = useCallback((cards: Card[]) => {
        setDeck(cards)
    }, [])

    const endTurn = () => setState('WAITING')
    const startTurn = () => setState('DRAWING')
    const selectingTurn = () => setState('SELECTING')
    const discardingTurn = () => setState('DISCARDING')
    const playingTurn = () => setState('PLAYING')

    return {
        state,
        deck,
        submitted,
        score,

        initializeDeck,
        endTurn,
        startTurn,
        selectingTurn,
        discardingTurn,
        playingTurn,
        setCards,

        // Actions
        selected,
        selectCard,
        selectCards,

        drawCard,
        discard,
        play
    };
}
