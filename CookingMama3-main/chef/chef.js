import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, orderBy, query }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = {
  apiKey:"AIzaSyCEAcwTKoSnUkbaGvjrsy1QZ-Duj12WImk",
  authDomain:"cookingmamauwu-9902c.firebaseapp.com",
  projectId:"cookingmamauwu-9902c",
  storageBucket:"cookingmamauwu-9902c.firebasestorage.app",
  messagingSenderId:"18763902036",
  appId:"1:18763902036:web:a8703f75e5ddf1d1b791c1"
};

const ROLES = {
  "azaharulislam171@gmail.com":  "Owner",
  "mateusstavares2008@gmail.com": "Manager",
  "thehecklolwhat15@gmail.com":   "Chef",
  "danielaiscool6128@gmail.com":           "Waiter",
};
function roleOf(e) { return ROLES[e] || "Staff"; }

const NAV_LINKS = {
  Owner:   [{l:"Customer Menu",  h:"../customer/customer.html"},
            {l:"Time Tracker",   h:"../employee/employee.html"},
            {l:"Manager",        h:"../manager/manager.html"},
            {l:"Owner HQ",       h:"../owner/owner.html"}],
  Manager: [{l:"Customer Menu",  h:"../customer/customer.html"},
            {l:"Time Tracker",   h:"../employee/employee.html"},
            {l:"Manager",        h:"../manager/manager.html"}],
  Chef:    [{l:"Customer Menu",  h:"../customer/customer.html"},
            {l:"Time Tracker",   h:"../employee/employee.html"}],
};

const RECIPES = [
  {name:"Kimchi",desc:"Traditional Korean fermented napa cabbage, tangy and spicy.",ingredients:"Napa cabbage, gochugaru, garlic, ginger, fish sauce, scallions, salt",allergens:"Fish (fish sauce)"},
  {name:"Guacamole & Chips",desc:"Fresh avocado guacamole with pico de gallo and house-fried tortilla chips.",ingredients:"Avocado, lime, tomato, red onion, cilantro, jalapeno, salt, tortilla chips",allergens:"Corn — gluten-free"},
  {name:"Tacos",desc:"Three flour tortilla tacos with seasoned ground beef, lettuce, tomato, cheddar, and sour cream.",ingredients:"Ground beef, flour tortillas, lettuce, tomato, cheddar, sour cream, lime, cumin, chili powder",allergens:"Gluten (wheat), dairy, may contain soy"},
  {name:"Sushi Balls",desc:"Nine bite-sized temari sushi balls with salmon, tamago, and noodle varieties.",ingredients:"Sushi rice, rice vinegar, salmon, tamago, nori, sesame seeds, soy sauce",allergens:"Fish, gluten (soy sauce), eggs, sesame"},
  {name:"Garlic Shrimp",desc:"Shrimp sauteed in garlic butter, served over steamed jasmine rice with lemon.",ingredients:"Shrimp, garlic, butter, lemon, parsley, white rice, black pepper",allergens:"Shellfish, dairy"},
  {name:"Ramen",desc:"Rich tonkotsu broth with noodles, chashu pork, narutomaki, and soft-boiled soy egg.",ingredients:"Ramen noodles, pork belly, soft-boiled egg, narutomaki, bamboo shoots, green onion, nori, sesame oil",allergens:"Gluten, eggs, soy, sesame"},
  {name:"Pizza",desc:"Wood-fired pepperoni pizza with bell pepper, onion, mozzarella, and tomato sauce.",ingredients:"Pizza dough, tomato sauce, mozzarella, pepperoni, green bell pepper, onion, oregano, olive oil",allergens:"Gluten, dairy, pork"},
  {name:"Curry & Rice",desc:"Japanese-style dark curry with shrimp, caramelized onion, and steamed white rice.",ingredients:"Curry roux, shrimp, onion, carrot, potato, white rice, vegetable broth",allergens:"Shellfish, gluten (curry roux), may contain soy"},
  {name:"Churrasco Skewers",desc:"Grilled skewers of chorizo, beef sirloin, and shrimp on a wooden board.",ingredients:"Beef sirloin, chorizo sausage, tiger shrimp, garlic, olive oil, rosemary, salt, black pepper",allergens:"Shellfish, pork"},
  {name:"Beef Steak",desc:"Pan-seared ribeye with golden fries, cherry tomatoes, broccoli, and BBQ sauce.",ingredients:"Ribeye steak, potatoes, cherry tomatoes, broccoli, butter, garlic, BBQ sauce, black pepper",allergens:"Dairy — gluten-free option available"},
  {name:"Donuts",desc:"Two classic glazed yeast donuts, crispy outside and pillowy inside.",ingredients:"Flour, sugar, yeast, eggs, butter, milk, vanilla, powdered sugar glaze",allergens:"Gluten, eggs, dairy"},
  {name:"Crepes",desc:"Three rolled French crepes with chocolate, strawberry cream, and kiwi.",ingredients:"Flour, eggs, milk, butter, sugar, vanilla, whipped cream, strawberries, chocolate sauce, kiwi",allergens:"Gluten, eggs, dairy"},
  {name:"Cookies",desc:"Freshly baked jumbo cookies with chocolate chips and dried cranberries.",ingredients:"Flour, butter, sugar, brown sugar, eggs, vanilla, baking soda, chocolate chips, cranberries",allergens:"Gluten, eggs, dairy, may contain nuts"},
  {name:"Churros",desc:"Crispy cinnamon-sugar dusted churros with chocolate dipping sauce.",ingredients:"Flour, water, butter, eggs, cinnamon sugar, vegetable oil, chocolate sauce",allergens:"Gluten, eggs, dairy"},
  {name:"Cheesecake",desc:"New York-style baked cheesecake with a buttery graham cracker base.",ingredients:"Cream cheese, eggs, sugar, vanilla, sour cream, graham crackers, butter",allergens:"Dairy, eggs, gluten"},
  {name:"Apple Pie",desc:"Heart-shaped hand pies with flaky crust and cinnamon apple filling.",ingredients:"Flour, butter, apples, cinnamon, nutmeg, sugar, egg wash, lemon juice",allergens:"Gluten, eggs, dairy"},
  {name:"Lemonade",desc:"Hand-squeezed lemonade over ice with mint. Vegan and gluten-free.",ingredients:"Fresh lemons, water, cane sugar, ice, fresh mint",allergens:"None"},
];

const app  = initializeApp(CFG);
const auth = getAuth(app);
const db   = getFirestore(app);

let allOrders = [], currentFilter = "all", activeOrderId = null;

/* ── Theme ── */
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

/* ── Hamburger ── */
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});

/* ── Auth ── */
onAuthStateChanged(auth, user => {
  document.getElementById("authLoader").style.display = "none";
  if (!user) { window.location.href = "../signup/signup.html"; return; }
  const role = roleOf(user.email);
  if (role === "Waiter" || role === "Staff") { window.location.href = "../customer/customer.html"; return; }

  document.getElementById("navAvatar").src = user.photoURL || "";
  document.getElementById("navName").textContent = user.displayName?.split(" ")[0] || "Chef";
  document.getElementById("mainNav").style.display = "flex";
  document.getElementById("pageContent").style.display = "block";
  buildNav(role);
  listenOrders();
  buildRecipes();
});

document.getElementById("btnSignOut").addEventListener("click", async () => {
  await signOut(auth); window.location.href = "../signup/signup.html";
});

function buildNav(role) {
  const links = NAV_LINKS[role] || [];
  if (links.length) {
    document.getElementById("navDropdown").style.display = "block";
    document.getElementById("navDdMenu").innerHTML =
      links.map(k => `<button class="nav-dd-item" onclick="window.location.href='${k.h}'">${k.l}</button>`).join("");
  }
  document.getElementById("navDdBtn")?.addEventListener("click", e => {
    e.stopPropagation(); document.getElementById("navDdMenu").classList.toggle("open");
  });
  document.addEventListener("click", () => document.getElementById("navDdMenu")?.classList.remove("open"));

  const mob = document.getElementById("mobileMenu");
  const t   = document.documentElement.getAttribute("data-theme");
  mob.innerHTML = links.map(k => `<button class="nav-dd-item-mobile" onclick="window.location.href='${k.h}'">${k.l}</button>`).join("")
    + `<button class="theme-btn" id="mobileThemeBtn">${t === "dark" ? "Light Mode" : "Dark Mode"}</button>`
    + `<button class="sign-out-btn" id="mobileSignOut">Sign Out</button>`;
  document.getElementById("mobileThemeBtn")?.addEventListener("click", () => document.getElementById("themeBtn").click());
  document.getElementById("mobileSignOut")?.addEventListener("click", async () => { await signOut(auth); window.location.href = "../signup/signup.html"; });
}

function listenOrders() {
  const q = query(collection(db, "orders"), orderBy("time", "asc"));
  onSnapshot(q, snap => { allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderOrders(); });
}

document.querySelectorAll(".ftab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".ftab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderOrders();
  });
});

function renderOrders() {
  const wrap     = document.getElementById("ordersWrap");
  const filtered = currentFilter === "all" ? allOrders : allOrders.filter(o => o.status === currentFilter);
  if (!filtered.length) { wrap.innerHTML = `<div class="empty-state">No orders here yet</div>`; return; }
  wrap.innerHTML = filtered.map(order => {
    const ts   = order.time?.toDate ? order.time.toDate().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Just now";
    const ds   = order.time?.toDate ? order.time.toDate().toLocaleDateString([], {month:"short",day:"numeric"}) : "";
    const chips = order.items.map(i => `<span class="item-chip">${i.name} x${i.qty}</span>`).join("");
    return `<div class="order-card" data-id="${order.id}">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order #${order.id.slice(-6).toUpperCase()}</div>
          <div class="order-customer">${order.userName || "Guest"}</div>
          <div class="order-time">${ds} - ${ts}</div>
        </div>
        ${badge(order.status || "pending")}
      </div>
      <div class="order-preview">${chips}</div>
      <div class="order-total">
        <span class="order-total-label">Total</span>
        <span class="order-total-val">$${(order.total || 0).toFixed(2)}</span>
      </div>
    </div>`;
  }).join("");
  wrap.querySelectorAll(".order-card").forEach(c => c.addEventListener("click", () => openModal(c.dataset.id)));
}

function badge(s) {
  const m = { pending:["Pending","pending"], cooking:["Cooking","cooking"], ready:["Ready","ready"], completed:["Done","completed"] };
  const [l, c] = m[s] || m.pending;
  return `<span class="status-badge badge-${c}">${l}</span>`;
}

function openModal(id) {
  const order = allOrders.find(o => o.id === id); if (!order) return;
  activeOrderId = id;
  const ts = order.time?.toDate ? order.time.toDate().toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "Just now";
  document.getElementById("modalTitle").textContent = "Order #" + id.slice(-6).toUpperCase();
  document.getElementById("modalMeta").textContent  = (order.userName || "Guest") + "  -  " + ts;
  document.getElementById("modalItems").innerHTML   = order.items.map(i => `
    <div class="modal-item">
      <span class="modal-item-name">${i.name}</span>
      <span class="modal-item-qty">x${i.qty}</span>
      <span class="modal-item-price">$${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join("");
  document.getElementById("modalTotals").innerHTML = `
    <div class="modal-row"><span>Subtotal</span><span>$${(order.subtotal||0).toFixed(2)}</span></div>
    <div class="modal-row"><span>Tax</span><span>$${(order.tax||0).toFixed(2)}</span></div>
    <div class="modal-row grand"><span>Total</span><span>$${(order.total||0).toFixed(2)}</span></div>`;
  const cur = order.status || "pending";
  document.querySelectorAll(".s-btn").forEach(b => b.classList.toggle("active-status", b.dataset.status === cur));
  document.getElementById("completeBtn").disabled = cur === "completed";
  document.getElementById("modalOverlay").classList.add("open");
}

document.getElementById("modalClose").addEventListener("click", () => document.getElementById("modalOverlay").classList.remove("open"));
document.getElementById("modalOverlay").addEventListener("click", e => { if (e.target === document.getElementById("modalOverlay")) document.getElementById("modalOverlay").classList.remove("open"); });

document.querySelectorAll(".s-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!activeOrderId) return;
    const s = btn.dataset.status;
    await updateDoc(doc(db, "orders", activeOrderId), { status: s });
    document.querySelectorAll(".s-btn").forEach(b => b.classList.remove("active-status"));
    btn.classList.add("active-status");
    document.getElementById("completeBtn").disabled = s === "completed";
    showToast("Status updated to " + s);
  });
});

document.getElementById("completeBtn").addEventListener("click", async () => {
  if (!activeOrderId) return;
  await updateDoc(doc(db, "orders", activeOrderId), { status: "completed" });
  document.querySelectorAll(".s-btn").forEach(b => b.classList.toggle("active-status", b.dataset.status === "completed"));
  document.getElementById("completeBtn").disabled = true;
  showToast("Order marked as completed");
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!activeOrderId) return;
  if (!confirm("Delete this order permanently?")) return;
  await deleteDoc(doc(db, "orders", activeOrderId));
  document.getElementById("modalOverlay").classList.remove("open");
  activeOrderId = null;
  showToast("Order deleted");
});

function buildRecipes() {
  const body = document.getElementById("recipeAccBody");
  body.innerHTML = RECIPES.map((r, i) => `
    <div class="recipe-item">
      <div class="recipe-item-header" data-ri="${i}">
        <span class="recipe-item-name">${r.name}</span>
        <span class="recipe-item-arrow" id="ri-arrow-${i}">v</span>
      </div>
      <div class="recipe-item-body" id="ri-body-${i}">
        <div class="recipe-grid">
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
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

