import { twMerge } from 'tailwind-merge';
import { Card, PlayerState } from "../@types/game";
import CardElement from "./CardElement";

const cardWidth = 110;

export default function PlayerHand({
  cards,
  playerName,
  state,
  selectedCards = [],
  onClick,
  onDiscard,
  onPlay,
  score
}: {
  cards: Card[]
  playerName: string
  state?: PlayerState
  selectedCards?: number[]
  onClick?: (card: Card) => void
  onDiscard?: () => void
  onPlay?: () => void
  score: number
}) {
  return (
    <div>
      <div>
        <p className="font-bold">{playerName}</p>
        <p className="font-bold">score: {score}</p>
      </div>
      <div className='mb-4 flex gap-4'>
        {onClick && <>
          <button id="discard" onClick={onDiscard}>discard</button>
          <button id="play" onClick={onPlay}>play</button>
        </>}
      </div>
      <div
        id="player-1-card-grid"
        className="relative h-28 mx-auto w-full flex flex-row justify-center items-center"
      >
        {cards.map((card, index) => {
          return (
            <CardElement
              key={`${card.suit}-${card.card}-${index}`}
              size={cardWidth}
              card={card.card}
              suit={card.suit}
              onClick={() => onClick && onClick(card)}
              className={twMerge(
                state === 'SELECTING' && 'cursor-pointer hover:scale-105',
                selectedCards.includes(card.tile) && '-translate-y-2',
                'transition-all origin-bottom'
              )}
            />
          )
        })}
      </div>
    </div>
  )
}