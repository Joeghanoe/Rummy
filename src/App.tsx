import DiscardPile from './components/DiscardPile';
import DrawPile from './components/DrawPile';
import PlayerHand from './components/PlayerHand';
import SubmittedCards from './components/SubmittedCards';
import { useGameV2 } from './engine/useGameV2';

function App() {
  const game = useGameV2();

  return (
    <>
      <div className="w-screen h-screen bg-green-700 flex-col flex justify-center items-center">
        <div>Player is: '{game.player.state}'</div>
        <div>Opponent is: '{game.opponent.state}'</div>
        <SubmittedCards
          playerName='Opponent'
          sets={game.opponent.submitted}
        />
        {/* <PlayerHand
          playerName="Opponent"
          selectedCards={game.opponent.selected.map((card) => card.tile)}
          cards={game.opponent.deck}
          score={game.opponent.score} /> */}

        <div className="my-8 w-full max-w-2xl flex">
          <DrawPile onClick={() => game.player.drawCard(game.stack)} />

          <DiscardPile
            discardStack={game.discardStack}
            onClick={(index) => {
              game.getCardsFromDiscardStack(index)
            }}
          />
        </div>

        <PlayerHand
          onDiscard={() => {
            if (game.player.state === 'SELECTING') {
              game.player.discard(game.player.selected[0].tile)
              game.player.endTurn()
              game.opponent.startTurn()
            }
          }}
          onPlay={() => {
            if (game.player.state === 'SELECTING') {
              game.player.play()
            }
          }}
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
          playerName='Player'
          sets={game.player.submitted}
        />
      </div>
    </>
  )
}

export default App
