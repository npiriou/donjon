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
    document.getElementById("deck").style.borderColor =
      socket.id === currentPlayer.id ? "green" : "white";

    if (currentCard && myTurn) {
      document.getElementById("fightBtn").disabled = false;
      document.getElementById("passBtn").disabled = true;
    }
    if (
      myTurn &&
      ((currentCard === null && currentPlayer.drawThisTurn > 0) ||
        (currentCard !== null && currentPlayer.drawThisTurn === 0))
    )
      document.getElementById("fleeBtn").disabled = false;
  }
});

socket.on("game starts", (listPlayers, game) => {
  document.getElementById("divReadyCheck").style.display = "none";
  document.getElementById("centralcards").style.display = "flex";
  document.getElementById("mainbuttons").style.display = "flex";
  Array.from(document.getElementById("mainbuttons").children).forEach(
    (btn) => (btn.disabled = true),
  );
});
socket.on("card draw", (card) => {
  currentCard = card;
  updateCardDisplay(currentCard);
  if (myTurn) {
    document.getElementById("fightBtn").disabled = false;
  }
  document.getElementById("passBtn").disabled = true;
  document.getElementById("fleeBtn").disabled = true;
});

socket.on("fight over", () => {
  currentCard = null;
  updateCardDisplay(currentCard);
  if (myTurn) {
    document.getElementById("passBtn").disabled = false;
    document.getElementById("fleeBtn").disabled = false;
  }
});
socket.on("flee roll", (roll, currentPlayer) =>
  newInfo(`Le jet de fuite de ${currentPlayer.name} est de ${roll}`),
);
socket.on("player flee", (player) =>
  newInfo(
    `${player.name} a fuit avec ${player.beaten.length} Monstres dans sa pile`,
  ),
);
socket.on("player dead", (player) =>
  newInfo(
    `${player.name} est mort avec ${player.beaten.length} Monstres dans sa pile`,
  ),
);
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
    document.getElementById("fightBtn").disabled = true;
    document.getElementById("fleeBtn").disabled = true;
  }
};
const pass = () => {
  if (myTurn) {
    socket.emit("pass");
    document.getElementById("passBtn").disabled = true;
    document.getElementById("fleeBtn").disabled = true;
  }
};

const flee = () => {
  // only plays if no current card, or if there is one but the player did not draw this turn
  //(i.e someone flee or die before, leaving the monster here)
  if (myTurn) {
    socket.emit("flee");
    document.getElementById("passBtn").style.display = "none";
    document.getElementById("fleeBtn").style.display = "none";
  }
};

const reset = () => socket.emit("reset");
const updateCardDisplay = (card) =>
  (document.getElementById("currentCard").innerHTML = card
    ? `<span class='bold'>${card.power}</span> ${card.name}`
    : "-");
