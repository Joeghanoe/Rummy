import { Card } from "../@types/game"
import CardElement from "./CardElement"


export default function DiscardPile({
    discardStack,
    onClick
}: {
    discardStack: Card[]
    onClick: (index: number) => void
}) {
    return (
        <div id="discards" className="ml-4 relative">
            {discardStack.map((card, index) => {
                return (
                    <CardElement
                        onClick={() => onClick(index)}
                        style={{
                            left: index * 30
                        }}
                        className='absolute hover:-translate-x-2 transition-transform'
                        key={`card-${index}`}
                        card={card.card}
                        size={110}
                        suit={card.suit}
                    />
                )
            })}
        </div>
    )
}