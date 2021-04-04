const writePlayers = (players, game) => {
  // UPDATE PLAYERS DISPLAY AND SCORES
  const parent = document.querySelector("#listPlayers");
  players.forEach((pl) => {
    const id = pl.id;

    if (!Array.from(parent.children).some((e) => e.id === pl.id)) {
      // if some players arent on the list yet
      const el = document.createElement("li");
      el.id = pl.id;
      el.innerText = `${pl.name} ❌`;
      parent.appendChild(el);
    } else {
      // update players who are here already
      const el = document.getElementById(pl.id);
      const ready = pl.ready ? "✔️" : "❌";
      const current = pl.current ? "➡️" : "";
      el.innerText = game.state.includes("lobby")
        ? `${pl.name} ${ready}`
        : pl.dead
        ? `${pl.name} (mort)`
        : pl.run
        ? `${pl.name} : ${pl.beaten.length + pl.score} pts posés`
        : `${current}${pl.name} : ${pl.hp}pv, ${pl.beaten.length} dans la pile`;
    }
  });
  // if some players are written but not in game anymore, delete them
  Array.from(parent.children).forEach((el) => {
    if (!players.some((player) => player.id === el.id)) {
      parent.removeChild(document.getElementById(el.id));
    }
  });
  // update display of whos plyer is the turn
  // let currentPlayer = players.find((pl) => pl.current);
  // if (currentPlayer && game.state.includes("game"))
  //   document.getElementById(
  //     "whoseTurn",
  //   ).innerText = `Au tour de ${currentPlayer.name}`;
};

const askName = () => {
  let name = localStorage.getItem("name");
  name = name !== "" ? name : "Anon" + Math.floor(Math.random() * 10000);
  socket.emit("name", name);
};

const ready = () => {
  let ready = document.getElementById("readyCheck").checked;
  socket.emit("ready", ready);
};

socket.on("askName", askName);

socket.on("too late", () => {
  document.getElementById("page").innerText =
    "Désolé la partie a déjà commencé, reviens plus tard...";
});
