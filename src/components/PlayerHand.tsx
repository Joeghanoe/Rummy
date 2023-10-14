import { twMerge } from 'tailwind-merge';
import { Card, PlayerState } from "../@types/game";
import CardElement from "./CardElement";

export default function PlayerHand({
  cards,
  playerName,
  state,
  selectedCards = [],
  onClick,
  onDiscard,
  onPlay,
}: {
  cards: Card[]
  playerName: string
  state?: PlayerState
  selectedCards?: number[]
  onClick?: (card: Card) => void
  onDiscard?: () => void
  onPlay?: () => void
}) {
  return (
    <div>
      <p className="font-bold">{playerName}</p>
      <div className='mb-4 flex gap-4'>
        {onClick && <>
          <button id="discard" onClick={onDiscard}>discard</button>
          <button id="play" onClick={onPlay}>play</button>
        </>}
      </div>
      <div id="player-1-card-grid" className="flex">
        {cards.map((card) => (
          <CardElement
            key={`${card.suit}-${card.card}`}
            size={110}
            card={card.card}
            suit={card.suit}
            onClick={() => onClick && onClick(card)}
            className={twMerge(
              selectedCards.includes(card.tile) && '-translate-y-4',
              state === 'SELECTING' && 'cursor-pointer',
            )}
          />
        ))}
      </div>
    </div>
  )
}