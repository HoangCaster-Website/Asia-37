const menuSearch = document.querySelector(".menu-search");
const menuQuery = menuSearch.elements.q;
const clearMenuSearch = menuSearch.querySelector('button[type="reset"]');
const searchStatus = menuSearch.querySelector(".menu-search-status");
const menuCategories = document.querySelector(".menu-jump");
const menuContent = document.querySelector(".menu-content");
const menuTools = document.querySelector(".menu-tools");
const menuLayout = menuTools.parentElement;
const categoryRows = new Map(Array.from(menuCategories.querySelectorAll("a"), (link) => [
  link.hash, link.closest("li"),
]));
const buffetResult = document.querySelector(".menu-buffet-result");
const buffetCategory = categoryRows.get("#buffet");

function searchWords(value) {
  const normalized = value.toLowerCase().normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/([aou])e/g, "$1");
  return normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
}

const buffetText = searchWords(buffetResult.querySelector("h3").textContent).join(" ");
const searchableSections = Array.from(menuContent.querySelectorAll(".menu-section"), (section) => {
  const heading = section.querySelector("h2");
  const category = categoryRows.get(`#${section.id || heading.id}`);
  const title = searchWords(heading.textContent).join(" ");
  const items = Array.from(section.querySelectorAll(".menu-item"), (element) => {
    const number = searchWords(element.querySelector(".item-number")?.textContent ?? "")[0];
    const variants = Array.from(element.querySelectorAll(".menu-variants dt"), (variant) => variant.textContent);
    const descriptions = [element.firstElementChild.textContent, ...variants].join(" ");
    return { element, number, text: `${title} ${searchWords(descriptions).join(" ")}` };
  });
  return { section, category, items };
});

function filterMenu() {
  const words = searchWords(menuQuery.value);
  const numberQuery = words.length === 1 && /^[a-z]*\d+$/.test(words[0]) ? words[0] : null;
  let menuMatches = 0;

  for (const { section, category, items } of searchableSections) {
    let sectionMatches = 0;
    for (const { element, number, text } of items) {
      const visible = numberQuery ? number === numberQuery : words.every((word) => text.includes(word));
      element.hidden = !visible;
      sectionMatches += Number(visible);
    }
    section.hidden = sectionMatches === 0;
    if (category) category.hidden = section.hidden;
    menuMatches += sectionMatches;
  }

  const buffetMatches = words.length > 0 && words.every((word) => buffetText.includes(word));
  buffetResult.hidden = !buffetMatches;
  buffetCategory.hidden = words.length > 0 && !buffetMatches;
  menuCategories.hidden = !Array.from(categoryRows.values()).some((row) => !row.hidden);
  menuContent.hidden = menuMatches === 0;
  clearMenuSearch.hidden = menuQuery.value === "";
  const matches = menuMatches + Number(buffetMatches);
  const resultMessage = matches
    ? `${matches} Treffer`
    : "Keine Treffer. Versuchen Sie einen anderen Suchbegriff.";
  searchStatus.textContent = words.length ? resultMessage : "";
}

menuQuery.addEventListener("input", filterMenu);
menuSearch.addEventListener("submit", (event) => event.preventDefault());
menuSearch.addEventListener("reset", (event) => {
  event.preventDefault();
  menuQuery.value = "";
  filterMenu();
  menuQuery.focus();
});

function updateMenuClearance() {
  menuLayout.style.setProperty("--menu-tools-height", `${menuTools.offsetHeight}px`);
}

document.querySelector(".specialty-grid").addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const item = document.getElementById(link.hash.slice(1));
  if (!item?.hidden) return;
  menuQuery.value = "";
  filterMenu();
  updateMenuClearance();
  if (window.location.hash === link.hash) item.scrollIntoView();
});

filterMenu();
menuSearch.hidden = false;
if ("ResizeObserver" in window) {
  updateMenuClearance();
  new ResizeObserver(updateMenuClearance).observe(menuTools);
  menuLayout.classList.add("menu-layout--sticky");
}
