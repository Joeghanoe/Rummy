import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Card, PlayerState } from "../@types/game";
import { CardExtensions } from '../utils/cardExtensions';
import CardElement, { cardDefaults } from "./CardElement";

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
    const canHover = state === 'WAITING' || state === 'DRAWING';

    return cards.map((card, index) => {
      const left = index * CardExtensions.size / 4;
      const isHovered = !canHover && (hoveredCardIndex === index);
      const isSelected = selectedCards.includes(card.tile) && '-translate-y-2';

      return (
        <CardElement
          index={index}
          key={`${card.suit}-${card.card}-${index}`}
          size={CardExtensions.size}
          card={card.card}
          suit={card.suit}
          onClick={() => onClick && onClick(card)}
          style={{
            left: isHovered && !isSelected ? `${left}px` : `${left + CardExtensions.size / 10}px`,
          }}
          className={twMerge(
            state === 'SELECTING' && 'cursor-pointer',
            isSelected && '-translate-y-2',
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
          height: CardExtensions.size,
          width: (CardExtensions.size / 4) * cards.length + ((CardExtensions.size * cardDefaults.aspectRatio) - 20)
        }}
        className="relative mx-auto"
      >
        {cardElements}
      </div>
    </div>
  )
}