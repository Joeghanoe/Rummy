import { SubmittedCard } from './@types/game';
import CardElement from './components/CardElement';
import DrawPile from './components/DrawPile';
import PlayerHand from './components/PlayerHand';
import { useGameV2 } from './engine/useGameV2';

function App() {
  const game = useGameV2();

  return (
    <>
      <div className="w-screen h-screen bg-green-700 flex-col flex justify-center items-center">
        <div>Player is: '{game.player.state}'</div>
        <div>Opponent is: '{game.opponent.state}'</div>
        <SubmittedCards
          sets={game.opponent.submitted}
        />
        <PlayerHand
          playerName="Opponent"
          selectedCards={game.opponent.selected.map((card) => card.tile)}
          cards={game.opponent.deck}
          score={game.opponent.score} />

        <div className="my-8 w-full max-w-2xl flex">
          <DrawPile onClick={() => game.player.drawCard(game.stack)} />

          <div id="discards" className="ml-4 relative">
            {game.discardStack.map((card, index) => {
              return (
                <CardElement
                  onClick={() => game.getCardsFromDiscardStack(index)}
                  style={{ left: index * 30 }}
                  className='absolute'
                  key={`card-${index}`}
                  card={card.card}
                  size={110}
                  suit={card.suit}
                />
              )
            })}
          </div>
        </div>

        <PlayerHand
          onDiscard={() => {
            game.player.discard(game.player.selected[0].tile)
            game.player.endTurn()
            game.opponent.startTurn()
          }}
          onPlay={() => game.player.play()}
          state={game.player.state}
          playerName="Player"
          selectedCards={game.player.selected.map((card) => card.tile)}
          onClick={(card) => {
            if (game.player.state === 'SELECTING') {
              game.player.selectCard(card.tile)
            }
          }}
          score={game.player.score}
          cards={game.player.deck} />

        <SubmittedCards
          sets={game.player.submitted}
        />
      </div>
    </>
  )
}

function SubmittedCards({
  sets
}: {
  sets: SubmittedCard[]
}) {
  return (
    <div className='mt-8 w-full flex items-center flex-col'>
      <p>Submitted cards</p>
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

export default App
