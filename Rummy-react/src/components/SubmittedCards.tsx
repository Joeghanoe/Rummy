import { SubmittedCard } from "../@types/game"
import CardElement from "./CardElement"

export default function SubmittedCards({
    sets,
    playerName
  }: {
    sets: SubmittedCard[]
    playerName?: string
  }) {
    return (
      <div className='mt-8 w-full flex items-center flex-col'>
        <p>{playerName}s Submitted cards</p>
        <div className='flex flex-row gap-8 mt-2'>
          {sets.map((set, index) => {
            return (
              <div key={`set-${index}`} className='flex flex-row gap-2'>
                {set.cards.map((card, index) => {
                  return (
                    <CardElement
                      key={`card-set-${index}`}
                      card={card.card}
                      size={110}
                      suit={card.suit}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }