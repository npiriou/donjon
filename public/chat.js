const writePlayers = (players, game) => {
  // UPDATE PLAYERS DISPLAY AND SCORES
  const parent = document.querySelector("#listPlayers");
  players.forEach((pl) => {
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
      for (let i = 0; i < pl.diplomas; i++) {
        el.innerText += " 🎓";
      }
    }
  });
  // if some players are written but not in game anymore, delete them
  Array.from(parent.children).forEach((el) => {
    if (!players.some((player) => player.id === el.id)) {
      parent.removeChild(document.getElementById(el.id));
    }
  });
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
const newInfo = (inf) => (document.getElementById("info").innerText = inf);

const itemTemplate = (item) => {
  let broken = item.broken ? "broken" : "notBroken";
  let bonusHP = "";
  let bonusRun = "";
  let ignoreFamily = "";
  let ignorePower = "";
  let bonusScore = "";
  let lifestealPower = "";
  let lifestealFamily = "";
  let activeDescription = "";
  let passiveDescription = "";

  if (item.passive.hasOwnProperty("bonusHP"))
    // print bonus HP
    bonusHP = `<span class="itemCardBodySpan-bonusPV">PV ${
      item.passive.bonusHP > 0 ? "+" : ""
    }${item.passive.bonusHP}</span>`;
  if (item.passive.hasOwnProperty("bonusRun"))
    // print bonusRun
    bonusRun = `<span class="itemCardBodySpan-bonusRun">Jet de fuite ${
      item.passive.bonusRun > 0 ? "+" : ""
    }${item.passive.bonusRun}</span>`;
  if (item.passive.hasOwnProperty("ignoreFamilyId")) {
    // print ignore family
    ignoreFamily = `<span class="itemCardBodySpan-ignoreFamily">Ignore les ${item.passive.ignoreFamilyId
      .map((id) => nameFromFamilyId(id, true))
      .join(" et ")}</span>`;
  }
  if (item.passive.hasOwnProperty("lifestealFamilyId")) {
    // print ignore family
    lifestealFamily = `<span class="itemCardBodySpan-lifestealFamily">Absorbe les ${item.passive.lifestealFamilyId
      .map((id) => nameFromFamilyId(id, true))
      .join(" et ")}</span>`;
  }
  if (item.passive.hasOwnProperty("ignorePower")) {
    // print ignore power
    ignorePower = `<span class="itemCardBodySpan-ignorePower">Ignore les Monstres de puissance ${item.passive.ignorePower.join(
      " et ",
    )}</span>`;
  }
  if (item.passive.hasOwnProperty("lifestealPower")) {
    // print ignore power
    lifestealPower = `<span class="itemCardBodySpan-lifestealPower">Absorbe les Monstres de puissance ${item.passive.lifestealPower.join(
      " et ",
    )}</span>`;
  }
  if (item.passive.hasOwnProperty("bonusScore")) {
    // print bonus Score
    bonusScore = `<span class="itemCardBodySpan-bonusScore">Score final ${
      item.passive.bonusScore > 0 ? "+" : ""
    }${item.passive.bonusScore}</span>`;
  }
  if (item.hasOwnProperty("passiveDescription")) {
    passiveDescription = `<span class="itemCardBodySpan-passiveDescription">
    ${item.passiveDescription}
  </span>`;
  }
  if (item.hasOwnProperty("activeDescription")) {
    activeDescription = `<div class="itemActive">
    ⚡: ${item.activeDescription}
  </div>`;
  }

  return `<div class="itemCard ${broken}">
            <div class="card__caption">
              <div class="itemCardHeader">${item.name}
              </div>
              <div class="itemCardBody">
                <div class="itemPassive">  ${bonusHP}
                                          ${bonusScore}
                                          ${bonusRun}
                                          ${ignoreFamily}
                                          ${ignorePower}
                                          ${lifestealFamily}
                                          ${lifestealPower}
                                          ${passiveDescription}
                </div>
                ${activeDescription}
              </div>
            </div>
          </div>`;
};

const nameFromFamilyId = (id, plural) => {
  let name;
  switch (id) {
    case 0:
      name = "Rat";
      break;
    case 1:
      name = "Gobelin";
      break;
    case 2:
      name = "Squelette";
      break;
    case 3:
      name = "Orc";
      break;
    case 4:
      name = "Vampire";
      break;
    case 5:
      name = "Golem";
      break;
    case 6:
      name = "Liche";
      break;
    case 7:
      name = "Démon";
      break;
    case 9:
      name = "Dragon";
      break;
    default:
      name = "???";
      break;
  }
  return plural ? name + "s" : name;
};
