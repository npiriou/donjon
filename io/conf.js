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
    // distribute items
    let items = shuffle(itemsList);
    let nbItemsEach = nbStartingItems(Object.values(players).length);
    let it;
    for (const id in players) {
      players[id].items = [];
      for (let i = 0; i < nbItemsEach; i++) {
        it = drawCard(items);
        players[id].items.push(it);
      }
    }
    // triggers before game effects
    for (const id in players) {
      players[id].items.forEach((item) => {
        if (item.passive && item.passive.hasOwnProperty("bonusHP"))
          players[id].hp += item.passive.bonusHP;
        if (item.passive && item.passive.hasOwnProperty("bonusScore"))
          players[id].score += item.passive.bonusScore;
        if (item.passive && item.passive.hasOwnProperty("bonusRun"))
          players[id].bonusRun += item.passive.bonusRun;
      });
    }

    //misc
    deck = shuffle(buildDeck(cardsList));
    game.state = "game";
    game.turn = 1;
    // random player order
    order = shuffle(Object.values(players));
    // for (let i = 0; i < order.length; i++) {
    //   order[i].order = i;
    // }
    order[0].current = true;
  };
  const reset = () => {
    game.state = "lobby";
    game.turn = 0;
    currentCard = null;
    order = [];
    fleeRoll = null;
    for (const id in players) {
      if (Object.hasOwnProperty.call(players, id)) {
        players[id] = {
          //keeps name and id and dilpomas
          ...players[id],
          ready: false,
          score: 0,
          hp: 3,
          dead: false,
          run: false,
          current: false,
          beaten: [],
          drawThisTurn: 0,
          bonusRun: 0,
          status: [],
          items: [],
          winner: false,
        };
      }
    }
    io.emit("reset");
  };

  const hardReset = () => {
    game.state = "lobby";
    game.turn = 0;
    currentCard = null;
    order = [];
    fleeRoll = null;
    players = {};
    io.emit("reset");
  };
  io.on("connection", (socket) => {
    if (game.state.includes("lobby")) {
      players[socket.id] = {
        ready: false,
        score: 0,
        name: "",
        hp: 3,
        dead: false,
        run: false,
        id: socket.id,
        current: false,
        beaten: [],
        drawThisTurn: 0,
        bonusRun: 0,
        status: [],
        diplomas: 0,
      };

      // CHAT PART
      socket.emit("askName"); // ASK TO PLAYER A NAME

      socket.on("name", (name) => {
        players[socket.id].name = name; //GIVE NAME CHOOSEN TO PLAYER[SOCKET.ID]
        updateAll();
      });
      socket.on("ready", (ready) => {
        if (!game.state.includes("lobby")) return;

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
      if (game.state.includes("lobby")) return;

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
      if (game.state.includes("lobby")) return;

      // first check if it's the player's turn and there is a mob to fight
      if (socket.id === findCurrentPlayer().id && currentCard !== null) {
        players[socket.id].hp -= currentCard.power;
        if (players[socket.id].hp <= 0) {
          onDeath(socket.id);
        } else {
          io.emit(
            "info",
            `${currentCard.name} est tanké par ${players[socket.id].name}, ${
              players[socket.id].hp
            } PV restants`,
          );
          mobBeatenByPlayer(socket.id);
          updateAll();
        }
      }
      updateAll();
    });

    socket.on("pass", () => {
      if (game.state.includes("lobby")) return;

      if (
        !game.state.includes("fight") &&
        players[socket.id].drawThisTurn > 0
      ) {
        passToNextPlayer();
        updateAll();
      }
    });
    socket.on("flee", () => {
      if (game.state.includes("lobby")) return;

      let currentPlayer = findCurrentPlayer();
      if (
        fleeRoll === null &&
        socket.id === currentPlayer.id &&
        (currentCard === null ||
          (currentCard !== null && currentPlayer.drawThisTurn === 0))
      ) {
        fleeRoll = rollDice(1, 6, currentPlayer.bonusRun);
        io.emit("flee roll", fleeRoll, currentPlayer);
        // draw regularly if no current card
        if (currentCard !== null) {
          tryToRun(players[socket.id], fleeRoll);
        }

        updateAll();
      }
    });
    socket.on("use item passive", (itemNumber) => {
      if (game.state.includes("lobby")) return;

      let item = players[socket.id].items[itemNumber];
      /*check if
        -players turn
        -player has item number itemnumber 
              - item is not broken 
              -item has passive
              -passive does something in the current state */
      if (
        socket.id === findCurrentPlayer().id &&
        item &&
        !item.broken &&
        Object.keys(item.passive).length > 0
      ) {
        // loops over passives and tries to use one, hopefully most item have only one or two
        let passives = item.passive;

        for (const [key, value] of Object.entries(passives)) {
          if (key.includes("changeHP")) {
            let hpBefore = players[socket.id].hp;
            let hpAfter = value(players[socket.id].hp);

            players[socket.id].hp = hpAfter;
            io.emit(
              "info",
              ` ${players[socket.id].name} utilise ${
                item.name
              }, ses PV passent de ${hpBefore} à ${hpAfter}`,
            );
          }
          if (currentCard !== null) {
            if (
              //if mob is ignored either due to its power or family
              (key.includes("ignorePower") &&
                value.includes(currentCard.power)) ||
              (key.includes("ignoreFamilyId") &&
                value.includes(currentCard.familyId))
            ) {
              socket.emit("close modal");
              io.emit(
                "info",
                `${currentCard.name} est ignoré par ${
                  players[socket.id].name
                } avec ${item.name}`,
              );
              mobBeatenByPlayer(socket.id);
              break;
            } else if (
              //if mob is lifestealed either due to its power or family
              (key.includes("lifestealPower") &&
                value.includes(currentCard.power)) ||
              (key.includes("lifestealFamilyId") &&
                value.includes(currentCard.familyId))
            ) {
              socket.emit("close modal");
              players[socket.id].hp += currentCard.power;
              io.emit(
                "info",
                `${currentCard.name} est absorbé par ${
                  players[socket.id].name
                } avec ${item.name} (+${currentCard.power} PV)`,
              );
              mobBeatenByPlayer(socket.id);
            } else if (key.includes("ignoreFct")) {
              //if item has an ignore fct: (power,dice) => [ignored,broken]
              const rollDiceForItem = rollDice(1, 6);
              const [ignored, broken] = value(
                currentCard.power,
                rollDiceForItem,
                players[socket.id].hp,
              );
              if (!item.alreadyUsed) {
                if (broken) {
                  onBreaks(item, socket.id);
                }
                if (ignored) {
                  //if mob is killed
                  socket.emit("close modal");
                  io.emit(
                    "info",
                    `${currentCard.name} est ignoré par ${
                      players[socket.id].name
                    } avec ${item.name} ${
                      item.useDice ? `sur un jet de ${rollDiceForItem}` : ``
                    }`,
                  );
                  mobBeatenByPlayer(socket.id);
                } else if (item.useDice) {
                  // if not ignored and used dice => dice failed
                  io.emit(
                    "info",
                    `${
                      players[socket.id].name
                    } fait un jet de ${rollDiceForItem} avec ${
                      item.name
                    }, ce n'est pas suffisant`,
                  );
                }
                item.alreadyUsed = true;
              }
            }
          }
        }
        updateAll();
      }
    });
    socket.on("use item active", (itemNumber) => {
      if (game.state.includes("lobby")) return;

      let item = players[socket.id].items[itemNumber];
      /*check if
        -players turn
        -player has item number itemnumber 
              - item is not broken 
              -item has act
              -act does something in the current state */
      if (
        socket.id === findCurrentPlayer().id &&
        item &&
        !item.broken &&
        Object.keys(item.active).length > 0
      ) {
        io.emit(
          //emit a efault messages that will disappear instantly if anything happens
          "info",
          `⚡  ${players[socket.id].name} active ${item.name}`,
        );
        // loops over actives and tries to use one, hopefully most item have only one or two
        let actives = item.active;
        for (const [key, value] of Object.entries(actives)) {
          // actif changement de PVs du joueur
          if (key.includes("changeHP")) {
            let hpBefore = players[socket.id].hp;
            let hpAfter = value(players[socket.id].hp);

            players[socket.id].hp = hpAfter;
            io.emit(
              "info",
              `⚡  ${players[socket.id].name} active ${
                item.name
              }, ses PV passent de ${hpBefore} à ${hpAfter}`,
            );
          }

          //actif passe tour
          if (key.includes("passTurn")) {
            passToNextPlayer();
          }
          // si le joueur est en combat
          if (currentCard !== null) {
            if (
              //if mob is ignored due to its power
              key.includes("ignorePower") &&
              value(currentCard.power) //  ex value:(x)=>x%2===1 for ignore odd
            ) {
              socket.emit("close modal");
              io.emit(
                "info",
                `${currentCard.name} est ignoré par ${
                  players[socket.id].name
                } avec ${item.name}`,
              );
              mobBeatenByPlayer(socket.id);
            } else if (
              //if mob is lifestealed  due to its power
              key.includes("lifestealPower") &&
              value(currentCard.power)
            ) {
              socket.emit("close modal");
              players[socket.id].hp += currentCard.power;
              io.emit(
                "info",
                `⚡ ${currentCard.name} est absorbé par ${
                  players[socket.id].name
                } avec ${item.name} (+${currentCard.power} PV)`,
              );
              mobBeatenByPlayer(socket.id);
            }
          }
        }
        if (players[socket.id].hp <= 0) {
          onDeath(socket.id);
        }
        onBreaks(item, socket.id);
        updateAll();
      }
    });
    socket.on("disconnect", (reason) => {
      console.log(`a player disconnected because ${reason}`);
      io.emit("info", `Un joueur s'est deconnecté`);
      if (game.state.includes("game") && socket.id === findCurrentPlayer().id)
        passToNextPlayer();
      delete players[socket.id];
      console.log(`${Object.values(players).length} still in game`);
      if (Object.values(players).length <= 1 && game.state === "game")
        hardReset();
      updateAll();
    });
    socket.on("reset", () => {
      hardReset();
    });

    function updateAll() {
      io.emit("lists", Object.values(players), game);
    }
    const onBreaks = (item, id) => {
      item.broken = true;
      if (item.passive && item.passive.hasOwnProperty("bonusHP"))
        players[id].hp -= item.passive.bonusHP;
      if (item.passive && item.passive.hasOwnProperty("bonusScore"))
        players[id].score -= item.passive.bonusScore;
      if (item.passive && item.passive.hasOwnProperty("bonusRun"))
        players[id].bonusRun -= item.passive.bonusRun;

      if (players[id].hp <= 0) onDeath(id);
    };
    const onDeath = (id) => {
      players[id].hp = 0;
      players[id].dead = true;
      io.emit("player dead", players[id]);
      updateAll();
      if (Object.values(players).every((pl) => pl.dead || pl.run)) {
        gameOver();
        return;
      }
      passToNextPlayer();
      updateAll();
    };
    const passToNextPlayer = () => {
      // cant pass if alone
      if (order.length <= 1) return;

      // find whos turn it is
      let currentIndex = order.findIndex((pl) => pl.current);

      // change
      order[currentIndex].current = false;
      if (currentIndex === order.length - 1) order[0].current = true;
      else order[1 + currentIndex].current = true;

      // filter
      order = order.filter((pl) => !pl.dead && !pl.run);

      // update whos current
      currentIndex = order.findIndex((pl) => pl.current);

      // reset count of cards drawThisTurn
      order[currentIndex].drawThisTurn = 0;
    };
    const tryToRun = (player, roll) => {
      fleeRoll = null;
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
      // io.emit("info", `Le jet de fuite n'est pas suffisant !`);
    };
    const findCurrentPlayer = () => {
      let current = Object.values(players).find((pl) => pl.current);
      if (current === undefined) console.log("no current found", players);
      return current;
    };
    const gameOver = () => {
      let result = "";

      if (Object.values(players).every((pl) => pl.dead)) {
        result = "Tout le monde est mort :(";
      }
      // let contenders = Object.values(players).filter((pl) => !pl.dead);
      else if (Object.values(players).every((pl) => pl.dead || pl.run)) {
        result = `<div>Le donjon n'a pas été poncé</div>`;
        players[winnerId(players, false)].diplomas += 1;
        players[winnerId(players, false)].winner = true;
      } else if (deck.length === 0) {
        result = `<div>Le donjon a été poncé</div>`;
        players[winnerId(players, true)].diplomas += 1;
        players[winnerId(players, true)].winner = true;
      }
      updateAll();
      io.emit("game over", result);
      reset();
      updateAll();
    };
  });

  const mobBeatenByPlayer = (id) => {
    Object.values(players).forEach((pl) => {
      pl.items.forEach((it) => (it.alreadyUsed = false));
    });
    fleeRoll = null;
    players[id].beaten.push(currentCard);
    currentCard = null;
    if (deck.length === 0) {
      gameOver();
      return;
    }
    game.state = "game";
    io.emit("fight over");
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
const nbStartingItems = (nbPl) => {
  switch (nbPl) {
    case 1:
      return 10;
    case 2:
      return 8;
    case 3:
      return 6;
    case 4:
      return 6;
    default:
      return 5;
  }
};
const randomValueFromArray = (myArray) =>
  myArray[Math.floor(Math.random() * myArray.length)];

const getAllIndexes = (arr, val) => {
  const indexes = [];
  for (let i = 0; i < arr.length; i++) if (arr[i] === val) indexes.push(i);
  return indexes;
};

const winnerId = (players, ponce) => {
  const playersArr = ponce
    ? Object.values(players).filter((pl) => !pl.run && !pl.dead)
    : Object.values(players).filter((pl) => !pl.dead);

  const onlyScores = playersArr.map((pl) => pl.score + pl.beaten.length);

  const maxScore = Math.max(...onlyScores);

  const winnersArr = getAllIndexes(onlyScores, maxScore);

  return playersArr[randomValueFromArray(winnersArr)].id;
};
