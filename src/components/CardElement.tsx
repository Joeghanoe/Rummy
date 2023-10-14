import { twMerge } from 'tailwind-merge';
import { Card } from '../@types/game';
import cardsdata from '../constants/cardsheet.json';

const cardDefaults = {
    aspectRatio: 180 / 263,
    visualMapping: {
        "clubs": "-3%",
        "diamonds": "-101%",
        "spades": "-198%",
        "hearts": "-297%",
    }
}

export default function CardElement({
    size,
    card,
    suit,
    onClick,
    className,
    style
}: {
    size: number
    card: string
    suit: 'spades' | 'hearts' | 'clubs' | 'diamonds',
    onClick?: () => void,
    className?: string
    style: React.CSSProperties | null
}) {
    const sizedWidth = size * cardDefaults.aspectRatio
    const sizedHeight = size

    const currentCard = cardsdata.find((cardData) => cardData.suit === suit && cardData.card === card) as Card;
    if (!currentCard) throw new Error(`Card not found: ${card} of ${suit}`)

    return (
        <svg 
            width={sizedWidth} 
            height={sizedHeight} 
            onClick={onClick} 
            style={style}
            className={className}>
            <image
                className={twMerge("pointer-events-none")}
                href="./cardsheet.png"
                width="1500%"
                height="400%"
                x={`${((currentCard.tile % 13) + 1) * -100}%`}
                y={cardDefaults.visualMapping[currentCard.suit]}></image>
        </svg>
    )
}