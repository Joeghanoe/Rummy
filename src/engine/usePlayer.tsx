import { useCallback, useState } from 'react';
import { Card, PlayerState } from '../@types/game';

const getMessages = (playerName: string = "You") => {
    return {
        cant_draw: `${playerName} can't draw right now!`,
        empty_stack: `The stack is empty!`,
        cant_discard: `${playerName} can't discard right now!`,
        only_dicard_one: `${playerName} can only discard one card at a time!`,
        cant_select: `${playerName} can't select right now!`,
        must_play_three_cards: `${playerName} need to play at least 3 cards!`,
        cards_need_to_be_in_order: `The cards must all be able to be in order of eachother!`,
        cards_need_different_suits: `The cards ${playerName} want to play are not different suits!`,
        cards_error: `The cards ${playerName} want to play are not different suits, in order of the same suit or on the board already!`
    }
}

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
    const [submitted, setSubmitted] = useState<Card[]>([])

    const initializeDeck = useCallback((cards: Card[]) => [
        setDeck(cards)
    ], [])

    const drawCard = useCallback((stack: Card[]) => {
        if (state !== 'DRAWING') {
            return alert(getMessages(playerName).cant_draw);
        }

        if (stack.length === 0) {
            return alert(getMessages(playerName).empty_stack);
        }

        const card = stack.pop();
        if (!card) {
            throw new Error('Card not found');
        }

        setDeck((deck) => [...deck, card]);
        setState('SELECTING');
    }, [state])

    const discard = useCallback((tile: number) => {
        const isCorrectState = state === 'SELECTING' || state === 'DISCARDING';
        if (!isCorrectState) {
            return alert(getMessages(playerName).cant_discard);
        }
        const currentCardIndex = deck.findIndex((card) => card.tile === tile);
        if ((currentCardIndex ?? -1) === -1) {
            throw new Error('Card not found');
        }

        const newDeck = [...deck];
        const card = newDeck.splice(currentCardIndex, 1).sort((a, b) => {
            // write a sort function that sorts by suit and number
            if (a.tile < b.tile) {
                return -1
            }
            else if (a.tile > b.tile) {
                return 1
            }
            return 0
        }).find(_ => true);

        if (!card) {
            throw new Error("You've reached peak impossibleness.")
        }

        setDeck(newDeck);
        discardCard(card)
        setSelected([])
    }, [state, deck])

    const selectCard = useCallback((tile: number) => {
        if (state !== 'SELECTING') {
            return alert(getMessages(playerName).cant_select);
        }

        const card = deck.find((card) => card.tile === tile);
        if (!card) {
            throw new Error('Card not found');
        }

        const isSelected = selected.find(x => x.tile === card.tile);
        if (isSelected) {
            return setSelected((cards) => cards.filter(x => x.tile !== card.tile));
        }

        setSelected([...selected, card]);
    }, [selected, deck, state])

    const selectCards = useCallback((tiles: number[]) => {
        if (state !== 'SELECTING') {
            return alert(getMessages(playerName).cant_select);
        }

        const cards = deck.filter(x => tiles.includes(x.tile))
        setSelected([...cards]);
    }, [selected, deck, state])

    const playHand = useCallback((selected: Card[]) => {
        setSubmitted((cards) => [...cards, ...selected])
        setSelected([]);
        setDeck((deck) => deck.filter((card) => !selected.includes(card)));
    }, [])

    const play = useCallback(() => {
        if (selected.length < 3) {
            return alert("You need to play at least 3 cards!");
        }

        // if they are the same suit and can be sorted in order without any missing steps
        const isSameSuit = selected.every((card) => card.suit === selected[0].suit);
        if (isSameSuit) {
            const sortedCards = selected.sort((a, b) => a.tile - b.tile);
            const isSequential = sortedCards.every((card, index) => {
                if (index === 0) {
                    return true;
                }

                return card.tile === sortedCards[index - 1].tile + 1;
            });

            if (isSequential) {
                playHand(selected)
                return;
            }

            return alert(getMessages(playerName).cards_need_to_be_in_order);
        }

        // if they are different suits and same numbers
        const isSameNumber = selected.every((card) => card.card === selected[0].card);
        if (isSameNumber) {
            const isSameSuit = selected.every((card) => card.suit !== selected[0].suit);
            if (isSameSuit) {
                return alert(getMessages(playerName).cards_need_different_suits);
            }

            playHand(selected)
            return;
        }

        // check if the selected cards can be added to the existing submitted cards
        const canBeAdded = selected.every((card) => {
            const sameCard = submitted.find((c) => c.tile === card.tile);
            if (!sameCard) {
                return false;
            }

            const isSequential = submitted.every((card, index) => {
                if (index === 0) {
                    return true;
                }

                return card.tile === submitted[index - 1].tile + 1;
            });

            if (isSequential) {
                return true;
            }

            return false;
        })

        if (canBeAdded) {
            playHand(selected)
            return;
        }
        return alert("The cards you want to play are not different suits, in order of the same suit or on the board already!");
    }, [selected])

    const endTurn = () => setState('WAITING')
    const startTurn = () => setState('DRAWING')
    const selectingTurn = () => setState('SELECTING')
    const discardingTurn = () => setState('DISCARDING')
    const playingTurn = () => setState('PLAYING')

    return {
        state,
        deck,
        submitted,

        initializeDeck,
        endTurn,
        startTurn,
        selectingTurn,
        discardingTurn,
        playingTurn,

        // Actions
        selected,
        selectCard,
        selectCards,

        drawCard,
        discard,
        play
    };
}
