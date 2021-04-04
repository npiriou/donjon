const socket = io();
let myTurn = false;
let currentCard = null;
let game;
let players;

socket.on("lists", (listPlayers, gameUpd) => {
  game = gameUpd;
  players = listPlayers;
  writePlayers(listPlayers, game);
  if (game.state.includes("game")) {
    let currentPlayer = listPlayers.find((pl) => pl.current);
    myTurn = socket.id === currentPlayer.id;
    document.getElementById("page").style.backgroundColor =
      socket.id === currentPlayer.id ? "green" : "white";

    if (currentCard && myTurn) {
      document.getElementById("fightBtn").style.display = "block";
      document.getElementById("passBtn").style.display = "none";
    }
    console.log("cur", currentPlayer);
    if (
      myTurn &&
      ((currentCard === null && currentPlayer.drawThisTurn > 0) ||
        (currentCard !== null && currentPlayer.drawThisTurn === 0))
    )
      document.getElementById("fleeBtn").style.display = "block";
  }
});

socket.on("game starts", (listPlayers, game) => {
  document.getElementById("divReadyCheck").style.display = "none";
  document.getElementById("centralcards").style.display = "block";
});
socket.on("card draw", (card) => {
  currentCard = card;
  updateCardDisplay(currentCard);
  if (myTurn) {
    document.getElementById("fightBtn").style.display = "block";
  }
  document.getElementById("passBtn").style.display = "none";
  document.getElementById("fleeBtn").style.display = "none";
});

socket.on("fight over", () => {
  currentCard = null;
  updateCardDisplay(currentCard);
  if (myTurn) {
    document.getElementById("passBtn").style.display = "block";
    document.getElementById("fleeBtn").style.display = "block";
  }
});
socket.on("game over", (result) => {
  document.getElementById("game-container").innerText = result;
});
const draw = () => {
  if (myTurn && !game.state.includes("fight")) {
    socket.emit("draw");
  }
};
const fight = () => {
  if (myTurn) {
    socket.emit("fight");
    document.getElementById("fightBtn").style.display = "none";
    document.getElementById("fleeBtn").style.display = "none";
  }
};
const pass = () => {
  if (myTurn) {
    socket.emit("pass");
    document.getElementById("passBtn").style.display = "none";
    document.getElementById("fleeBtn").style.display = "none";
  }
};

const flee = () => {
  // only plays if no current card, or if there is one but the player did not draw this turn
  //(i.e someone flee or die before, leaving the monster here)
  if (
    myTurn &&
    (currentCard === null || players[socket.id].drawThisTurn === 0)
  ) {
    socket.emit("flee");
    document.getElementById("passBtn").style.display = "none";
    document.getElementById("fleeBtn").style.display = "none";
  }
};

const reset = () => socket.emit("reset");
const updateCardDisplay = (card) =>
  (document.getElementById("currentCard").innerText = card
    ? `Carte actuelle:  ${card.power} ${card.name}`
    : `Carte actuelle`);
