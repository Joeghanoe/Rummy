import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Card, PlayerState } from "../@types/game";
import CardElement, { cardDefaults } from "./CardElement";

const cardSize = 150;

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
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number>(-1);

  const cardElements = useMemo(() => {
    return cards.map((card, index) => {
      const left = index * cardSize / 4;
      const isHovered = hoveredCardIndex === index;
      return (
        <CardElement
          index={index}
          key={`${card.suit}-${card.card}-${index}`}
          size={cardSize}
          card={card.card}
          suit={card.suit}
          onClick={() => onClick && onClick(card)}
          style={{
            left: isHovered ? `${left}px` : `${left + cardSize / 10}px`,
          }}
          className={twMerge(
            state === 'SELECTING' && 'cursor-pointer',
            selectedCards.includes(card.tile) && '-translate-y-2',
            'transition-all origin-bottom absolute top-0'
          )}
        />
      )
    })
  }, [hoveredCardIndex, cards, selectedCards, state])

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
        onMouseOver={(e) => {
          const svgElement = e.target as HTMLDivElement
          // @ts-ignore
          const number = parseInt(svgElement.id);
          if(!isNaN(number)) {
            setHoveredCardIndex(number)
          }
        }}
        onMouseOut={() => {
          setHoveredCardIndex(-1)
        }}
        id="player-1-card-grid"
        style={{
          height: cardSize,
          width: (cardSize / 4) * cards.length + ((cardSize * cardDefaults.aspectRatio) - 20)
        }}
        className="relative mx-auto"
      >
        {cardElements}
      </div>
    </div>
  )
}