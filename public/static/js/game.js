// src/client/game.ts
class RummyGame {
  ws;
  gameId = null;
  playerId = null;
  playerName = null;
  gameState = null;
  hand = [];
  selectedCardIndex = null;
  activeGames = [];
  constructor() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    this.ws.onopen = this.onWebSocketOpen.bind(this);
    this.ws.onmessage = this.onWebSocketMessage.bind(this);
    this.ws.onclose = this.onWebSocketClose.bind(this);
    this.ws.onerror = this.onWebSocketError.bind(this);
    this.setupEventListeners();
  }
  onWebSocketOpen() {
    console.log("WebSocket connection established");
    this.showScreen("lobby");
    this.fetchActiveGames();
  }
  onWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);
      if (data.error) {
        this.showError(data.error);
        return;
      }
      if (data.gameState) {
        this.gameState = data.gameState;
      }
      switch (data.event) {
        case "game_created" /* GAME_CREATED */:
          this.gameId = data.gameId;
          this.updateGameIdDisplay();
          const gameIdContainer = document.getElementById("game-id-container");
          if (gameIdContainer) {
            gameIdContainer.style.display = "block";
          }
          setTimeout(() => this.fetchActiveGames(), 500);
          break;
        case "join_success":
          this.playerId = data.playerId;
          this.showScreen("waiting-room");
          this.updateGameIdDisplay();
          this.updatePlayerList();
          break;
        case "player_joined" /* PLAYER_JOINED */:
          this.updatePlayerList();
          break;
        case "game_started" /* GAME_STARTED */:
          this.showScreen("game");
          break;
        case "cards_dealt" /* CARDS_DEALT */:
          this.hand = data.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;
        case "card_drawn_details":
          if (!this.gameState)
            return;
          this.hand = this.gameState.players.find((p) => p.id === this.playerId)?.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;
        case "hand_updated":
          if (!this.gameState)
            return;
          this.hand = this.gameState.players.find((p) => p.id === this.playerId)?.hand || [];
          this.renderHand();
          this.updateGameInfo();
          break;
        case "card_drawn" /* CARD_DRAWN */:
        case "card_discarded" /* CARD_DISCARDED */:
        case "turn_changed" /* TURN_CHANGED */:
          this.updateGameInfo();
          break;
        case "player_went_out" /* PLAYER_WENT_OUT */:
        case "game_ended" /* GAME_ENDED */:
          this.updateGameInfo();
          this.showGameResult();
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }
  onWebSocketClose() {
    console.log("WebSocket connection closed");
    this.showError("Connection to server lost. Please refresh the page.");
  }
  onWebSocketError(error) {
    console.error("WebSocket error:", error);
    this.showError("WebSocket error occurred");
  }
  setupEventListeners() {
    document.getElementById("create-game-btn")?.addEventListener("click", () => {
      this.createGame();
    });
    document.getElementById("refresh-games-btn")?.addEventListener("click", () => {
      this.fetchActiveGames();
    });
    document.getElementById("join-game-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const gameIdInput = document.getElementById("game-id-input");
      const playerNameInput = document.getElementById("player-name-input");
      const gameId = gameIdInput.value.trim();
      const playerName = playerNameInput.value.trim() || `Player_${Math.floor(Math.random() * 1000)}`;
      if (!gameId) {
        this.showError("Game ID is required");
        return;
      }
      this.joinGame(gameId, playerName);
    });
    document.getElementById("start-game-btn")?.addEventListener("click", () => {
      this.startGame();
    });
    document.getElementById("draw-deck-btn")?.addEventListener("click", () => {
      this.drawFromDeck();
    });
    document.getElementById("draw-discard-btn")?.addEventListener("click", () => {
      this.drawFromDiscard();
    });
    document.getElementById("discard-btn")?.addEventListener("click", () => {
      if (this.selectedCardIndex !== null) {
        this.discardCard(this.selectedCardIndex);
      } else {
        this.showError("Please select a card to discard");
      }
    });
    document.getElementById("go-out-btn")?.addEventListener("click", () => {
      this.showError("Meld arrangement not implemented in this demo");
    });
    document.getElementById("back-to-lobby-btn")?.addEventListener("click", () => {
      window.location.reload();
    });
  }
  fetchActiveGames() {
    fetch("/api/games").then((response) => response.json()).then((games) => {
      this.activeGames = games;
      this.renderActiveGames();
    }).catch((error) => {
      console.error("Error fetching games:", error);
      this.showError("Failed to load active games");
    });
  }
  renderActiveGames() {
    const gamesList = document.getElementById("active-games-list");
    if (!gamesList)
      return;
    if (this.activeGames.length === 0) {
      gamesList.innerHTML = "<li>No active games. Create a new one!</li>";
      return;
    }
    gamesList.innerHTML = "";
    this.activeGames.forEach((game) => {
      const gameItem = document.createElement("li");
      gameItem.className = "game-item";
      const gameInfo = document.createElement("div");
      gameInfo.className = "game-info-item";
      gameInfo.textContent = `Game ${game.id.substring(0, 8)}... - ${game.playerCount} players - ${game.state}`;
      const joinButton = document.createElement("button");
      joinButton.textContent = "Join";
      joinButton.className = "join-btn";
      joinButton.disabled = game.state !== "waiting";
      joinButton.addEventListener("click", () => {
        const playerName = prompt("Enter your name:") || `Player_${Math.floor(Math.random() * 1000)}`;
        this.joinGame(game.id, playerName);
      });
      gameItem.appendChild(gameInfo);
      gameItem.appendChild(joinButton);
      gamesList.appendChild(gameItem);
    });
  }
  createGame() {
    this.ws.send(JSON.stringify({ action: "create_game" }));
  }
  joinGame(gameId, playerName) {
    if (!gameId) {
      this.showError("Game ID is required");
      return;
    }
    this.gameId = gameId;
    this.playerName = playerName || `Player_${Math.floor(Math.random() * 1000)}`;
    this.ws.send(JSON.stringify({
      action: "join_game",
      gameId,
      playerName: this.playerName
    }));
  }
  startGame() {
    if (!this.gameId) {
      this.showError("No game ID");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "start_game",
      gameId: this.gameId
    }));
  }
  drawFromDeck() {
    if (!this.gameId || !this.playerId) {
      this.showError("Not in a game");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "draw_from_deck",
      gameId: this.gameId,
      playerId: this.playerId
    }));
  }
  drawFromDiscard() {
    if (!this.gameId || !this.playerId) {
      this.showError("Not in a game");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "draw_from_discard",
      gameId: this.gameId,
      playerId: this.playerId
    }));
  }
  discardCard(cardIndex) {
    if (!this.gameId || !this.playerId) {
      this.showError("Not in a game");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "discard",
      gameId: this.gameId,
      playerId: this.playerId,
      cardIndex
    }));
    this.selectedCardIndex = null;
  }
  declareWinner(melds) {
    if (!this.gameId || !this.playerId) {
      this.showError("Not in a game");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "declare_winner",
      gameId: this.gameId,
      playerId: this.playerId,
      melds
    }));
  }
  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen2) => {
      screen2.style.display = "none";
    });
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.display = "block";
    }
  }
  updateGameIdDisplay() {
    const gameIdDisplay = document.getElementById("game-id-display");
    const waitingGameId = document.getElementById("waiting-game-id");
    if (gameIdDisplay && this.gameId) {
      gameIdDisplay.textContent = this.gameId;
    }
    if (waitingGameId && this.gameId) {
      waitingGameId.textContent = this.gameId;
    }
  }
  updatePlayerList() {
    const playerList = document.getElementById("player-list");
    const gamePlayerList = document.getElementById("game-player-list");
    if (!this.gameState)
      return;
    if (playerList) {
      playerList.innerHTML = "";
      this.gameState.players.forEach((player) => {
        const playerItem = document.createElement("li");
        playerItem.textContent = player.name;
        if (player.id === this.playerId) {
          playerItem.classList.add("current-player");
          playerItem.textContent += " (You)";
        }
        playerList.appendChild(playerItem);
      });
      const startButton = document.getElementById("start-game-btn");
      if (startButton) {
        startButton.style.display = this.gameState.players.length >= 2 ? "block" : "none";
      }
    }
    if (gamePlayerList) {
      gamePlayerList.innerHTML = "";
      this.gameState.players.forEach((player) => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.name} (${player.cardCount} cards)`;
        if (player.id === this.playerId) {
          playerItem.classList.add("current-player");
          playerItem.textContent += " (You)";
        }
        if (!this.gameState)
          return;
        if (this.gameState.currentPlayer === player.id) {
          playerItem.classList.add("active-player");
        }
        gamePlayerList.appendChild(playerItem);
      });
    }
  }
  renderHand() {
    const handContainer = document.getElementById("hand-container");
    if (!handContainer)
      return;
    handContainer.innerHTML = "";
    this.hand.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.className = "card";
      cardElement.dataset.index = index.toString();
      if (card.suit === "hearts" || card.suit === "diamonds") {
        cardElement.classList.add("red");
      } else {
        cardElement.classList.add("black");
      }
      if (index === this.selectedCardIndex) {
        cardElement.classList.add("selected");
      }
      const rankSpan = document.createElement("span");
      rankSpan.className = "rank";
      rankSpan.textContent = card.rank;
      const suitSpan = document.createElement("span");
      suitSpan.className = "suit";
      switch (card.suit) {
        case "hearts":
          suitSpan.textContent = "♥";
          break;
        case "diamonds":
          suitSpan.textContent = "♦";
          break;
        case "clubs":
          suitSpan.textContent = "♣";
          break;
        case "spades":
          suitSpan.textContent = "♠";
          break;
      }
      cardElement.appendChild(rankSpan);
      cardElement.appendChild(suitSpan);
      cardElement.addEventListener("click", () => {
        this.selectCard(index);
      });
      handContainer.appendChild(cardElement);
    });
  }
  selectCard(index) {
    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = null;
    } else {
      this.selectedCardIndex = index;
    }
    this.renderHand();
  }
  updateGameInfo() {
    if (!this.gameState)
      return;
    const discardPile = document.getElementById("discard-pile");
    if (discardPile) {
      discardPile.innerHTML = "";
      if (this.gameState.discardPile && this.gameState.discardPile.length > 0) {
        const stackContainer = document.createElement("div");
        stackContainer.className = "discard-stack";
        const isMyTurn = this.gameState.currentPlayer === this.playerId;
        this.gameState.discardPile.forEach((card, index) => {
          const cardElement = document.createElement("div");
          cardElement.className = "card discard-card";
          cardElement.style.top = `${index * 5}px`;
          cardElement.style.left = `${index * 2}px`;
          cardElement.style.zIndex = index.toString();
          if (card.suit === "hearts" || card.suit === "diamonds") {
            cardElement.classList.add("red");
          } else {
            cardElement.classList.add("black");
          }
          const rankSpan = document.createElement("span");
          rankSpan.className = "rank";
          rankSpan.textContent = card.rank;
          const suitSpan = document.createElement("span");
          suitSpan.className = "suit";
          switch (card.suit) {
            case "hearts":
              suitSpan.textContent = "♥";
              break;
            case "diamonds":
              suitSpan.textContent = "♦";
              break;
            case "clubs":
              suitSpan.textContent = "♣";
              break;
            case "spades":
              suitSpan.textContent = "♠";
              break;
          }
          cardElement.appendChild(rankSpan);
          cardElement.appendChild(suitSpan);
          if (!this.gameState)
            return;
          if (index === this.gameState.discardPile.length - 1) {
            cardElement.classList.add("top-discard");
            if (isMyTurn) {
              const tooltip = document.createElement("div");
              tooltip.className = "tooltip";
              tooltip.textContent = "Click to draw top card";
              cardElement.appendChild(tooltip);
            }
          } else {
            cardElement.classList.add("lower-discard");
            if (isMyTurn) {
              const tooltip = document.createElement("div");
              tooltip.className = "tooltip";
              tooltip.textContent = "Must form a valid meld to pick up";
              cardElement.appendChild(tooltip);
            }
          }
          if (isMyTurn) {
            cardElement.addEventListener("click", () => {
              this.drawFromDiscardAtIndex(index);
            });
          } else {
            cardElement.classList.add("disabled");
          }
          stackContainer.appendChild(cardElement);
        });
        discardPile.appendChild(stackContainer);
      } else {
        discardPile.innerHTML = '<div class="card empty">Empty</div>';
      }
    }
    const deckCount = document.getElementById("deck-count");
    if (deckCount) {
      deckCount.textContent = `Cards in deck: ${this.gameState.deckCount}`;
    }
    const turnIndicator = document.getElementById("turn-indicator");
    if (turnIndicator) {
      const isMyTurn = this.gameState.currentPlayer === this.playerId;
      turnIndicator.textContent = isMyTurn ? "Your turn" : "Waiting for opponent";
      turnIndicator.className = isMyTurn ? "my-turn" : "";
      const actionButtons = document.querySelectorAll(".action-btn");
      actionButtons.forEach((btn) => {
        btn.disabled = !isMyTurn;
      });
    }
    this.updatePlayerList();
  }
  showGameResult() {
    if (!this.gameState || this.gameState.state !== "finished" /* FINISHED */)
      return;
    const resultMessage = document.getElementById("result-message");
    if (!resultMessage)
      return;
    const isWinner = this.gameState.winner === this.playerId;
    resultMessage.textContent = isWinner ? "Congratulations! You won the game!" : `Game over. ${this.getPlayerNameById(this.gameState.winner)} won the game.`;
    resultMessage.className = isWinner ? "winner" : "loser";
    this.showScreen("game-result");
  }
  getPlayerNameById(playerId) {
    if (!this.gameState)
      return "Unknown player";
    const player = this.gameState.players.find((p) => p.id === playerId);
    return player ? player.name : "Unknown player";
  }
  showError(message) {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      setTimeout(() => {
        errorElement.style.display = "none";
      }, 3000);
    } else {
      alert(message);
    }
  }
  drawFromDiscardAtIndex(index) {
    if (!this.gameId || !this.playerId) {
      this.showError("Not in a game");
      return;
    }
    this.ws.send(JSON.stringify({
      action: "draw_from_discard",
      gameId: this.gameId,
      playerId: this.playerId,
      discardIndex: index
    }));
  }
}
window.addEventListener("DOMContentLoaded", () => {
  new RummyGame;
});
