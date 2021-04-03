const socket = io();
let myTurn = false;
let currentCard = null;
let game;

socket.on("lists", (listPlayers, gameUpd) => {
  game = gameUpd;
  writePlayers(listPlayers, game);
  if (game.state.includes("game")) {
    let currentPlayer = listPlayers.find((pl) => pl.current);
    console.log("cur", currentPlayer);
    myTurn = socket.id === currentPlayer.id;
    document.getElementById("page").style.backgroundColor =
      socket.id === currentPlayer.id ? "green" : "white";
  }
  if (currentCard) {
    document.getElementById("fightBtn").style.display = "block";
    document.getElementById("passBtn").style.display = "none";
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
socket.on("game over", (result) => alert(result));
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
  if (myTurn) {
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
