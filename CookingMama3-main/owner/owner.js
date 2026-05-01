import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = {
  apiKey:            "AIzaSyCEAcwTKoSnUkbaGvjrsy1QZ-Duj12WImk",
  authDomain:        "cookingmamauwu-9902c.firebaseapp.com",
  projectId:         "cookingmamauwu-9902c",
  storageBucket:     "cookingmamauwu-9902c.firebasestorage.app",
  messagingSenderId: "18763902036",
  appId:             "1:18763902036:web:a8703f75e5ddf1d1b791c1"
};
const OWNER_EMAIL = "azaharulislam171@gmail.com";

const app  = initializeApp(CFG);
const auth = getAuth(app);
const db   = getFirestore(app);

// Per-role rates stored in localStorage
const ROLES_LIST = ["Owner", "Manager", "Chef", "Waiter", "Staff"];
const DEFAULT_RATES = { Owner: 25, Manager: 20, Chef: 18, Waiter: 15, Staff: 14 };

function loadRates() {
  const saved = localStorage.getItem("mama-role-rates");
  if (saved) {
    try { return { ...DEFAULT_RATES, ...JSON.parse(saved) }; } catch { /* */ }
  }
  return { ...DEFAULT_RATES };
}
function saveRates(rates) {
  localStorage.setItem("mama-role-rates", JSON.stringify(rates));
}
function rateForRole(role, rates) {
  return rates[role] || rates["Staff"] || 15;
}

let rates = loadRates();

// Populate inputs from saved rates
ROLES_LIST.forEach(r => {
  const el = document.getElementById(`rate-${r}`);
  if (el) el.value = rates[r] ?? DEFAULT_RATES[r];
});

// Theme
const th = localStorage.getItem("mama-theme") || "dark";
document.documentElement.setAttribute("data-theme", th);
document.getElementById("themeBtn").textContent = th === "dark" ? "Light Mode" : "Dark Mode";
document.getElementById("themeBtn").addEventListener("click", () => {
  const c = document.documentElement.getAttribute("data-theme");
  const n = c === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem("mama-theme", n);
  document.getElementById("themeBtn").textContent = n === "dark" ? "Light Mode" : "Dark Mode";
});

// Hamburger
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});

// Nav dropdown
document.getElementById("navDdBtn")?.addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById("navDdMenu").classList.toggle("open");
});
document.addEventListener("click", () => {
  document.getElementById("navDdMenu")?.classList.remove("open");
});

// Mobile menu rebuild
function buildMobileMenu() {
  const t   = document.documentElement.getAttribute("data-theme");
  const mob = document.getElementById("mobileMenu");
  mob.innerHTML = `
    <button class="nav-dd-item-mobile" onclick="window.location.href='../customer/customer.html'">Customer Menu</button>
    <button class="nav-dd-item-mobile" onclick="window.location.href='../chef/chef.html'">Chef Dashboard</button>
    <button class="nav-dd-item-mobile" onclick="window.location.href='../manager/manager.html'">Manager</button>
    <button class="nav-dd-item-mobile" onclick="window.location.href='../employee/employee.html'">Time Tracker</button>
    <button class="theme-btn" id="mobileThemeBtn">${t === "dark" ? "Light Mode" : "Dark Mode"}</button>
    <button class="sign-out-btn" id="mobileSignOut">Sign Out</button>`;
  document.getElementById("mobileThemeBtn")?.addEventListener("click", () => {
    document.getElementById("themeBtn").click();
    const newT = document.documentElement.getAttribute("data-theme");
    document.getElementById("mobileThemeBtn").textContent = newT === "dark" ? "Light Mode" : "Dark Mode";
  });
  document.getElementById("mobileSignOut")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "../signup/signup.html";
  });
}

// Auth
onAuthStateChanged(auth, user => {
  document.getElementById("authLoader").style.display = "none";
  if (!user) { window.location.href = "../signup/signup.html"; return; }
  if (user.email !== OWNER_EMAIL) { window.location.href = "../customer/customer.html"; return; }

  document.getElementById("navAvatar").src = user.photoURL || "";
  document.getElementById("navName").textContent = user.displayName?.split(" ")[0] || "Owner";
  document.getElementById("mainNav").style.display = "flex";
  document.getElementById("pageContent").style.display = "block";
  buildMobileMenu();
  listenAll();
  buildRecipes();
});

document.getElementById("btnSignOut").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../signup/signup.html";
});

// Save rates button
document.getElementById("wageRateSave").addEventListener("click", () => {
  ROLES_LIST.forEach(r => {
    const el = document.getElementById(`rate-${r}`);
    if (el) rates[r] = parseFloat(el.value) || DEFAULT_RATES[r];
  });
  saveRates(rates);
  recalcAll();
  showToast("Hourly rates saved");
});

// Data
let orders = [], sessions = [], inventory = [];

function listenAll() {
  onSnapshot(query(collection(db, "orders"), orderBy("time", "desc")), snap => {
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    recalcAll();
  });
  onSnapshot(query(collection(db, "timeSessions"), orderBy("clockIn", "asc")), snap => {
    sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    recalcAll();
  });
  onSnapshot(query(collection(db, "inventory"), orderBy("createdAt", "asc")), snap => {
    inventory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    recalcAll();
  });
}

function recalcAll() {
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  // Build per-employee map, using their role's rate
  const empMap = {};
  sessions.filter(s => s.hoursWorked != null).forEach(s => {
    const k = s.uid || s.email || s.userName;
    if (!empMap[k]) empMap[k] = { name: s.userName || "Unknown", role: s.role || "Staff", hrs: 0 };
    empMap[k].hrs += s.hoursWorked || 0;
  });
  const empList    = Object.values(empMap);
  const wagesTotal = empList.reduce((s, e) => s + e.hrs * rateForRole(e.role, rates), 0);
  const invCost    = inventory.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
  const netProfit  = revenue - wagesTotal - invCost;
  const margin     = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";
  const totalHrs   = empList.reduce((s, e) => s + e.hrs, 0);

  document.getElementById("kpiRevenue").textContent   = "$" + revenue.toFixed(2);
  document.getElementById("kpiOrderCount").textContent = orders.length + " orders";
  document.getElementById("kpiWages").textContent     = "$" + wagesTotal.toFixed(2);
  document.getElementById("kpiHoursTotal").textContent = totalHrs.toFixed(2) + " hrs logged";
  document.getElementById("kpiInvCost").textContent   = "$" + invCost.toFixed(2);
  document.getElementById("kpiInvItems").textContent  = inventory.length + " items";

  const profEl = document.getElementById("kpiProfit");
  profEl.textContent  = (netProfit >= 0 ? "+$" : "-$") + Math.abs(netProfit).toFixed(2);
  profEl.className    = "kpi-val profit " + (netProfit >= 0 ? "positive" : "negative");
  document.getElementById("kpiMargin").textContent = "Margin: " + margin + "%";

  renderOrders();
  renderWages(empList, wagesTotal);
  renderInventory();
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  document.getElementById("ordBadge").textContent = orders.length + " orders";
  if (!orders.length) { list.innerHTML = `<div class="empty-list">No orders yet</div>`; return; }
  const dc = { pending: "dot-pending", cooking: "dot-cooking", ready: "dot-ready", completed: "dot-completed" };
  list.innerHTML = orders.map(o => {
    const ts = o.time?.toDate
      ? o.time.toDate().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";
    const ic = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
    return `<div class="order-row">
      <div>
        <div class="order-cust">${o.userName || "Guest"}</div>
        <div class="order-items-count">${ic} item${ic !== 1 ? "s" : ""}</div>
      </div>
      <div class="order-time-sm">${ts}</div>
      <div style="display:flex;align-items:center;gap:5px">
        <div class="status-dot ${dc[o.status || "pending"] || "dot-pending"}"></div>
        <span style="font-size:.72rem;font-weight:800;color:var(--text2)">${o.status || "pending"}</span>
      </div>
      <div class="order-amt">$${(o.total || 0).toFixed(2)}</div>
    </div>`;
  }).join("");
}

function renderWages(empList, wagesTotal) {
  const body = document.getElementById("wagesBody");
  document.getElementById("empBadge").textContent = empList.length + " employee" + (empList.length !== 1 ? "s" : "");
  if (!empList.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty-list">No time sessions logged yet</td></tr>`;
    return;
  }
  body.innerHTML = empList.map(e => {
    const rate = rateForRole(e.role, rates);
    return `<tr>
      <td>${e.name}</td>
      <td>${e.role}</td>
      <td class="wage-hrs">${e.hrs.toFixed(2)}</td>
      <td class="wage-hrs">$${rate.toFixed(2)}</td>
      <td class="wage-cost">$${(e.hrs * rate).toFixed(2)}</td>
    </tr>`;
  }).join("")
  + `<tr style="background:rgba(192,57,43,0.05)">
      <td colspan="4" style="font-weight:900;color:var(--text2);font-size:.8rem;letter-spacing:.04em;padding:10px 16px">TOTAL WAGES DUE</td>
      <td class="wage-cost" style="font-size:1rem;padding:10px 16px">$${wagesTotal.toFixed(2)}</td>
    </tr>`;
}

function renderInventory() {
  const list = document.getElementById("invList");
  document.getElementById("invBadge").textContent = inventory.length + " items";
  if (!inventory.length) { list.innerHTML = `<div class="empty-list">No inventory items</div>`; return; }
  list.innerHTML = inventory.map(i => `
    <div class="inv-row">
      <div class="inv-name">${i.name}</div>
      <div class="inv-qty">Qty: ${i.quantity}</div>
      <div class="inv-cost">$${parseFloat(i.cost || 0).toFixed(2)}</div>
    </div>`).join("");
}

// Recipes
const RECIPES = [
  { name: "Kimchi", desc: "Traditional Korean fermented napa cabbage.", ingredients: "Napa cabbage, gochugaru, garlic, ginger, fish sauce, scallions, salt", allergens: "Fish (fish sauce)" },
  { name: "Guacamole & Chips", desc: "Fresh avocado guacamole with pico de gallo and tortilla chips.", ingredients: "Avocado, lime, tomato, red onion, cilantro, jalapeno, salt, tortilla chips", allergens: "Corn — gluten-free" },
  { name: "Tacos", desc: "Flour tortilla tacos with seasoned beef, lettuce, tomato, cheddar, sour cream.", ingredients: "Ground beef, flour tortillas, lettuce, tomato, cheddar, sour cream, lime, cumin, chili powder", allergens: "Gluten, dairy, may contain soy" },
  { name: "Sushi Balls", desc: "Temari sushi balls — salmon, tamago, and noodle varieties.", ingredients: "Sushi rice, rice vinegar, salmon, tamago, nori, sesame seeds, soy sauce", allergens: "Fish, gluten (soy sauce), eggs, sesame" },
  { name: "Garlic Shrimp", desc: "Shrimp sauteed in garlic butter over jasmine rice.", ingredients: "Shrimp, garlic, butter, lemon, parsley, white rice, black pepper", allergens: "Shellfish, dairy" },
  { name: "Ramen", desc: "Tonkotsu broth with noodles, chashu pork, narutomaki, soft egg.", ingredients: "Ramen noodles, pork belly, soft-boiled egg, narutomaki, bamboo shoots, green onion, nori, sesame oil", allergens: "Gluten, eggs, soy, sesame" },
  { name: "Pizza", desc: "Wood-fired pepperoni pizza with bell pepper, onion, mozzarella.", ingredients: "Pizza dough, tomato sauce, mozzarella, pepperoni, green bell pepper, onion, oregano, olive oil", allergens: "Gluten, dairy, pork" },
  { name: "Curry & Rice", desc: "Japanese-style curry with shrimp, onion, and steamed rice.", ingredients: "Curry roux, shrimp, onion, carrot, potato, white rice, vegetable broth", allergens: "Shellfish, gluten (curry roux), may contain soy" },
  { name: "Churrasco Skewers", desc: "Grilled skewers of chorizo, beef sirloin, and shrimp.", ingredients: "Beef sirloin, chorizo sausage, tiger shrimp, garlic, olive oil, rosemary, salt, black pepper", allergens: "Shellfish, pork" },
  { name: "Beef Steak", desc: "Seared ribeye with fries, cherry tomatoes, broccoli, and BBQ sauce.", ingredients: "Ribeye steak, potatoes, cherry tomatoes, broccoli, butter, garlic, BBQ sauce, black pepper", allergens: "Dairy — gluten-free option available" },
  { name: "Donuts", desc: "Classic glazed yeast donuts.", ingredients: "Flour, sugar, yeast, eggs, butter, milk, vanilla, powdered sugar glaze", allergens: "Gluten, eggs, dairy" },
  { name: "Crepes", desc: "French crepes with chocolate, strawberry cream, and kiwi.", ingredients: "Flour, eggs, milk, butter, sugar, vanilla, whipped cream, strawberries, chocolate sauce, kiwi", allergens: "Gluten, eggs, dairy" },
  { name: "Cookies", desc: "Jumbo cookies with chocolate chips and dried cranberries.", ingredients: "Flour, butter, sugar, brown sugar, eggs, vanilla, baking soda, chocolate chips, cranberries", allergens: "Gluten, eggs, dairy, may contain nuts" },
  { name: "Churros", desc: "Cinnamon-sugar dusted churros with chocolate dipping sauce.", ingredients: "Flour, water, butter, eggs, cinnamon sugar, vegetable oil, chocolate sauce", allergens: "Gluten, eggs, dairy" },
  { name: "Cheesecake", desc: "New York-style baked cheesecake with graham cracker crust.", ingredients: "Cream cheese, eggs, sugar, vanilla, sour cream, graham crackers, butter", allergens: "Dairy, eggs, gluten" },
  { name: "Apple Pie", desc: "Heart-shaped hand pies with flaky crust and cinnamon apple filling.", ingredients: "Flour, butter, apples, cinnamon, nutmeg, sugar, egg wash, lemon juice", allergens: "Gluten, eggs, dairy" },
  { name: "Lemonade", desc: "Hand-squeezed lemonade over ice with mint.", ingredients: "Fresh lemons, water, cane sugar, ice, fresh mint", allergens: "None" },
];

function buildRecipes() {
  const body = document.getElementById("recipeAccBody");
  body.innerHTML = RECIPES.map((r, i) => `
    <div class="recipe-item">
      <div class="recipe-item-header" data-ri="${i}">
        <span class="recipe-item-name">${r.name}</span>
        <span class="recipe-item-arrow" id="ri-arrow-${i}">▼</span>
      </div>
      <div class="recipe-item-body" id="ri-body-${i}">
        <div class="recipe-row">
          <div><div class="recipe-label">Description</div><div class="recipe-val">${r.desc}</div></div>
          <div><div class="recipe-label">Allergens</div><div class="recipe-val allergen">${r.allergens}</div></div>
        </div>
        <div class="recipe-label">Ingredients</div>
        <div class="recipe-val" style="margin-top:4px">${r.ingredients}</div>
      </div>
    </div>`).join("");

  body.querySelectorAll(".recipe-item-header").forEach(h => {
    h.addEventListener("click", () => {
      const i = h.dataset.ri;
      document.getElementById(`ri-body-${i}`).classList.toggle("open");
      document.getElementById(`ri-arrow-${i}`).classList.toggle("open");
    });
  });
}

document.getElementById("recipeAccHeader").addEventListener("click", () => {
  document.getElementById("recipeAccBody").classList.toggle("hidden");
  document.getElementById("recipeAccArrow").classList.toggle("open");
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}