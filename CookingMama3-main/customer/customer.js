import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp }
                         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = {
  apiKey:"AIzaSyCEAcwTKoSnUkbaGvjrsy1QZ-Duj12WImk",
  authDomain:"cookingmamauwu-9902c.firebaseapp.com",
  projectId:"cookingmamauwu-9902c",
  storageBucket:"cookingmamauwu-9902c.firebasestorage.app",
  messagingSenderId:"18763902036",
  appId:"1:18763902036:web:a8703f75e5ddf1d1b791c1"
};
const TAX = 0.06625;
const app  = initializeApp(CFG);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── MENU DATA ── allergen info folded into description, no tag labels ── */
const MENU = [
  /* APPETIZERS */
  { name:"Kimchi", price:6.99, cat:"appetizer", img:"../assets/kimchi.png",
    desc:"Traditional Korean fermented napa cabbage — tangy, spicy, and packed with flavor. Served chilled on a slate plate. Contains fish sauce.",
    extras:[{name:"Extra Kimchi",price:.99},{name:"Steamed Rice Side",price:1.99}] },

  { name:"Guacamole & Chips", price:8.49, cat:"appetizer", img:"../assets/guac.png",
    desc:"Freshly mashed avocado with pico de gallo — cilantro, jalapeno, lime — served with house-fried tortilla chips. Corn-based, gluten-free.",
    extras:[{name:"Extra Chips",price:.99},{name:"Jalapenos",price:.49},{name:"Sour Cream",price:.79}] },

  /* MAINS */
  { name:"Tacos", price:12.99, cat:"main", img:"../assets/tacos.png",
    desc:"Three flour tortilla tacos with seasoned ground beef, crunchy lettuce, fresh tomato, shredded cheddar, and sour cream. Contains gluten and dairy.",
    extras:[{name:"Extra Meat",price:2.50},{name:"Extra Cheese",price:.99},{name:"Avocado Slices",price:1.49}] },

  { name:"Sushi Balls", price:14.99, cat:"main", img:"../assets/sushiballs.png",
    desc:"Nine elegant temari sushi balls — salmon, tamago, and noodle varieties — presented in a traditional lacquered box. Contains fish, eggs, sesame, and soy.",
    extras:[{name:"Wasabi",price:.49},{name:"Extra Soy Sauce",price:.25},{name:"Pickled Ginger",price:.49}] },

  { name:"Garlic Shrimp", price:16.49, cat:"main", img:"../assets/shrimp.png",
    desc:"Jumbo shrimp sauteed in garlic butter, served over steamed jasmine rice with lemon wedges and fresh perilla. Contains shellfish and dairy.",
    extras:[{name:"Extra Shrimp (3 pcs)",price:3.99},{name:"Garlic Bread",price:1.99},{name:"Lemon Butter Sauce",price:.99}] },

  { name:"Ramen", price:13.99, cat:"main", img:"../assets/ramen.png",
    desc:"Rich tonkotsu broth with wavy noodles, thick-cut chashu pork, narutomaki fish cake, bamboo shoots, and a soft-boiled soy egg. Contains gluten, eggs, soy, and sesame.",
    extras:[{name:"Extra Chashu",price:2.99},{name:"Soft-Boiled Egg",price:.99},{name:"Spicy Miso Add-In",price:.99}] },

  { name:"Pizza", price:15.99, cat:"main", img:"../assets/pizza.png",
    desc:"Wood-fired pepperoni pizza with green bell pepper rings, white onion, melty mozzarella, and tangy tomato sauce on a hand-stretched crust. Contains gluten, dairy, and pork.",
    extras:[{name:"Extra Cheese",price:1.49},{name:"Extra Pepperoni",price:1.99},{name:"Mushrooms",price:.99},{name:"Jalapenos",price:.79}] },

  { name:"Curry & Rice", price:13.49, cat:"main", img:"../assets/curry.png",
    desc:"Japanese-style dark curry with plump shrimp, caramelized onion, and a mound of steamed white rice. Contains shellfish and gluten from curry roux.",
    extras:[{name:"Extra Curry Sauce",price:.99},{name:"Naan Bread",price:1.49},{name:"Hard-Boiled Egg",price:.79}] },

  { name:"Churrasco Skewers", price:18.99, cat:"main", img:"../assets/churrsasco.png",
    desc:"Brazilian-style grilled skewers with chorizo sausage, juicy beef sirloin, and tender shrimp on a wooden board. Contains shellfish and pork.",
    extras:[{name:"Extra Shrimp Skewer",price:4.99},{name:"Chimichurri Sauce",price:.99},{name:"Grilled Veggies Side",price:2.49}] },

  { name:"Beef Steak", price:24.99, cat:"main", img:"../assets/beefsteak.png",
    desc:"Pan-seared ribeye sliced medium-rare, plated with golden fries, cherry tomatoes, steamed broccoli, and a bold BBQ sauce. Contains dairy. Gluten-free option available.",
    extras:[{name:"Garlic Butter Sauce",price:.99},{name:"Extra Fries",price:2.49},{name:"Bearnaise Sauce",price:1.49}] },

  /* DESSERTS */
  { name:"Donuts", price:4.99, cat:"dessert", img:"../assets/donuts.png",
    desc:"Two classic glazed yeast donuts — crispy outside, pillowy inside — served on a wicker tray. Contains gluten, eggs, and dairy.",
    extras:[{name:"Chocolate Glaze",price:.49},{name:"Sprinkles",price:.25},{name:"Extra Donut",price:1.99}] },

  { name:"Crepes", price:7.99, cat:"dessert", img:"../assets/crepes.png",
    desc:"Three rolled French crepes filled with chocolate ice cream, strawberry cream, and kiwi with chocolate drizzle. Contains gluten, eggs, and dairy.",
    extras:[{name:"Extra Whipped Cream",price:.49},{name:"Nutella Add-In",price:.99},{name:"Extra Strawberries",price:.79}] },

  { name:"Cookies", price:5.49, cat:"dessert", img:"../assets/cookies.png",
    desc:"A basket of freshly baked jumbo cookies — golden, chewy, loaded with chocolate chips and dried cranberries. Contains gluten, eggs, and dairy. May contain nuts.",
    extras:[{name:"Extra Cookie",price:.99},{name:"Milk Side",price:.99},{name:"Ice Cream Scoop",price:1.49}] },

  { name:"Churros", price:6.49, cat:"dessert", img:"../assets/churros.png",
    desc:"Four crispy cinnamon-sugar dusted churros served with a warm chocolate dipping sauce. Contains gluten, eggs, and dairy.",
    extras:[{name:"Caramel Sauce",price:.79},{name:"Extra Chocolate",price:.49},{name:"Dulce de Leche",price:.99}] },

  { name:"Cheesecake", price:7.49, cat:"dessert", img:"../assets/cheesecake.png",
    desc:"Two generous slices of New York-style baked cheesecake — dense and velvety with a buttery graham cracker base. Contains dairy, eggs, and gluten.",
    extras:[{name:"Strawberry Sauce",price:.79},{name:"Blueberry Compote",price:.79},{name:"Whipped Cream",price:.49}] },

  { name:"Apple Pie", price:6.99, cat:"dessert", img:"../assets/applepie.png",
    desc:"Two heart-shaped hand pies with a golden flaky crust and sweet cinnamon apple filling, baked until perfectly caramelized. Contains gluten, eggs, and dairy.",
    extras:[{name:"Vanilla Ice Cream",price:1.99},{name:"Caramel Drizzle",price:.79},{name:"Extra Pie",price:3.50}] },

  /* DRINKS */
  { name:"Lemonade", price:3.99, cat:"drink", img:"../assets/lemonade.png",
    desc:"Hand-squeezed fresh lemonade served over ice in tall glasses, garnished with a lemon wheel and fresh mint. Vegan and gluten-free.",
    extras:[{name:"Strawberry Lemonade Upgrade",price:.99},{name:"Mint Upgrade",price:.49},{name:"Extra Large Size",price:.99}] },
];

/* ── State ── */
let cart = [];
let activeDish = null;
let extraQtys  = {};

/* ── Theme ── */
const th = localStorage.getItem("mama-theme") || "light";
document.documentElement.setAttribute("data-theme", th);
document.getElementById("themeBtn").textContent = th === "dark" ? "Light Mode" : "Dark Mode";
document.getElementById("themeBtn").addEventListener("click", () => {
  const c = document.documentElement.getAttribute("data-theme");
  const n = c === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem("mama-theme", n);
  document.getElementById("themeBtn").textContent = n === "dark" ? "Light Mode" : "Dark Mode";
});

/* ── Mobile menu ── */
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});
document.getElementById("mobileSignOut")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../signup/signup.html";
});
document.getElementById("mobileThemeBtn")?.addEventListener("click", () => {
  document.getElementById("themeBtn").click();
  const t = document.documentElement.getAttribute("data-theme");
  document.getElementById("mobileThemeBtn").textContent = t === "dark" ? "Light Mode" : "Dark Mode";
});

/* ── Auth ── */
onAuthStateChanged(auth, user => {
  document.getElementById("authLoader").style.display = "none";
  if (!user) { window.location.href = "../signup/signup.html"; return; }
  document.getElementById("navAvatar").src = user.photoURL || "";
  document.getElementById("navName").textContent = user.displayName?.split(" ")[0] || "Guest";
  document.getElementById("mainNav").style.display = "flex";
  document.getElementById("pageContent").style.display = "block";
  buildMenu();
});

document.getElementById("btnSignOut").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../signup/signup.html";
});

/* ── Build menu ── */
function buildMenu() {
  const grids = {
    appetizer: document.getElementById("grid-appetizer"),
    main:      document.getElementById("grid-main"),
    dessert:   document.getElementById("grid-dessert"),
    drink:     document.getElementById("grid-drink"),
  };
  MENU.forEach(dish => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <img src="${dish.img}" alt="${dish.name}" loading="lazy"/>
      <div class="menu-card-body">
        <div class="menu-card-name">${dish.name}</div>
        <div class="menu-card-price">$${dish.price.toFixed(2)}</div>
        <button class="add-btn">Add to Cart</button>
      </div>`;
    card.addEventListener("click", e => {
      if (e.target.classList.contains("add-btn")) { e.stopPropagation(); addToCart(dish, []); showToast(dish.name + " added"); return; }
      openFoodModal(dish);
    });
    card.querySelector(".add-btn").addEventListener("click", e => {
      e.stopPropagation(); addToCart(dish, []); showToast(dish.name + " added");
    });
    grids[dish.cat]?.appendChild(card);
  });
}


/* ── Cart ── */
function addToCart(dish, extras) {
  const key = JSON.stringify(extras);
  const existing = cart.find(i => i.name === dish.name && JSON.stringify(i.extras) === key);
  if (existing && !extras.length) { existing.qty++; }
  else { cart.push({ name: dish.name, price: dish.price, img: dish.img, qty: 1, extras }); }
  updateCartUI();
}

function updateCartUI() {
  const items   = document.getElementById("cartItems");
  const count   = document.getElementById("cartCount");
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  count.textContent = totalQty;
  count.style.display = totalQty > 0 ? "flex" : "none";

  if (!cart.length) {
    items.innerHTML = `<div class="cart-empty">Your cart is empty. Tap a dish to add it.</div>`;
    updateTotals(); return;
  }
  items.innerHTML = cart.map((item, idx) => {
    const extrasStr   = item.extras?.length ? item.extras.map(e => `${e.name} x${e.qty}`).join(", ") : "";
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price * e.qty, 0) || 0;
    const linePrice   = (item.price + extrasTotal) * item.qty;
    return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}"/>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${extrasStr ? `<div class="cart-item-extras">${extrasStr}</div>` : ""}
          <div class="cart-item-price">$${linePrice.toFixed(2)}</div>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" data-action="dec" data-idx="${idx}">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-idx="${idx}">+</button>
        </div>
      </div>`;
  }).join("");

  items.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === "inc") { cart[idx].qty++; }
      else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
      updateCartUI();
    });
  });
  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((s, i) => {
    const ex = i.extras?.reduce((es, e) => es + e.price * e.qty, 0) || 0;
    return s + (i.price + ex) * i.qty;
  }, 0);
  const tax = subtotal * TAX;
  document.getElementById("subtotalVal").textContent = "$" + subtotal.toFixed(2);
  document.getElementById("taxVal").textContent      = "$" + tax.toFixed(2);
  document.getElementById("totalVal").textContent    = "$" + (subtotal + tax).toFixed(2);
}

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartOverlay").addEventListener("click", closeCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
function openCart()  { document.getElementById("cartOverlay").classList.add("open"); document.getElementById("cartDrawer").classList.add("open"); }
function closeCart() { document.getElementById("cartOverlay").classList.remove("open"); document.getElementById("cartDrawer").classList.remove("open"); }

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  if (!cart.length) { showToast("Cart is empty. Add some food first."); return; }
  const user     = auth.currentUser;
  const subtotal = cart.reduce((s, i) => { const ex = i.extras?.reduce((es, e) => es + e.price * e.qty, 0) || 0; return s + (i.price + ex) * i.qty; }, 0);
  const tax   = subtotal * TAX;
  const total = subtotal + tax;
  try {
    await addDoc(collection(db, "orders"), {
      uid: user?.uid || "guest", userName: user?.displayName || "Guest",
      items: cart.map(i => ({ name: i.name, price: i.price + (i.extras?.reduce((s,e) => s + e.price * e.qty, 0) || 0), qty: i.qty, extras: i.extras || [] })),
      subtotal: +subtotal.toFixed(2), tax: +tax.toFixed(2), total: +total.toFixed(2),
      status: "pending", time: serverTimestamp(),
    });
    cart = []; updateCartUI(); closeCart(); showToast("Order placed! Mama is cooking.");
  } catch (e) { console.error(e); showToast("Order failed. Please try again."); }
});

/* ── Category tabs ── */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const cat = tab.dataset.cat;
    document.querySelectorAll(".category-group").forEach(g => {
      g.classList.toggle("hidden", cat !== "all" && g.dataset.group !== cat);
    });
  });
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

