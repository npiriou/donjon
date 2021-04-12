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
    displayItems();
    let currentPlayer = listPlayers.find((pl) => pl.current);
    myTurn = socket.id === currentPlayer.id;

    // changing display for the curent player
    if (socket.id === currentPlayer.id) {
      if (currentCard === null) {
        document.getElementById("deck").classList.add("playable");
        document.getElementById("currentCard").classList.remove("threat");
      } else {
        document.getElementById("deck").classList.remove("playable");
        document.getElementById("currentCard").classList.add("threat");
      }
    } else {
      document.getElementById("currentCard").classList.remove("threat");
      document.getElementById("deck").classList.remove("playable");
      document.getElementById("passBtn").disabled = true;
      document.getElementById("fleeBtn").disabled = true;
    }

    // enabling and disabling buttons according to game state and whose turn it is
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
    if (currentCard === null)
      document.getElementById("fightBtn").disabled = true;
  }
});

socket.on("game starts", (listPlayers, game) => {
  document.getElementById("divReadyCheck").style.display = "none";
  document.getElementById("centralcards").style.display = "flex";
  document.getElementById("mainbuttons").style.display = "flex";
  Array.from(document.getElementById("mainbuttons").children).forEach(
    (btn) => (btn.disabled = true),
  );
  document.getElementById("itemsBtn").disabled = false;
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
socket.on("info", (info) => newInfo(info));
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
  let scoresTable =
    "<div>Scores finaux</div><ul>" +
    players.map(
      (pl) =>
        `<li>${pl.name} : ${pl.score + pl.beaten.length} ${
          pl.dead ? "(mort)" : pl.run ? "(fuit)" : "(vivant)"
        }</li>`,
    ) +
    "</ul>";
  document.getElementById("game-container").innerText = "";
  document.getElementById("finalResult").innerHTML = result + scoresTable;
});
const draw = () => {
  if (myTurn && !game.state.includes("fight")) {
    socket.emit("draw");
  }
};
const fight = () => {
  if (myTurn && currentCard !== null) {
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
    document.getElementById("passBtn").disable = true;
    document.getElementById("fleeBtn").disable = true;
  }
};

const usePassiveItem = (player, itemNumber) => {
  if (
    myTurn &&
    player.items[itemNumber] &&
    !player.items[itemNumber].broken &&
    (Object.keys(player.items[itemNumber].passive).length > 0 ||
      player.items[itemNumber].hasOwnProperty("passiveDescription"))
  ) {
    socket.emit("use item passive", itemNumber);
  }
};
const useActiveItem = (player, itemNumber) => {
  if (
    myTurn &&
    player.items[itemNumber] &&
    !player.items[itemNumber].broken &&
    player.items[itemNumber].hasOwnProperty("activeDescription")
  ) {
    socket.emit("use item active", itemNumber);
  }
};

const reset = () => socket.emit("reset");
const updateCardDisplay = (card) =>
  (document.getElementById("currentCard").innerHTML = card
    ? `<span class='bold'>${card.power}</span> ${card.name}`
    : "");

// Modal functions
// Get the modal
const modal = document.getElementById("itemsModal");

// When the user clicks the button, open the modal
document.getElementById("itemsBtn").onclick = () => {
  displayItems();
  modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
document.getElementById("closeModalItems").onclick = () =>
  (modal.style.display = "none");

// When the user clicks anywhere outside of the modal, close it
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// displaying items in the modal
const displayItems = () => {
  const itemsList = document.getElementById("modal-content-items");
  let me = players.find((p) => p.id === socket.id);
  let content = me.items.map((item) => itemTemplate(item));
  itemsList.innerHTML = content.join("");
  for (let i = 0; i < itemsList.children.length; i++) {
    if (itemsList.children[i].getElementsByClassName("itemPassive").length > 0)
      itemsList.children[i].getElementsByClassName(
        "itemPassive",
      )[0].onclick = () => {
        usePassiveItem(me, i);
      };
    if (itemsList.children[i].getElementsByClassName("itemActive").length > 0)
      itemsList.children[i].getElementsByClassName(
        "itemActive",
      )[0].onclick = () => {
        useActiveItem(me, i);
      };
  }
};

// When an item is successfully used, close modal
socket.on("close modal", () => (modal.style.display = "none"));
