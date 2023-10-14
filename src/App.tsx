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
        <PlayerHand
          playerName="Opponent"
          selectedCards={game.opponent.selected.map((card) => card.tile)}
          cards={game.opponent.deck} />

        <div className="my-8 w-full max-w-2xl flex">
          <DrawPile onClick={() => game.player.drawCard(game.stack)} />

          <div id="discards" className="ml-4 relative">
            {game.discardStack.map((card, index) => {
              return (
                <CardElement
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
          cards={game.player.deck} />
      </div>
    </>
  )
}

export default App
