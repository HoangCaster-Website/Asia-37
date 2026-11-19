const menuSearch = document.querySelector(".menu-search");
const menuQuery = menuSearch.elements.q;
const clearMenuSearch = menuSearch.querySelector('button[type="reset"]');
const searchStatus = menuSearch.querySelector(".menu-search-status");
const menuCategories = document.querySelector(".menu-jump");
const menuContent = document.querySelector(".menu-content");
const categoryRows = new Map(Array.from(menuCategories.querySelectorAll("a"), (link) => [
  link.hash, link.closest("li"),
]));
const buffet = document.querySelector("#buffet");

function searchWords(value) {
  const normalized = value.toLowerCase().normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/([aou])e/g, "$1");
  return normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
}

const searchableSections = [...menuContent.querySelectorAll(".menu-section"), buffet].map((section) => {
  const heading = section.querySelector("h2");
  const category = categoryRows.get(`#${section.id || heading.id}`);
  const title = searchWords(heading.textContent).join(" ");
  const items = Array.from(section.querySelectorAll(".menu-item"), (element) => ({
    element,
    text: `${title} ${searchWords(element.firstElementChild.textContent).join(" ")}`,
  }));
  if (section === buffet) {
    items.push({ element: section, text: title });
  }
  return { section, category, items };
});

function filterMenu() {
  const words = searchWords(menuQuery.value);
  let matches = 0;
  let menuMatches = 0;

  for (const { section, category, items } of searchableSections) {
    let sectionMatches = 0;
    for (const { element, text } of items) {
      const visible = words.every((word) => text.includes(word));
      element.hidden = !visible;
      sectionMatches += Number(visible);
    }
    section.hidden = sectionMatches === 0;
    if (category) category.hidden = section.hidden;
    matches += sectionMatches;
    if (section !== buffet) menuMatches += sectionMatches;
  }

  menuCategories.hidden = !Array.from(categoryRows.values()).some((row) => !row.hidden);
  menuContent.hidden = menuMatches === 0;
  clearMenuSearch.hidden = menuQuery.value === "";
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

filterMenu();
menuSearch.hidden = false;
