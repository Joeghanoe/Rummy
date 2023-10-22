import { PlayerState } from './@types/game';
import DiscardPile from './components/DiscardPile';
import DrawPile from './components/DrawPile';
import PlayerHand from './components/PlayerHand';
import SubmittedCards from './components/SubmittedCards';
import { useGameV2 } from './engine/useGameV2';

function App() {
  const game = useGameV2();

  // console.log(JSON.stringify({
  //   game: game.stack,
  //   player: game.player.deck,
  //   playerSubmitted: game.player.submitted,
  //   opponent: game.opponent.deck,
  //   opponentSubmitted: game.opponent.submitted,
  //   discards: game.discardStack,
  // }))

  function GetPlayerMessage(state: PlayerState) {
    if (state === 'DRAWING') {
      return 'Drawing'
    }
    else if (state === 'SELECTING') {
      return 'Selecting'
    }
    else if (state === 'PLAYING') {
      return 'Playing'
    }
    else if (state === 'DISCARDING') {
      return 'Discarding'
    }
    else if (state === 'WAITING') {
      return 'Waiting for Opponent'
    }
  }

  return (
    <>
      <div className="w-screen h-screen bg-green-700 flex-col flex justify-center items-center">
        <div className='w-full h-full mx-auto max-w-screen-2xl relative grid grid-cols-8'>
          <div className='col-span-2 bg-zinc-700 border-x-blue-500 border-x-2 flex flex-col px-1 py-16 gap-1 text-white font-bold '>

            <div className='flex justify-center bg-blue-500/80 py-1 rounded-lg border-zinc-900 border-2 shadow-lg text-2xl'>
              {GetPlayerMessage(game.player.state)}
            </div>

            <div className='bg-zinc-900/80 rounded-lg shadow-lg px-2 py-2 flex gap-2 z-10'>
              <div className='flex flex-col items-center'>
                <span className='-my-1'>Round</span>
                <span>score</span>
              </div>
              <div className='bg-zinc-700/60 flex-1 rounded-lg flex justify-center items-center'>
                <span className="text-2xl">{game.player.score - game.opponent.score}</span>
              </div>
            </div>

          </div>
          <div className='col-span-6 px-6'>
            <SubmittedCards
              playerName='Opponent'
              sets={game.opponent.submitted}
            />

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
                  game.player.play(game.opponent.submitted)
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
          {/* <div>Player is: '{game.player.state}'</div>
          <div>Opponent is: '{game.opponent.state}'</div> */}

        </div>
      </div>
    </>
  )
}

export default App
