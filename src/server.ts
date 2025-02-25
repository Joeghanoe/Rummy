import { serve, type Server, type ServerWebSocket } from "bun";
import { Game } from "./models/game";
import { GameManager } from "./services/game-manager";
import { GameEvent, type BroadcastMessage, type WebSocketData, type WebSocketMessage } from "./types";

// Store WebSocket connections with their data
const clients = new Map<ServerWebSocket<unknown>, WebSocketData>();

const gameManager = new GameManager();

const server: Server = serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket connections
    if (url.pathname === "/ws") {
      const success = server.upgrade(req, {
        data: {} as WebSocketData,
      });

      if (success) {
        // Upgraded successfully
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Handle HTTP API endpoints
    if (url.pathname === "/api/games" && req.method === "GET") {
      return new Response(JSON.stringify(gameManager.getActiveGames()), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/games" && req.method === "POST") {
      const game = gameManager.createGame();
      return new Response(JSON.stringify({ gameId: game.id }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static files for the frontend
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("public/index.html"));
    }

    if (url.pathname.startsWith("/static/")) {
      return new Response(Bun.file(`public${url.pathname}`));
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      console.log("WebSocket connection opened");
      // Store the WebSocket connection
      clients.set(ws, {} as WebSocketData);
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    },
    close(ws) {
      const data = clients.get(ws);
      if (data && data.gameId && data.playerId) {
        // Handle player disconnection
        console.log(`Player ${data.playerId} disconnected from game ${data.gameId}`);
      }
      // Remove the client from our map
      clients.delete(ws);
    },
  },
});

function handleWebSocketMessage(ws: ServerWebSocket<unknown>, data: WebSocketMessage): void {
  const { action, gameId, playerName, playerId, cardIndex, melds } = data;

  switch (action) {
    case "create_game":
      const newGame = gameManager.createGame();
      ws.send(JSON.stringify({
        event: GameEvent.GAME_CREATED,
        gameId: newGame.id
      }));
      break;

    case "join_game":
      if (!gameId) {
        ws.send(JSON.stringify({ error: "Missing gameId" }));
        return;
      }

      // Default to a random name if none provided
      const playerNameToUse = playerName || `Player_${Math.floor(Math.random() * 1000)}`;

      const joinResult = gameManager.joinGame(gameId, playerNameToUse);
      if (!joinResult) {
        ws.send(JSON.stringify({ error: "Failed to join game. Game may be full or not exist." }));
        return;
      }

      const { player, game } = joinResult;

      // Update the client data in our map
      clients.set(ws, {
        gameId: gameId,
        playerId: player.id
      });

      // Broadcast to all players in the game
      broadcastToGame(game, {
        event: GameEvent.PLAYER_JOINED,
        player: { id: player.id, name: player.name },
        gameState: game.getGameState()
      });

      // Send player-specific info to the joining player
      ws.send(JSON.stringify({
        event: "join_success",
        playerId: player.id,
        gameState: game.getGameState(player.id)
      }));
      break;

    case "start_game":
      if (!gameId) {
        ws.send(JSON.stringify({ error: "Missing gameId" }));
        return;
      }

      const gameToStart = gameManager.getGame(gameId);
      if (!gameToStart) {
        ws.send(JSON.stringify({ error: "Game not found" }));
        return;
      }

      if (gameToStart.start()) {
        broadcastToGame(gameToStart, {
          event: GameEvent.GAME_STARTED,
          gameState: gameToStart.getGameState()
        });

        // Send each player their hand
        for (const player of gameToStart.players) {
          sendToPlayer(gameToStart, player.id, {
            event: GameEvent.CARDS_DEALT,
            hand: player.hand,
            gameState: gameToStart.getGameState(player.id)
          });
        }
      } else {
        ws.send(JSON.stringify({ error: "Cannot start game" }));
      }
      break;

    case "draw_from_deck":
      if (!gameId || !playerId) {
        ws.send(JSON.stringify({ error: "Missing gameId or playerId" }));
        return;
      }

      const gameToDraw = gameManager.getGame(gameId);
      if (!gameToDraw) {
        ws.send(JSON.stringify({ error: "Game not found" }));
        return;
      }

      const drawnCard = gameToDraw.drawFromDeck(playerId);
      if (drawnCard) {
        // Notify all players that a card was drawn (but not which card)
        broadcastToGame(gameToDraw, {
          event: GameEvent.CARD_DRAWN,
          source: "deck",
          playerId,
          gameState: gameToDraw.getGameState()
        });

        // Send the specific card to the player who drew it
        sendToPlayer(gameToDraw, playerId, {
          event: "card_drawn_details",
          card: drawnCard,
          gameState: gameToDraw.getGameState(playerId)
        });
      } else {
        ws.send(JSON.stringify({ error: "Cannot draw card" }));
      }
      break;

    case "draw_from_discard":
      if (!gameId || !playerId) {
        ws.send(JSON.stringify({ error: "Missing gameId or playerId" }));
        return;
      }

      const gameToDrawDiscard = gameManager.getGame(gameId);
      if (!gameToDrawDiscard) {
        ws.send(JSON.stringify({ error: "Game not found" }));
        return;
      }

      // Pass the discardIndex if provided
      const drawnDiscardCard = gameToDrawDiscard.drawFromDiscard(playerId, data.discardIndex);
      if (drawnDiscardCard) {
        // Everyone knows which card was drawn from discard
        broadcastToGame(gameToDrawDiscard, {
          event: GameEvent.CARD_DRAWN,
          source: "discard",
          playerId,
          card: drawnDiscardCard,
          gameState: gameToDrawDiscard.getGameState()
        });

        // Send updated hand to the player
        sendToPlayer(gameToDrawDiscard, playerId, {
          event: "hand_updated",
          gameState: gameToDrawDiscard.getGameState(playerId)
        });
      } else {
        // Check if it's because they can't form a meld
        if (data.discardIndex !== undefined &&
          data.discardIndex < gameToDrawDiscard.discardPile.length - 1) {
          ws.send(JSON.stringify({
            error: "You can only pick up this card if you can form a valid meld with it"
          }));
        } else {
          ws.send(JSON.stringify({ error: "Cannot draw from discard" }));
        }
      }
      break;
      
    case "discard":
      if (!gameId || !playerId || cardIndex === undefined) {
        ws.send(JSON.stringify({ error: "Missing required parameters" }));
        return;
      }

      const gameToDiscard = gameManager.getGame(gameId);
      if (!gameToDiscard) {
        ws.send(JSON.stringify({ error: "Game not found" }));
        return;
      }

      const discardedCard = gameToDiscard.discard(playerId, cardIndex);
      if (discardedCard) {
        broadcastToGame(gameToDiscard, {
          event: GameEvent.CARD_DISCARDED,
          playerId,
          card: discardedCard,
          gameState: gameToDiscard.getGameState()
        });

        // Notify next player it's their turn
        const nextPlayer = gameToDiscard.getCurrentPlayer();
        if (nextPlayer) {
          broadcastToGame(gameToDiscard, {
            event: GameEvent.TURN_CHANGED,
            playerId: nextPlayer.id,
            gameState: gameToDiscard.getGameState()
          });

          // Send updated hand to the player who discarded
          sendToPlayer(gameToDiscard, playerId, {
            event: "hand_updated",
            gameState: gameToDiscard.getGameState(playerId)
          });
        }
      } else {
        ws.send(JSON.stringify({ error: "Cannot discard card" }));
      }
      break;

    case "declare_winner":
      if (!gameId || !playerId || !melds) {
        ws.send(JSON.stringify({ error: "Missing required parameters" }));
        return;
      }

      const gameToEnd = gameManager.getGame(gameId);
      if (!gameToEnd) {
        ws.send(JSON.stringify({ error: "Game not found" }));
        return;
      }

      if (gameToEnd.declareWinner(playerId, melds)) {
        broadcastToGame(gameToEnd, {
          event: GameEvent.PLAYER_WENT_OUT,
          playerId,
          melds,
          gameState: gameToEnd.getGameState()
        });

        broadcastToGame(gameToEnd, {
          event: GameEvent.GAME_ENDED,
          winner: playerId,
          gameState: gameToEnd.getGameState()
        });
      } else {
        ws.send(JSON.stringify({ error: "Invalid melds or not all cards used" }));
      }
      break;

    default:
      ws.send(JSON.stringify({ error: "Unknown action" }));
  }
}

// Helper function to broadcast to all players in a game
function broadcastToGame(game: Game, message: BroadcastMessage): void {
  for (const [ws, data] of clients.entries()) {
    if (data.gameId === game.id) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Helper function to send message to a specific player
function sendToPlayer(game: Game, playerId: string, message: BroadcastMessage): void {
  for (const [ws, data] of clients.entries()) {
    if (data.gameId === game.id && data.playerId === playerId) {
      ws.send(JSON.stringify(message));
      break;
    }
  }
}

console.log(`Rummy game server running at http://localhost:3000`);
