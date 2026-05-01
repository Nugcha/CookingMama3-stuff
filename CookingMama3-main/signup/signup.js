import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
                           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp }
                           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Role / email map ── */
const OWNER_EMAIL   = "azaharulislam171@gmail.com";
const MANAGER_EMAIL = "mateusstavares2008@gmail.com";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCEAcwTKoSnUkbaGvjrsy1QZ-Duj12WImk",
  authDomain:        "cookingmamauwu-9902c.firebaseapp.com",
  projectId:         "cookingmamauwu-9902c",
  storageBucket:     "cookingmamauwu-9902c.firebasestorage.app",
  messagingSenderId: "18763902036",
  appId:             "1:18763902036:web:a8703f75e5ddf1d1b791c1",
};

const app      = initializeApp(FIREBASE_CONFIG);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ── Theme ── */
const saved = localStorage.getItem("mama-theme") || "light";
applyTheme(saved);

document.getElementById("themePill").addEventListener("click", () => {
  const cur  = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("mama-theme", next);
});

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeIcon").textContent  = t === "dark" ? "Light" : "Dark";
}

/* ── Helpers ── */
function show(el) { el.style.display = "flex"; }
function hide(el) { el.style.display = "none"; }
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3500);
}

async function saveUser(user) {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const role = user.email === OWNER_EMAIL   ? "owner"
             : user.email === MANAGER_EMAIL ? "manager"
             : "customer";
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, displayName: user.displayName,
      email: user.email, photoURL: user.photoURL,
      role, createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
  }
}

function getDestination(user) {
  if (user.email === OWNER_EMAIL)   return "../owner/owner.html";
  if (user.email === MANAGER_EMAIL) return "../manager/manager.html";
  return "../customer/customer.html";
}

/* ── Auth state ── */
onAuthStateChanged(auth, async (user) => {
  document.getElementById("authLoader").style.display = "none";
  hide(document.getElementById("loadingState"));
  if (user) {
    try { await saveUser(user); } catch (e) { console.warn(e); }
    document.getElementById("userAvatar").src = user.photoURL || "";
    document.getElementById("userName").textContent   = user.displayName?.split(" ")[0] || "Guest";
    document.getElementById("welcomeMsg").textContent = `Welcome back, ${user.displayName?.split(" ")[0] || "Guest"}!`;
    hide(document.getElementById("signedOutState"));
    show(document.getElementById("signedInState"));
  } else {
    hide(document.getElementById("signedInState"));
    show(document.getElementById("signedOutState"));
  }
});

/* ── Enter button ── */
document.getElementById("enterBtn").addEventListener("click", () => {
  const u = auth.currentUser;
  if (u) window.location.href = getDestination(u);
});

/* ── Google sign-in ── */
document.getElementById("btnGoogle").addEventListener("click", async () => {
  const btn = document.getElementById("btnGoogle");
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Signing in...`;
  try {
    const result = await signInWithPopup(auth, provider);
    window.location.href = getDestination(result.user);
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") showToast("Sign-in failed. Please try again.");
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M44.5 20H24v8.5h11.7C34.2 33.6 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.8 5.5 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20.3-7.8 20.3-21 0-1.4-.1-2.7-.3-4z"/></svg> Sign in with Google`;
  }
});

/* ── Sign out ── */
document.getElementById("btnSignOut").addEventListener("click", async () => {
  await signOut(auth);
});

