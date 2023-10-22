import { Card } from "../@types/game"
import { CardExtensions } from "../utils/cardExtensions"
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
                        size={CardExtensions.size}
                        suit={card.suit}
                    />
                )
            })}
        </div>
    )
}