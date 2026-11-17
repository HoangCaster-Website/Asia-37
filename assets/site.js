const navigationButton = document.querySelector(".nav-toggle");
const navigation = document.querySelector("#main-nav");
const mobileNavigation = window.matchMedia("(max-width: 760px)");

function closeNavigation() {
  navigationButton.setAttribute("aria-expanded", "false");
}

navigationButton.hidden = false;
navigationButton.addEventListener("click", () => {
  const expanded = navigationButton.getAttribute("aria-expanded") === "true";
  navigationButton.setAttribute("aria-expanded", String(!expanded));
});

navigation.addEventListener("click", (event) => {
  if (mobileNavigation.matches && event.target.closest("a")) {
    closeNavigation();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigationButton.getAttribute("aria-expanded") === "true") {
    closeNavigation();
    navigationButton.focus();
  }
});

mobileNavigation.addEventListener("change", closeNavigation);
