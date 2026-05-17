// ========== FIREBASE INITIALIZATION ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

console.log("🐰 Script loaded!");

// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase initialized");

// ========== REFERENCES ==========
const progressRef = doc(db, "bunny", "journey");

// ========== WAIT FOR DOM ==========
function waitForDOM() {
  return new Promise(resolve => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", resolve);
    } else {
      resolve();
    }
  });
}

// ========== DOM CACHE ==========
let DOM = {};

async function initializeDOMCache() {

  await waitForDOM();

  DOM = {
    pathFill: document.getElementById("pathFill"),
    bunnyCharacter: document.getElementById("bunnyCharacter"),
    progressPercentage: document.getElementById("progressPercentage"),
    totalSupporters: document.getElementById("totalSupporters"),
    carrotsEarned: document.getElementById("carrotsEarned"),
    leaderboardList: document.getElementById("leaderboardList"),
    emptyLeaderboard: document.getElementById("emptyLeaderboard"),
    celebrationContainer: document.getElementById("celebrationContainer"),
    customAmount: document.getElementById("customAmount"),
    supporterName: document.getElementById("supporterName"),
    journeySection: document.getElementById("journey-section")
  };

  console.log("📍 DOM cached");

  Object.entries(DOM).forEach(([key, element]) => {
    if (!element) {
      console.warn("⚠️ Missing element:", key);
    }
  });

}

// ========== FIREBASE LISTENERS ==========
function setupFirebaseListeners() {

  console.log("👂 Listening for progress updates...");

  onSnapshot(progressRef, async (snap) => {

    if (snap.exists()) {

      const data = snap.data();

      const progress = data.progress || 0;

      if (DOM.pathFill) {
        DOM.pathFill.style.width = progress + "%";
      }

      if (DOM.bunnyCharacter) {
        DOM.bunnyCharacter.style.left = progress + "%";
      }

      if (DOM.progressPercentage) {
        DOM.progressPercentage.textContent =
          Math.round(progress) + "%";
      }

      if (DOM.totalSupporters) {
        DOM.totalSupporters.textContent =
          data.supporters || 0;
      }

      if (DOM.carrotsEarned) {
        DOM.carrotsEarned.textContent =
          "$" + (data.carrots || 0).toFixed(2);
      }

      console.log("✅ Firebase synced:", data);

    } else {

      console.log("📝 Creating initial document...");

      await setDoc(progressRef, {
        progress: 0,
        supporters: 0,
        carrots: 0,
        createdAt: new Date().toISOString()
      });

    }

  }, (error) => {

    console.error("❌ Firebase listener error:", error);

  });

}

// ========== HELPERS ==========
function escapeHtml(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}

function showPopup(message) {

  console.log("💬 Popup:", message);

  const popup = document.createElement("div");

  popup.innerHTML = escapeHtml(message);

  popup.style.position = "fixed";
  popup.style.top = "30px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "rgba(255,255,255,0.12)";
  popup.style.backdropFilter = "blur(16px)";
  popup.style.padding = "18px 28px";
  popup.style.borderRadius = "20px";
  popup.style.color = "white";
  popup.style.fontSize = "18px";
  popup.style.zIndex = "999999";
  popup.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";

  document.body.appendChild(popup);

  setTimeout(() => {

    popup.style.opacity = "0";
    popup.style.transition = "0.3s ease";

  }, 2200);

  setTimeout(() => {

    popup.remove();

  }, 2600);

}

function createCelebration() {

  if (!DOM.celebrationContainer) return;

  const items = ["✨", "🥕", "🐰", "⭐", "🎉", "💝"];

  for (let i = 0; i < 30; i++) {

    const confetti = document.createElement("div");

    confetti.innerHTML =
      items[Math.floor(Math.random() * items.length)];

    confetti.style.position = "fixed";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.top = "-20px";
    confetti.style.fontSize =
      Math.random() * 20 + 20 + "px";

    confetti.style.zIndex = "9999";
    confetti.style.pointerEvents = "none";
    confetti.style.transition = "all 3s ease-out";

    DOM.celebrationContainer.appendChild(confetti);

    setTimeout(() => {

      confetti.style.transform =
        `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`;

      confetti.style.opacity = "0";

    }, 10);

    setTimeout(() => {

      confetti.remove();

    }, 3000);

  }

}

// ========== GLOBAL FUNCTIONS ==========
window.selectAmount = function(amount) {

  console.log("💰 Selected:", amount);

  if (DOM.customAmount) {
    DOM.customAmount.value = amount;
  }

};

window.scrollToJourney = function() {

  if (DOM.journeySection) {

    DOM.journeySection.scrollIntoView({
      behavior: "smooth"
    });

  }

};

// ========== STRIPE CHECKOUT ==========
window.processSupport = function() {

  console.log("🔄 Processing support...");

  const amount =
    parseFloat(DOM.customAmount?.value || 0);

  const name =
    (DOM.supporterName?.value || "").trim()
    || "Anonymous Bunny Friend";

  console.log("📋 Amount:", amount);
  console.log("📋 Name:", name);

  // VALIDATION
  if (!amount || amount <= 0 || isNaN(amount)) {

    showPopup("🐰 Please enter a valid amount");

    return false;

  }

  if (amount > 10000) {

    showPopup("🐰 Amount too large");

    return false;

  }

  // SAVE TEMP DATA
  localStorage.setItem(
    "pendingName",
    name
  );

  localStorage.setItem(
    "pendingDonation",
    amount.toString()
  );

  console.log("💾 Saved locally");

  // REDIRECT TO STRIPE WORKER
 const checkoutUrl =
`https://bunny-api.mothmedtameraii.workers.dev/create-checkout-session?amount=${amount}&name=${encodeURIComponent(name)}`;

  console.log("🔗 Redirecting:", checkoutUrl);

  window.location.href = checkoutUrl;

  return false;

};

// ========== STRIPE SUCCESS HANDLER ==========
async function handleStripeSuccess() {

  const params =
    new URLSearchParams(window.location.search);

  const success =
    params.get("success");

  const session =
    params.get("session_id");

  console.log("🔍 Checking Stripe return...");

  if (success !== "true") {

    console.log("ℹ️ No success detected");

    return;

  }

  console.log("🎯 Stripe success detected");

  // IMPORTANT:
  // Frontend NO LONGER updates Firebase
  // Webhook handles that securely

  createCelebration();

  showPopup("🐰 Thank you for supporting the journey!");

  localStorage.removeItem("pendingName");
  localStorage.removeItem("pendingDonation");

  // Clean URL
  window.history.replaceState(
    {},
    document.title,
    "/"
  );

}

// ========== STARTUP ==========
async function startup() {

  console.log("🚀 Starting app...");

  await initializeDOMCache();

  setupFirebaseListeners();

  await handleStripeSuccess();

  console.log("✅ Bunny Journey Ready!");

}

startup();