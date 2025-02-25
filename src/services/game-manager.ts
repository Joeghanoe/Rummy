import { v4 as uuidv4 } from "uuid";
import { Game } from "../models/game";
import { Player } from "../models/player";

export class GameManager {
  private games: Map<string, Game> = new Map();

  createGame(): Game {
    const gameId = uuidv4();
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  joinGame(gameId: string, playerName: string): { player: Player; game: Game } | null {
    const game = this.getGame(gameId);
    if (!game) {
      return null;
    }

    const playerId = uuidv4();
    const player = new Player(playerId, playerName);
    
    if (game.addPlayer(player)) {
      return { player, game };
    }
    
    return null;
  }

  removeGame(gameId: string): boolean {
    return this.games.delete(gameId);
  }

  getActiveGames(): { id: string; playerCount: number; state: string }[] {
    return Array.from(this.games.values()).map((game) => ({
      id: game.id,
      playerCount: game.players.length,
      state: game.state,
    }));
  }
}
