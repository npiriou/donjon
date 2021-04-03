const saveName = () => {
  const name = document.getElementById("inputName").value;
  localStorage.setItem("name", name);
};

document.getElementById("inputName").value = localStorage.getItem("name")
  ? localStorage.getItem("name")
  : "";
