import type { Card } from "../models/card";
import { GameEvent, GameState, type ActiveGame, type GameStateData } from "../types";

class RummyGame {
  private ws: WebSocket;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private gameState: GameStateData | null = null;
  private hand: Card[] = [];
  private selectedCardIndex: number | null = null;
  private activeGames: ActiveGame[] = [];

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.ws.onopen = this.onWebSocketOpen.bind(this);
    this.ws.onmessage = this.onWebSocketMessage.bind(this);
    this.ws.onclose = this.onWebSocketClose.bind(this);
    this.ws.onerror = this.onWebSocketError.bind(this);

    this.setupEventListeners();
  }

  private onWebSocketOpen() {
    console.log('WebSocket connection established');
    this.showScreen('lobby');

    // Fetch active games when the connection opens
    this.fetchActiveGames();
  }

  private onWebSocketMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);

      if (data.error) {
        this.showError(data.error);
        return;
      }

      if (data.gameState) {
        this.gameState = data.gameState;
      }

      switch (data.event) {
        case GameEvent.GAME_CREATED:
          this.gameId = data.gameId;
          this.updateGameIdDisplay();
          // Show the game ID container
          const gameIdContainer = document.getElementById('game-id-container');
          if (gameIdContainer) {
            gameIdContainer.style.display = 'block';
          }
          // Refresh the game list
          setTimeout(() => this.fetchActiveGames(), 500);
          break;

        case 'join_success':
          this.playerId = data.playerId;
          this.showScreen('waiting-room');
          this.updateGameIdDisplay();
          this.updatePlayerList();
          break;

        case GameEvent.PLAYER_JOINED:
          this.updatePlayerList();
          break;

        case GameEvent.GAME_STARTED:
          this.showScreen('game');
          break;

        case GameEvent.CARDS_DEALT:
          this.hand = data.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;

        case 'card_drawn_details':
          if(!this.gameState) return;

          this.hand = this.gameState.players.find(
            (p: any) => p.id === this.playerId
          )?.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;

        case 'hand_updated':
          if(!this.gameState) return;

          this.hand = this.gameState.players.find(
            (p: any) => p.id === this.playerId
          )?.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;

        case GameEvent.CARD_DRAWN:
        case GameEvent.CARD_DISCARDED:
        case GameEvent.TURN_CHANGED:
          this.updateGameInfo();
          break;

        case GameEvent.PLAYER_WENT_OUT:
        case GameEvent.GAME_ENDED:
          this.updateGameInfo();
          this.showGameResult();
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private onWebSocketClose() {
    console.log('WebSocket connection closed');
    this.showError('Connection to server lost. Please refresh the page.');
  }

  private onWebSocketError(error: Event) {
    console.error('WebSocket error:', error);
    this.showError('WebSocket error occurred');
  }

  private setupEventListeners() {
    // Create Game button
    document.getElementById('create-game-btn')?.addEventListener('click', () => {
      this.createGame();
    });

    // Refresh games button
    document.getElementById('refresh-games-btn')?.addEventListener('click', () => {
      this.fetchActiveGames();
    });

    // Join Game form
    document.getElementById('join-game-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const gameIdInput = document.getElementById('game-id-input') as HTMLInputElement;
      const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;

      const gameId = gameIdInput.value.trim();
      const playerName = playerNameInput.value.trim() || `Player_${Math.floor(Math.random() * 1000)}`;

      if (!gameId) {
        this.showError('Game ID is required');
        return;
      }

      this.joinGame(gameId, playerName);
    });

    // Start Game button
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.startGame();
    });

    // Draw from deck button
    document.getElementById('draw-deck-btn')?.addEventListener('click', () => {
      this.drawFromDeck();
    });

    // Draw from discard button
    document.getElementById('draw-discard-btn')?.addEventListener('click', () => {
      this.drawFromDiscard();
    });

    // Discard button
    document.getElementById('discard-btn')?.addEventListener('click', () => {
      if (this.selectedCardIndex !== null) {
        this.discardCard(this.selectedCardIndex);
      } else {
        this.showError('Please select a card to discard');
      }
    });

    // Go Out button
    document.getElementById('go-out-btn')?.addEventListener('click', () => {
      // In a real implementation, we'd have UI for arranging melds
      // For simplicity, we're just showing a placeholder
      this.showError('Meld arrangement not implemented in this demo');
    });

    // Back to lobby button
    document.getElementById('back-to-lobby-btn')?.addEventListener('click', () => {
      window.location.reload(); // Simple way to restart
    });
  }

  private fetchActiveGames() {
    fetch('/api/games')
      .then(response => response.json())
      .then(games => {
        this.activeGames = games;
        this.renderActiveGames();
      })
      .catch(error => {
        console.error('Error fetching games:', error);
        this.showError('Failed to load active games');
      });
  }

  private renderActiveGames() {
    const gamesList = document.getElementById('active-games-list');
    if (!gamesList) return;

    if (this.activeGames.length === 0) {
      gamesList.innerHTML = '<li>No active games. Create a new one!</li>';
      return;
    }

    gamesList.innerHTML = '';
    this.activeGames.forEach(game => {
      const gameItem = document.createElement('li');
      gameItem.className = 'game-item';

      const gameInfo = document.createElement('div');
      gameInfo.className = 'game-info-item';
      gameInfo.textContent = `Game ${game.id.substring(0, 8)}... - ${game.playerCount} players - ${game.state}`;

      const joinButton = document.createElement('button');
      joinButton.textContent = 'Join';
      joinButton.className = 'join-btn';
      joinButton.disabled = game.state !== 'waiting';

      joinButton.addEventListener('click', () => {
        // Prompt for name or use a random one
        const playerName = prompt('Enter your name:') || `Player_${Math.floor(Math.random() * 1000)}`;
        this.joinGame(game.id, playerName);
      });

      gameItem.appendChild(gameInfo);
      gameItem.appendChild(joinButton);
      gamesList.appendChild(gameItem);
    });
  }

  private createGame() {
    this.ws.send(JSON.stringify({ action: 'create_game' }));
  }

  private joinGame(gameId: string, playerName: string) {
    if (!gameId) {
      this.showError('Game ID is required');
      return;
    }

    this.gameId = gameId;
    this.playerName = playerName || `Player_${Math.floor(Math.random() * 1000)}`;

    this.ws.send(JSON.stringify({
      action: 'join_game',
      gameId,
      playerName: this.playerName
    }));
  }

  private startGame() {
    if (!this.gameId) {
      this.showError('No game ID');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'start_game',
      gameId: this.gameId
    }));
  }

  private drawFromDeck() {
    if (!this.gameId || !this.playerId) {
      this.showError('Not in a game');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'draw_from_deck',
      gameId: this.gameId,
      playerId: this.playerId
    }));
  }

  private drawFromDiscard() {
    if (!this.gameId || !this.playerId) {
      this.showError('Not in a game');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'draw_from_discard',
      gameId: this.gameId,
      playerId: this.playerId
    }));
  }

  private discardCard(cardIndex: number) {
    if (!this.gameId || !this.playerId) {
      this.showError('Not in a game');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'discard',
      gameId: this.gameId,
      playerId: this.playerId,
      cardIndex
    }));

    this.selectedCardIndex = null;
  }

  private declareWinner(melds: any[]) {
    if (!this.gameId || !this.playerId) {
      this.showError('Not in a game');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'declare_winner',
      gameId: this.gameId,
      playerId: this.playerId,
      melds
    }));
  }

  private showScreen(screenId: string) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      (screen as HTMLElement).style.display = 'none';
    });

    // Show the requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.display = 'block';
    }
  }

  private updateGameIdDisplay() {
    const gameIdDisplay = document.getElementById('game-id-display');
    const waitingGameId = document.getElementById('waiting-game-id');

    if (gameIdDisplay && this.gameId) {
      gameIdDisplay.textContent = this.gameId;
    }

    if (waitingGameId && this.gameId) {
      waitingGameId.textContent = this.gameId;
    }
  }

  private updatePlayerList() {
    const playerList = document.getElementById('player-list');
    const gamePlayerList = document.getElementById('game-player-list');

    if (!this.gameState) return;

    // Update waiting room player list
    if (playerList) {
      playerList.innerHTML = '';

      this.gameState.players.forEach((player: any) => {
        const playerItem = document.createElement('li');
        playerItem.textContent = player.name;

        if (player.id === this.playerId) {
          playerItem.classList.add('current-player');
          playerItem.textContent += ' (You)';
        }

        playerList.appendChild(playerItem);
      });

      // Show start button only if there are at least 2 players
      const startButton = document.getElementById('start-game-btn');
      if (startButton) {
        startButton.style.display = this.gameState.players.length >= 2 ? 'block' : 'none';
      }
    }

    // Update in-game player list
    if (gamePlayerList) {
      gamePlayerList.innerHTML = '';


      this.gameState.players.forEach((player: any) => {
        const playerItem = document.createElement('li');
        playerItem.textContent = `${player.name} (${player.cardCount} cards)`;

        if (player.id === this.playerId) {
          playerItem.classList.add('current-player');
          playerItem.textContent += ' (You)';
        }

        if(!this.gameState) return;
        if (this.gameState.currentPlayer === player.id) {
          playerItem.classList.add('active-player');
        }

        gamePlayerList.appendChild(playerItem);
      });
    }
  }

  private renderHand() {
    const handContainer = document.getElementById('hand-container');
    if (!handContainer) return;

    handContainer.innerHTML = '';

    this.hand.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      cardElement.dataset.index = index.toString();

      // Add suit color
      if (card.suit === 'hearts' || card.suit === 'diamonds') {
        cardElement.classList.add('red');
      } else {
        cardElement.classList.add('black');
      }

      // Add selected class if this card is selected
      if (index === this.selectedCardIndex) {
        cardElement.classList.add('selected');
      }

      // Create card content
      const rankSpan = document.createElement('span');
      rankSpan.className = 'rank';
      rankSpan.textContent = card.rank;

      const suitSpan = document.createElement('span');
      suitSpan.className = 'suit';
      // Use suit symbols
      switch (card.suit) {
        case 'hearts':
          suitSpan.textContent = '♥';
          break;
        case 'diamonds':
          suitSpan.textContent = '♦';
          break;
        case 'clubs':
          suitSpan.textContent = '♣';
          break;
        case 'spades':
          suitSpan.textContent = '♠';
          break;
      }

      cardElement.appendChild(rankSpan);
      cardElement.appendChild(suitSpan);

      // Add click event to select card
      cardElement.addEventListener('click', () => {
        this.selectCard(index);
      });

      handContainer.appendChild(cardElement);
    });
  }

  private selectCard(index: number) {
    if (this.selectedCardIndex === index) {
      // Deselect if already selected
      this.selectedCardIndex = null;
    } else {
      this.selectedCardIndex = index;
    }

    this.renderHand();
  }

  private updateGameInfo() {
    if (!this.gameState) return;

    // Update discard pile
    const discardPile = document.getElementById('discard-pile');
    if (discardPile) {
      discardPile.innerHTML = '';

      if (this.gameState.discardPile && this.gameState.discardPile.length > 0) {
        // Create a container for the stacked cards
        const stackContainer = document.createElement('div');
        stackContainer.className = 'discard-stack';

        const isMyTurn = this.gameState.currentPlayer === this.playerId;

        // Add all cards to the stack with a slight offset
        this.gameState.discardPile.forEach((card: any, index: number) => {
          const cardElement = document.createElement('div');
          cardElement.className = 'card discard-card';

          // Position cards with a slight offset to create a stack effect
          cardElement.style.top = `${index * 5}px`;
          cardElement.style.left = `${index * 2}px`;
          cardElement.style.zIndex = index.toString();

          // Add suit color
          if (card.suit === 'hearts' || card.suit === 'diamonds') {
            cardElement.classList.add('red');
          } else {
            cardElement.classList.add('black');
          }

          // Create card content
          const rankSpan = document.createElement('span');
          rankSpan.className = 'rank';
          rankSpan.textContent = card.rank;

          const suitSpan = document.createElement('span');
          suitSpan.className = 'suit';
          switch (card.suit) {
            case 'hearts':
              suitSpan.textContent = '♥';
              break;
            case 'diamonds':
              suitSpan.textContent = '♦';
              break;
            case 'clubs':
              suitSpan.textContent = '♣';
              break;
            case 'spades':
              suitSpan.textContent = '♠';
              break;
          }

          cardElement.appendChild(rankSpan);
          cardElement.appendChild(suitSpan);

          if(!this.gameState) return;

          // Add visual indicator for top card vs other cards
          if (index === this.gameState.discardPile.length - 1) {
            cardElement.classList.add('top-discard');

            // Add tooltip for top card
            if (isMyTurn) {
              const tooltip = document.createElement('div');
              tooltip.className = 'tooltip';
              tooltip.textContent = 'Click to draw top card';
              cardElement.appendChild(tooltip);
            }
          } else {
            cardElement.classList.add('lower-discard');

            // Add tooltip for lower cards
            if (isMyTurn) {
              const tooltip = document.createElement('div');
              tooltip.className = 'tooltip';
              tooltip.textContent = 'Must form a valid meld to pick up';
              cardElement.appendChild(tooltip);
            }
          }

          // Add click event to draw this card (if it's the player's turn)
          if (isMyTurn) {
            cardElement.addEventListener('click', () => {
              this.drawFromDiscardAtIndex(index);
            });
          } else {
            cardElement.classList.add('disabled');
          }

          stackContainer.appendChild(cardElement);
        });

        discardPile.appendChild(stackContainer);
      } else {
        discardPile.innerHTML = '<div class="card empty">Empty</div>';
      }
    }

    // Update deck count
    const deckCount = document.getElementById('deck-count');
    if (deckCount) {
      deckCount.textContent = `Cards in deck: ${this.gameState.deckCount}`;
    }

    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator) {
      const isMyTurn = this.gameState.currentPlayer === this.playerId;
      turnIndicator.textContent = isMyTurn ? 'Your turn' : 'Waiting for opponent';
      turnIndicator.className = isMyTurn ? 'my-turn' : '';

      // Enable/disable action buttons based on turn
      const actionButtons = document.querySelectorAll('.action-btn');
      actionButtons.forEach(btn => {
        (btn as HTMLButtonElement).disabled = !isMyTurn;
      });
    }

    // Update player list in game
    this.updatePlayerList();
  }

  private showGameResult() {
    if (!this.gameState || this.gameState.state !== GameState.FINISHED) return;

    const resultMessage = document.getElementById('result-message');
    if (!resultMessage) return;

    const isWinner = this.gameState.winner === this.playerId;
    resultMessage.textContent = isWinner
      ? 'Congratulations! You won the game!'
      : `Game over. ${this.getPlayerNameById(this.gameState.winner)} won the game.`;

    resultMessage.className = isWinner ? 'winner' : 'loser';

    this.showScreen('game-result');
  }

  private getPlayerNameById(playerId: string): string {
    if (!this.gameState) return 'Unknown player';

    const player = this.gameState.players.find((p: any) => p.id === playerId);
    return player ? player.name : 'Unknown player';
  }

  private showError(message: string) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      // Hide after 3 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 3000);
    } else {
      alert(message);
    }
  }

  // Add a new method to draw from a specific index in the discard pile
  private drawFromDiscardAtIndex(index: number) {
    if (!this.gameId || !this.playerId) {
      this.showError('Not in a game');
      return;
    }

    this.ws.send(JSON.stringify({
      action: 'draw_from_discard',
      gameId: this.gameId,
      playerId: this.playerId,
      discardIndex: index
    }));
  }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  new RummyGame();
});
