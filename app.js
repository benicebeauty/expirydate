const CATALOG = [
  ["Bacon", 6], ["Bacon (FROZEN)", 10], ["BBQ sauce", 10], ["Beef", 9],
  ["Burger Sauce", 14], ["Cheese Sauce", 8], ["Cheese String - Garlic & Herb", 7],
  ["Chicken", 9], ["Chicken Boneless Bites", 10], ["Chicken Kickers", 10],
  ["Chicken Strippers", 10], ["Chicken Tenders", 10], ["Chicken Wings", 9],
  ["Chorizo", 12], ["Cookies", 17], ["Dominos Cookies with Creme Egg", 14],
  ["Double Chocolate & Caramel Cookies", 14], ["Fries", 7], ["Garlic Butter", 10],
  ["Goats Cheese", 14], ["Habanero Hot Honey", 35], ["Ham", 6], ["Hot Dog Slices", 9],
  ["Jalapeno Green", 11], ["Liquid Cheese", 6], ["Mac n Cheese", 6], ["Meatballs", 9],
  ["Mozzarella Cheese - Delight", 9], ["Mozzarella Cheese - Standard", 9],
  ["Nduja Sausage", 12], ["NEW Biscoff Crumb", 30], ["NEW Chinese Style Chicken", 9],
  ["Olives", 10], ["Pepperdew Piquante Peppers", 26], ["Pepperoni", 12],
  ["Pesto Drizzle", 21], ["Pineapple", 10], ["Pizza Sauce", 10],
  ["Pizza Sauce Pro-Bake Drizzle", 10], ["Plant-Based Cheese Alternative", 7],
  ["Potato Wedges", 7], ["Sausage", 6], ["Sliced Gherkins", 16],
  ["Sundried Tomato and Garlic", 10], ["Sweetcorn", 11], ["Tandoori Chicken", 10],
  ["Thin Crust Shells - (All sizes)", 21], ["Tuna", 6], ["Wraps", 22]
].sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase(), "en"));

const STORAGE_KEY = "expiry-date-web-v1";
const catalogMap = new Map(CATALOG.map(([name, days]) => [name.toLowerCase(), days]));
let products = loadProducts();
let editingName = null;

const $ = (id) => document.getElementById(id);
const views = { home: $("home-view"), add: $("add-view"), products: $("products-view") };

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) return normalizeProducts(saved);
  } catch (_) { /* Start with the built-in catalog if saved data is unreadable. */ }
  return CATALOG.map(([name, days]) => ({ name, shelfLifeDays: days }));
}

function normalizeProducts(items) {
  const unique = new Map();
  for (const item of items) {
    const name = String(item?.name || "").trim();
    if (!name) continue;
    const fixed = catalogMap.get(name.toLowerCase());
    const days = fixed || Number(item.shelfLifeDays) || 1;
    unique.set(name.toLowerCase(), { name, shelfLifeDays: days });
  }
  return [...unique.values()].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), "en"));
}

function saveProducts() { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
function formatDate(date) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date); }
function expiryDate(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days - 1);
  return formatDate(date);
}
function productByName(name) { return products.find(p => p.name.toLowerCase() === name.toLowerCase()); }

function showView(name) {
  Object.entries(views).forEach(([key, view]) => { view.hidden = key !== name; });
  $("menu").hidden = true;
  $("menu-button").setAttribute("aria-expanded", "false");
  if (name === "products") renderProducts();
  if (name === "add") resetAddForm();
  if (name === "home") { $("search").value = ""; $("suggestions").replaceChildren(); $("expiry-result").hidden = true; }
}

function resetAddForm() {
  editingName = null;
  $("product-name").value = "";
  $("shelf-life").value = "";
  $("shelf-life").disabled = false;
  $("fixed-shelf-note").hidden = true;
  $("add-message").textContent = "";
  $("save-product").textContent = "Save product";
}

function renderCatalogOptions() {
  const select = $("catalog-select");
  select.replaceChildren(new Option("Choose a product…", ""));
  CATALOG.forEach(([name, days]) => select.add(new Option(`${name} — ${days} days`, name)));
}

function renderProducts() {
  const list = $("product-list");
  list.replaceChildren();
  if (!products.length) { list.textContent = "No products yet."; return; }
  products.forEach(product => {
    const card = document.createElement("article"); card.className = "product-card";
    if (editingName === product.name) {
      const fields = document.createElement("div"); fields.className = "edit-fields";
      const nameInput = document.createElement("input"); nameInput.value = product.name; nameInput.setAttribute("aria-label", "Product name");
      const daysInput = document.createElement("input"); daysInput.type = "number"; daysInput.min = "1"; daysInput.value = product.shelfLifeDays; daysInput.setAttribute("aria-label", "Shelf life in days");
      const actions = document.createElement("div"); actions.className = "product-actions";
      const cancel = document.createElement("button"); cancel.textContent = "Cancel"; cancel.onclick = () => { editingName = null; renderProducts(); };
      const save = document.createElement("button"); save.textContent = "Save"; save.onclick = () => {
        const newName = nameInput.value.trim(), days = Number(daysInput.value);
        if (!newName || !Number.isInteger(days) || days < 1) { $("products-message").textContent = "Enter a product name and a shelf life greater than 0."; return; }
        if (products.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.name !== product.name)) { $("products-message").textContent = "That product name already exists."; return; }
        const fixed = catalogMap.get(newName.toLowerCase());
        products = normalizeProducts(products.map(p => p === product ? { name: newName, shelfLifeDays: fixed || days } : p));
        editingName = null; saveProducts(); renderProducts();
      };
      actions.append(cancel, save); fields.append(nameInput, daysInput, actions); card.append(fields);
    } else {
      const info = document.createElement("div"); info.className = "product-info";
      const text = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = product.name;
      const detail = document.createElement("small"); detail.textContent = `Shelf life: ${product.shelfLifeDays} days`;
      text.append(title, detail); info.append(text); card.append(info);
      const actions = document.createElement("div"); actions.className = "product-actions";
      const edit = document.createElement("button"); edit.textContent = "Edit"; edit.onclick = () => { editingName = product.name; renderProducts(); };
      const remove = document.createElement("button"); remove.textContent = "Delete"; remove.onclick = () => {
        if (window.confirm(`Delete ${product.name} from your product list?`)) { products = products.filter(p => p !== product); saveProducts(); renderProducts(); }
      };
      actions.append(edit, remove); card.append(actions);
    }
    list.append(card);
  });
}

$("today").textContent = `Today: ${formatDate(new Date())}`;
renderCatalogOptions();
$("menu-button").addEventListener("click", () => {
  const menu = $("menu"); menu.hidden = !menu.hidden; $("menu-button").setAttribute("aria-expanded", String(!menu.hidden));
});
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
$("search").addEventListener("input", () => {
  const query = $("search").value.trim().toLowerCase();
  const suggestions = $("suggestions"); suggestions.replaceChildren(); $("expiry-result").hidden = true;
  if (!query) return;
  const matches = products.filter(p => p.name.toLowerCase().startsWith(query));
  if (!matches.length) { suggestions.textContent = "No matching products"; return; }
  matches.forEach(product => {
    const button = document.createElement("button"); button.className = "suggestion"; button.textContent = product.name;
    button.onclick = () => { $("search").value = ""; suggestions.replaceChildren(); $("result-name").textContent = product.name; $("result-date").textContent = `Expires: ${expiryDate(product.shelfLifeDays)}`; $("expiry-result").hidden = false; };
    suggestions.append(button);
  });
});
$("catalog-select").addEventListener("change", () => {
  const name = $("catalog-select").value;
  if (!name) return;
  $("product-name").value = name;
  const existing = productByName(name);
  $("shelf-life").value = existing?.shelfLifeDays ?? catalogMap.get(name.toLowerCase());
  $("shelf-life").disabled = Boolean(existing);
  $("fixed-shelf-note").hidden = !existing;
});
$("product-name").addEventListener("input", () => {
  const product = productByName($("product-name").value.trim());
  $("shelf-life").disabled = Boolean(product);
  $("fixed-shelf-note").hidden = !product;
  if (product) $("shelf-life").value = product.shelfLifeDays;
});
$("save-product").addEventListener("click", () => {
  const name = $("product-name").value.trim();
  const known = productByName(name);
  const days = known?.shelfLifeDays ?? Number($("shelf-life").value);
  const message = $("add-message");
  if (!name || !Number.isInteger(days) || days < 1) { message.textContent = "Enter a product name and a shelf life greater than 0."; return; }
  if (!known) products = normalizeProducts([...products, { name, shelfLifeDays: days }]);
  saveProducts();
  $("result-name").textContent = name; $("result-date").textContent = `Expires: ${expiryDate(days)}`;
  showView("home"); $("expiry-result").hidden = false;
});
$("export-button").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(products.map(p => ({ name: p.name, shelfLifeDays: p.shelfLifeDays })), null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "expiry-date-products.json"; link.click(); URL.revokeObjectURL(link.href);
});
$("import-button").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", async event => {
  try {
    const parsed = JSON.parse(await event.target.files[0].text());
    if (!Array.isArray(parsed)) throw new Error("Expected a product list");
    products = normalizeProducts([...products, ...parsed]); saveProducts(); renderProducts(); $("products-message").textContent = "Product list imported.";
  } catch (_) { $("products-message").textContent = "Import failed. Choose a valid product list file."; }
  event.target.value = "";
});
