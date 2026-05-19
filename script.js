import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

console.log("🐰 Script loaded!");

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

const progressRef = doc(db, "bunny", "journey");
const donationsRef = collection(db, "donations");
const leaderboardQuery = query(
  donationsRef,
  orderBy("amount", "desc"),
  limit(3)
);

function waitForDOM() {
  return new Promise(resolve => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", resolve);
    } else {
      resolve();
    }
  });
}

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

function setupFirebaseListeners() {
  console.log("👂 Listening for leaderboard...");

  onSnapshot(leaderboardQuery, (snapshot) => {
    if (!DOM.leaderboardList) return;

    DOM.leaderboardList.innerHTML = "";

    if (snapshot.empty) {
      if (DOM.emptyLeaderboard) {
        DOM.emptyLeaderboard.style.display = "block";
      }
      return;
    }

    if (DOM.emptyLeaderboard) {
      DOM.emptyLeaderboard.style.display = "none";
    }

    let donations = [];

    snapshot.forEach((doc) => {
      donations.push(doc.data());
    });

    donations.forEach((d, i) => {
      const rank = i + 1;
      let emoji = "🥇";

      if (rank === 2) emoji = "🥈";
      else if (rank === 3) emoji = "🥉";

      const item = document.createElement("div");
      item.className = "leaderboard-item";
      item.innerHTML = `
        <div class="leaderboard-rank">
          ${emoji}
        </div>
        <div class="leaderboard-info">
          <div class="supporter-name">
            ${escapeHtml(d.name || "Anonymous")}
          </div>
          <div class="supporter-amount">
            💖 $${(d.amount || 0).toFixed(2)}
          </div>
        </div>
      `;
      DOM.leaderboardList.appendChild(item);
    });

    console.log("✅ Leaderboard synced");
  }, (error) => {
    console.error("❌ Leaderboard error:", error);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showPopup(message) {
  console.log("💬 Popup:", message);

  const popup = document.createElement("div");
  popup.textContent = message;

  popup.style.position = "fixed";
  popup.style.top = "30px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "linear-gradient(135deg, rgba(255, 105, 180, 0.95), rgba(255, 182, 193, 0.95))";
  popup.style.backdropFilter = "blur(18px)";
  popup.style.padding = "18px 28px";
  popup.style.borderRadius = "22px";
  popup.style.color = "white";
  popup.style.fontSize = "18px";
  popup.style.fontWeight = "600";
  popup.style.zIndex = "999999";
  popup.style.boxShadow = "0 15px 45px rgba(255, 105, 180, 0.45)";
  popup.style.border = "1px solid rgba(255,255,255,0.3)";
  popup.style.textAlign = "center";
  popup.style.minWidth = "280px";
  popup.style.opacity = "0";
  popup.style.transition = "all 0.35s ease";

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateX(-50%) translateY(0px)";
  }, 10);

  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateX(-50%) translateY(-20px)";
  }, 2400);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}

function createCelebration() {
  if (!DOM.celebrationContainer) return;

  const items = ["✨", "🥕", "🐰", "⭐", "🎉", "💝"];

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.innerHTML = items[Math.floor(Math.random() * items.length)];

    confetti.style.position = "fixed";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.top = "-20px";
    confetti.style.fontSize = Math.random() * 20 + 20 + "px";
    confetti.style.zIndex = "9999";
    confetti.style.pointerEvents = "none";
    confetti.style.transition = "all 3s ease-out";

    DOM.celebrationContainer.appendChild(confetti);

    setTimeout(() => {
      confetti.style.transform = `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`;
      confetti.style.opacity = "0";
    }, 10);

    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}

window.selectAmount = function(amount) {
  console.log("💰 Selected:", amount);

  if (DOM.customAmount) {
    DOM.customAmount.value = amount;
  }

  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.remove("active");
    const amountSpan = btn.querySelector(".amount");
    if (amountSpan) {
      const btnAmountText = amountSpan.innerText.trim();
      if (btnAmountText === `$${amount}`) {
        btn.classList.add("active");
      }
    }
  });
};

window.scrollToJourney = function() {
  if (DOM.journeySection) {
    DOM.journeySection.scrollIntoView({
      behavior: "smooth"
    });
  }
};

window.processSupport = function() {
  const button = document.querySelector(".full-width");
  if (button.disabled) return;

  console.log("🔄 Processing support...");

  const amount = parseFloat(DOM.customAmount?.value || 0);
  const name = (DOM.supporterName?.value || "").trim() || "Anonymous Bunny Friend";

  console.log("📋 Amount:", amount);
  console.log("📋 Name:", name);

  if (!amount || amount <= 0 || isNaN(amount)) {
    showPopup("🐰 Please enter a valid amount");
    return false;
  }

  if (amount > 10000) {
    showPopup("🐰 Amount too large");
    return false;
  }

  localStorage.setItem("pendingName", name);
  localStorage.setItem("pendingDonation", amount.toString());

  console.log("💾 Saved locally");

  const checkoutUrl = `https://bunny-worker.mothmedtameraii.workers.dev/create-checkout-session?amount=${amount}&name=${encodeURIComponent(name)}`;
  console.log("🔗 Redirecting:", checkoutUrl);

  button.disabled = true;
  button.style.opacity = "0.7";
  button.innerHTML = "🐰 Redirecting...";

  window.location.href = checkoutUrl;
  return false;
};

async function handleStripeSuccess() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success");

  if (success !== "true") {
    return;
  }

  createCelebration();
  showPopup("🐰 Thank you for supporting the journey! 💝");

  localStorage.removeItem("pendingName");
  localStorage.removeItem("pendingDonation");

  window.history.replaceState({}, document.title, "/");
}

async function startup() {
  console.log("🚀 Starting app...");
  await initializeDOMCache();
  setupFirebaseListeners();
  await handleStripeSuccess();
  console.log("✅ Bunny Journey Ready!");
}

startup();