import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = {
  apiKey:"AIzaSyCEAcwTKoSnUkbaGvjrsy1QZ-Duj12WImk",
  authDomain:"cookingmamauwu-9902c.firebaseapp.com",
  projectId:"cookingmamauwu-9902c",
  storageBucket:"cookingmamauwu-9902c.firebasestorage.app",
  messagingSenderId:"18763902036",
  appId:"1:18763902036:web:a8703f75e5ddf1d1b791c1"
};
const OWNER_EMAIL   = "azaharulislam171@gmail.com";
const MANAGER_EMAIL = "danielaiscool6128@gmail.com";
const LOW = 10;

const NAV_LINKS = {
  Owner:   [{l:"Customer Menu", h:"../customer/customer.html"},{l:"Chef Dashboard",h:"../chef/chef.html"},
            {l:"Time Tracker",  h:"../employee/employee.html"},{l:"Owner HQ",h:"../owner/owner.html"}],
  Manager: [{l:"Customer Menu", h:"../customer/customer.html"},{l:"Chef Dashboard",h:"../chef/chef.html"},
            {l:"Time Tracker",  h:"../employee/employee.html"}],
};

const RECIPES = [
  {name:"Kimchi",desc:"Traditional Korean fermented napa cabbage.",ingredients:"Napa cabbage, gochugaru, garlic, ginger, fish sauce, scallions, salt",allergens:"Fish (fish sauce)"},
  {name:"Guacamole & Chips",desc:"Fresh avocado guacamole with pico de gallo and tortilla chips.",ingredients:"Avocado, lime, tomato, red onion, cilantro, jalapeno, salt, tortilla chips",allergens:"Corn — gluten-free"},
  {name:"Tacos",desc:"Flour tortilla tacos with seasoned ground beef, lettuce, tomato, cheddar, sour cream.",ingredients:"Ground beef, flour tortillas, lettuce, tomato, cheddar, sour cream, lime, cumin, chili powder",allergens:"Gluten, dairy, may contain soy"},
  {name:"Sushi Balls",desc:"Temari sushi balls — salmon, tamago, and noodle varieties.",ingredients:"Sushi rice, rice vinegar, salmon, tamago, nori, sesame seeds, soy sauce",allergens:"Fish, gluten (soy sauce), eggs, sesame"},
  {name:"Garlic Shrimp",desc:"Shrimp sauteed in garlic butter over jasmine rice.",ingredients:"Shrimp, garlic, butter, lemon, parsley, white rice, black pepper",allergens:"Shellfish, dairy"},
  {name:"Ramen",desc:"Tonkotsu broth with noodles, chashu pork, narutomaki, and soft egg.",ingredients:"Ramen noodles, pork belly, soft-boiled egg, narutomaki, bamboo shoots, green onion, nori, sesame oil",allergens:"Gluten, eggs, soy, sesame"},
  {name:"Pizza",desc:"Wood-fired pepperoni pizza with bell pepper, onion, mozzarella.",ingredients:"Pizza dough, tomato sauce, mozzarella, pepperoni, green bell pepper, onion, oregano, olive oil",allergens:"Gluten, dairy, pork"},
  {name:"Curry & Rice",desc:"Japanese-style curry with shrimp, onion, and steamed rice.",ingredients:"Curry roux, shrimp, onion, carrot, potato, white rice, vegetable broth",allergens:"Shellfish, gluten (curry roux), may contain soy"},
  {name:"Churrasco Skewers",desc:"Grilled skewers of chorizo, beef sirloin, and shrimp.",ingredients:"Beef sirloin, chorizo sausage, tiger shrimp, garlic, olive oil, rosemary, salt, black pepper",allergens:"Shellfish, pork"},
  {name:"Beef Steak",desc:"Seared ribeye with fries, cherry tomatoes, broccoli, and BBQ sauce.",ingredients:"Ribeye steak, potatoes, cherry tomatoes, broccoli, butter, garlic, BBQ sauce, black pepper",allergens:"Dairy — gluten-free option available"},
  {name:"Donuts",desc:"Classic glazed yeast donuts, crispy outside, pillowy inside.",ingredients:"Flour, sugar, yeast, eggs, butter, milk, vanilla, powdered sugar glaze",allergens:"Gluten, eggs, dairy"},
  {name:"Crepes",desc:"French crepes with chocolate, strawberry cream, and kiwi.",ingredients:"Flour, eggs, milk, butter, sugar, vanilla, whipped cream, strawberries, chocolate sauce, kiwi",allergens:"Gluten, eggs, dairy"},
  {name:"Cookies",desc:"Jumbo cookies with chocolate chips and dried cranberries.",ingredients:"Flour, butter, sugar, brown sugar, eggs, vanilla, baking soda, chocolate chips, cranberries",allergens:"Gluten, eggs, dairy, may contain nuts"},
  {name:"Churros",desc:"Cinnamon-sugar dusted churros with chocolate dipping sauce.",ingredients:"Flour, water, butter, eggs, cinnamon sugar, vegetable oil, chocolate sauce",allergens:"Gluten, eggs, dairy"},
  {name:"Cheesecake",desc:"New York-style baked cheesecake with graham cracker crust.",ingredients:"Cream cheese, eggs, sugar, vanilla, sour cream, graham crackers, butter",allergens:"Dairy, eggs, gluten"},
  {name:"Apple Pie",desc:"Heart-shaped hand pies with flaky crust and cinnamon apple filling.",ingredients:"Flour, butter, apples, cinnamon, nutmeg, sugar, egg wash, lemon juice",allergens:"Gluten, eggs, dairy"},
  {name:"Lemonade",desc:"Hand-squeezed lemonade over ice with mint.",ingredients:"Fresh lemons, water, cane sugar, ice, fresh mint",allergens:"None"},
];

const app  = initializeApp(CFG);
const auth = getAuth(app);
const db   = getFirestore(app);

/* theme */
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

document.getElementById("hamburger")?.addEventListener("click", () => document.getElementById("mobileMenu").classList.toggle("open"));

onAuthStateChanged(auth, user => {
  document.getElementById("authLoader").style.display = "none";
  if (!user) { window.location.href = "../signup/signup.html"; return; }
  if (user.email !== MANAGER_EMAIL && user.email !== OWNER_EMAIL) { window.location.href = "../customer/customer.html"; return; }
  document.getElementById("navAvatar").src = user.photoURL || "";
  document.getElementById("navName").textContent = user.displayName?.split(" ")[0] || "Manager";
  document.getElementById("mainNav").style.display = "flex";
  document.getElementById("pageContent").style.display = "block";
  const role = user.email === OWNER_EMAIL ? "Owner" : "Manager";
  buildNav(role);
  listenInventory();
  buildRecipes();
});

document.getElementById("btnSignOut").addEventListener("click", async () => { await signOut(auth); window.location.href = "../signup/signup.html"; });

function buildNav(role) {
  const links = NAV_LINKS[role] || [];
  if (links.length) {
    document.getElementById("navDropdown").style.display = "block";
    document.getElementById("navDdMenu").innerHTML = links.map(k => `<button class="nav-dd-item" onclick="window.location.href='${k.h}'">${k.l}</button>`).join("");
  }
  document.getElementById("navDdBtn")?.addEventListener("click", e => { e.stopPropagation(); document.getElementById("navDdMenu").classList.toggle("open"); });
  document.addEventListener("click", () => document.getElementById("navDdMenu")?.classList.remove("open"));
  const t   = document.documentElement.getAttribute("data-theme");
  const mob = document.getElementById("mobileMenu");
  mob.innerHTML = links.map(k => `<button class="nav-dd-item-mobile" onclick="window.location.href='${k.h}'">${k.l}</button>`).join("")
    + `<button class="theme-btn" id="mobileThemeBtn">${t === "dark" ? "Light Mode" : "Dark Mode"}</button>`
    + `<button class="sign-out-btn" id="mobileSignOut">Sign Out</button>`;
  document.getElementById("mobileThemeBtn")?.addEventListener("click", () => document.getElementById("themeBtn").click());
  document.getElementById("mobileSignOut")?.addEventListener("click", async () => { await signOut(auth); window.location.href = "../signup/signup.html"; });
}

let inventory = [];
function listenInventory() {
  onSnapshot(query(collection(db, "inventory"), orderBy("createdAt", "asc")), snap => {
    inventory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderInventory();
  });
}

function renderInventory() {
  const body      = document.getElementById("invBody");
  const totalCost = inventory.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
  const lowCount  = inventory.filter(i => (parseInt(i.quantity) || 0) <= LOW).length;
  document.getElementById("statTotal").textContent = inventory.length;
  document.getElementById("statLow").textContent   = lowCount;
  document.getElementById("statCost").textContent  = "$" + totalCost.toFixed(2);
  document.getElementById("invCount").textContent  = inventory.length + " items";
  if (!inventory.length) { body.innerHTML = `<tr><td colspan="5" class="empty-inv">No inventory items yet.</td></tr>`; return; }
  body.innerHTML = inventory.map(item => {
    const qty   = parseInt(item.quantity) || 0;
    const isLow = qty <= LOW;
    return `<tr>
      <td>${item.name}</td>
      <td class="${isLow ? "low-stock" : ""}">${qty}</td>
      <td>$${parseFloat(item.cost || 0).toFixed(2)}</td>
      <td>${isLow ? `<span class="low-badge">Low Stock</span>` : `<span style="color:var(--accent);font-weight:800">OK</span>`}</td>
      <td><button class="del-btn" data-id="${item.id}">Remove</button></td>
    </tr>`;
  }).join("");
  body.querySelectorAll(".del-btn").forEach(btn => btn.addEventListener("click", async () => {
    await deleteDoc(doc(db, "inventory", btn.dataset.id)); showToast("Item removed");
  }));
}

document.getElementById("addItemBtn").addEventListener("click", async () => {
  const name = document.getElementById("iName").value.trim();
  const qty  = parseInt(document.getElementById("iQty").value);
  const cost = parseFloat(document.getElementById("iCost").value);
  if (!name || isNaN(qty) || isNaN(cost)) { showToast("Fill in all fields"); return; }
  await addDoc(collection(db, "inventory"), { name, quantity: qty, cost, createdAt: serverTimestamp() });
  document.getElementById("iName").value = "";
  document.getElementById("iQty").value  = "";
  document.getElementById("iCost").value = "";
  showToast("Item added");
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
  const t = document.getElementById("toast"); t.textContent = msg;
  t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2600);
}

