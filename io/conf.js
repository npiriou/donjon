const socketio = require("socket.io");
const { cardsList, itemsList } = require("./data.js");
module.exports = function (server) {
  // io server
  const io = socketio(server);

  //init
  let players = {};
  const game = {};
  let deck;
  game.state = "lobby";
  let currentCard = null;
  let order;
  let fleeRoll = null;

  const start = () => {
    deck = shuffle(buildDeck(cardsList));
    game.state = "game";
    game.turn = 1;
    // random player order
    order = shuffle(Object.values(players));
    for (let i = 0; i < order.length; i++) {
      order[i].order = i;
    }
    order[0].current = true;
  };
  const reset = () => {
    game.state = "lobby";
    game.turn = 0;
    players = {};
    io.emit("reset");
  };

  io.on("connection", (socket) => {
    if (game.state.includes("lobby")) {
      players[socket.id] = {
        ready: false,
        score: 0,
        name: "",
        hp: 20,
        dead: false,
        run: false,
        id: socket.id,
        current: false,
        beaten: [],
        drawThisTurn: 0,
      };

      // CHAT PART
      socket.emit("askName"); // ASK TO PLAYER A NAME

      socket.on("name", (name) => {
        players[socket.id].name = name; //GIVE NAME CHOOSEN TO PLAYER[SOCKET.ID]
        updateAll();
      });
      socket.on("ready", (ready) => {
        players[socket.id].ready = ready;
        if (Object.values(players).every((pl) => pl.ready)) {
          start();
          io.emit("game starts");
        }
        updateAll();
      });
    } else {
      // a game is currently taking place
      socket.emit("too late");
    }

    socket.on("draw", () => {
      // first check if it's the player's turn
      if (
        socket.id === findCurrentPlayer().id &&
        !game.state.includes("fight")
      ) {
        currentCard = drawCard(deck);
        io.emit("card draw", currentCard);
        game.state = "game fight";
        players[socket.id].drawThisTurn += 1;
        if (fleeRoll !== null) tryToRun(players[socket.id], fleeRoll);
        updateAll();
      }
    });
    socket.on("fight", () => {
      // first check if it's the player's turn
      if (socket.id === findCurrentPlayer().id) {
        players[socket.id].hp -= currentCard.power;
        if (players[socket.id].hp <= 0) {
          players[socket.id].hp = 0;
          players[socket.id].dead = true;
          io.emit("player dead", players[socket.id]);
          updateAll();
          if (Object.values(players).every((pl) => pl.dead || pl.run)) {
            gameOver();
            return;
          }
          passToNextPlayer();

          updateAll();
        } else {
          players[socket.id].beaten.push(currentCard);
          currentCard = null;
          if (deck.length === 0) {
            gameOver();
            return;
          }
          game.state = "game";
          io.emit("fight over");
          updateAll();
        }
      }
      updateAll();
    });

    socket.on("pass", () => {
      if (
        !game.state.includes("fight") &&
        players[socket.id].drawThisTurn > 0
      ) {
        passToNextPlayer();
        updateAll();
      }
    });
    socket.on("flee", () => {
      let currentPlayer = Object.values(players).find((pl) => pl.current);
      if (
        socket.id === findCurrentPlayer().id &&
        ((currentCard === null && currentPlayer.drawThisTurn > 0) ||
          (currentCard !== null && currentPlayer.drawThisTurn === 0))
      ) {
        fleeRoll = rollDice();
        io.emit("flee roll", fleeRoll, currentPlayer);
        // draw regularly if no current card
        if (currentCard !== null) {
          tryToRun(players[socket.id], fleeRoll);
        }

        updateAll();
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`a player disconnected because ${reason}`);
      delete players[socket.id];
      console.log(`${Object.values(players).length} left`);
      if (Object.values(players).length <= 1 && game.state === "game") reset();
      updateAll();
    });
    socket.on("reset", () => {
      reset();
    });

    function updateAll() {
      io.emit("lists", Object.values(players), game);
    }
    const passToNextPlayer = () => {
      // cant pass if alone
      if (order.length <= 1) return;

      // find whos turn it is
      let currentIndex = order.findIndex((pl) => pl.current);
      // change
      order[currentIndex].current = false;
      if (currentIndex === order.length - 1) order[0].current = true;
      else order[1 + currentIndex].current = true;

      // update whos current
      currentIndex = order.findIndex((pl) => pl.current);
      // reset count of cards drawThisTurn
      order[currentIndex].drawThisTurn = 0;

      // filter
      order = order.filter((pl) => !pl.dead && !pl.run);

      console.log(`updated order`);
      console.log(order);
    };
    const tryToRun = (player, roll) => {
      if (roll >= currentCard.power) {
        // player runs away successfully !!
        player.run = true;
        io.emit("player flee", player);
        updateAll();
        // check if game is over
        if (Object.values(players).every((pl) => pl.dead || pl.run)) {
          gameOver();
          return;
        }
        passToNextPlayer();
      }
    };
    const findCurrentPlayer = () =>
      Object.values(players).find((pl) => pl.current);
  });

  const gameOver = () => {
    game.state = "lobby";
    let result = "";
    if (Object.values(players).every((pl) => pl.dead)) {
      result = "Tout le monde est mort :(";
    }
    let contenders = Object.values(players).filter((pl) => !pl.dead);
    let winner = contenders.find(
      (p) =>
        p.beaten.length ==
        Math.max.apply(
          Math,
          contenders.map((p) => p.beaten.length),
        ),
    );

    if (Object.values(players).every((pl) => pl.dead || pl.run)) {
      winner;
      result = `Le donjon n'a pas été poncé`;
    }
    if (deck.length === 0) {
      result = `Le donjon a été poncé`;
    }
    io.emit("game over", result);
  };
};

const drawCard = (arr) => arr.splice(0, 1)[0];

const shuffle = (arr) => {
  let array = arr;
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
const buildDeck = (list) => {
  const deck = [];
  list.forEach((card) => {
    for (let i = 0; i < card.baseAmount; i++) {
      deck.push(card);
    }
  });
  return deck;
};
const rollDice = (min = 1, max = 6, mod = 0) =>
  min + Math.floor(Math.random() * (max - min + 1)) + mod;
