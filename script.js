// ========== FIREBASE INITIALIZATION ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

console.log("🐰 Script loaded!");

// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyC3haJqrGABgiaDBVDNWq91T0uHN0wj0_w",
  authDomain: "getbunny-4fa71.firebaseapp.com",
  projectId: "getbunny-4fa71",
  storageBucket: "getbunny-4fa71.firebasestorage.app",
  messagingSenderId: "697945124500",
  appId: "1:697945124500:web:0112ba3384588f11488e81"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase initialized");

const progressRef = doc(db, "bunny", "journey");
const donationsRef = collection(db, "donations");

// ========== WAIT FOR DOM TO BE READY ==========
function waitForDOM() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// ========== CACHED DOM ELEMENTS ==========
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
  
  console.log("📍 DOM elements cached");
  
  // Verify all elements exist
  Object.entries(DOM).forEach(([key, element]) => {
    if (!element) {
      console.warn(`⚠️ DOM element missing: ${key}`);
    }
  });
}

let currentProgress = 0;

// ========== SETUP FIREBASE REAL-TIME LISTENERS ==========

function setupFirebaseListeners() {
  // Listen to Progress Updates
  console.log("👂 Setting up progress listener...");
  onSnapshot(progressRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      currentProgress = data.progress || 0;
      
      // Update UI
      if (DOM.pathFill) DOM.pathFill.style.width = currentProgress + "%";
      if (DOM.bunnyCharacter) DOM.bunnyCharacter.style.left = currentProgress + "%";
      if (DOM.progressPercentage) DOM.progressPercentage.textContent = Math.round(currentProgress) + "%";
      if (DOM.totalSupporters) DOM.totalSupporters.textContent = data.supporters || 0;
      if (DOM.carrotsEarned) DOM.carrotsEarned.textContent = "$" + (data.carrots || 0).toFixed(2);
      
      console.log("✅ Progress synced from Firebase:", data);
    } else {
      console.log("📝 Progress doc doesn't exist, creating...");
      setDoc(progressRef, {
        progress: 0,
        supporters: 0,
        carrots: 0,
        createdAt: new Date().toISOString()
      }).then(() => {
        console.log("✅ Progress doc created");
      });
    }
  }, (error) => {
    console.error("❌ Progress listener error:", error);
  });

  // Listen to Donations (Leaderboard)
  console.log("👂 Setting up leaderboard listener...");
  onSnapshot(donationsRef, (snapshot) => {
    if (!DOM.leaderboardList) return;
    
    DOM.leaderboardList.innerHTML = "";
    
    if (snapshot.empty) {
      if (DOM.emptyLeaderboard) DOM.emptyLeaderboard.style.display = "block";
      console.log("📭 Leaderboard is empty");
      return;
    }
    
    if (DOM.emptyLeaderboard) DOM.emptyLeaderboard.style.display = "none";
    let donations = [];
    
    snapshot.forEach((doc) => {
      donations.push(doc.data());
    });
    
    // Sort by amount (highest first)
    donations.sort((a, b) => b.amount - a.amount);
    
    // Show top 10
    donations.slice(0, 10).forEach((d, i) => {
      const rank = i + 1;
      let emoji = "🥇";
      
      if (rank === 2) emoji = "🥈";
      else if (rank === 3) emoji = "🥉";
      else emoji = `#${rank}`;
      
      const item = document.createElement("div");
      item.className = "leaderboard-item";
      item.innerHTML = `
        <div class="leaderboard-rank">${emoji}</div>
        <div class="leaderboard-info">
          <div class="supporter-name">${escapeHtml(d.name || "Anonymous")}</div>
          <div class="supporter-amount">💖 $${d.amount.toFixed(2)} • ${d.date || new Date().toLocaleDateString()}</div>
        </div>
      `;
      DOM.leaderboardList.appendChild(item);
    });
    
    console.log(`✅ Leaderboard updated with ${donations.length} donations`);
  }, (error) => {
    console.error("❌ Leaderboard listener error:", error);
  });
}

// ========== HELPER FUNCTIONS ==========

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showPopup(message) {
  console.log("💬 Showing popup:", message);
  
  const popup = document.createElement("div");
  popup.innerHTML = message;
  popup.style.position = "fixed";
  popup.style.top = "30px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "rgba(255, 255, 255, 0.12)";
  popup.style.backdropFilter = "blur(16px)";
  popup.style.padding = "18px 28px";
  popup.style.borderRadius = "20px";
  popup.style.color = "white";
  popup.style.fontSize = "18px";
  popup.style.zIndex = "999999";
  popup.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.2)";
  popup.style.animation = "fadeIn 0.3s ease";
  
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateX(-50%) translateY(-20px)";
    popup.style.transition = "all 0.3s ease";
  }, 2200);
  
  setTimeout(() => {
    popup.remove();
  }, 2600);
}

function createCelebration() {
  console.log("🎉 Creating celebration...");
  
  if (!DOM.celebrationContainer) {
    console.error("❌ Celebration container not found");
    return;
  }
  
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
    confetti.style.opacity = "1";
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

// ========== GLOBAL FUNCTIONS (for onclick) ==========

window.selectAmount = function(amount) {
  console.log("💰 Selected amount:", amount);
  if (DOM.customAmount) DOM.customAmount.value = amount;
  
  // Highlight button
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  event.target.closest(".preset-btn")?.classList.add("active");
};

window.scrollToJourney = function() {
  console.log("📜 Scrolling to journey section...");
  if (DOM.journeySection) {
    DOM.journeySection.scrollIntoView({
      behavior: "smooth"
    });
  }
};

window.processSupport = function() {
  console.log("🔄 Processing support...");
  
  const amount = parseFloat(DOM.customAmount?.value || 0);
  const name = (DOM.supporterName?.value || "").trim() || "Anonymous Bunny Friend";
  
  console.log("📋 Form values:");
  console.log("  Amount:", amount);
  console.log("  Type:", typeof amount);
  console.log("  Name:", name);
  
  // Validate
  if (!amount || amount <= 0 || isNaN(amount)) {
    console.error("❌ Invalid amount:", amount);
    showPopup("🐰 Please enter a valid support amount!");
    return false;
  }
  
  if (amount > 10000) {
    console.error("❌ Amount too high:", amount);
    showPopup("🐰 Support amount cannot exceed $10,000");
    return false;
  }
  
  console.log("✅ Validation passed");
  
  // Save to localStorage
  localStorage.setItem("pendingDonation", amount.toString());
  localStorage.setItem("pendingName", name);
  
  console.log("💾 Saved to localStorage");
  
  // Redirect to Stripe
  const checkoutUrl = `https://bunny-api.mothmedtameraii.workers.dev/create-checkout-session?amount=${amount}`;
  console.log("🔗 Redirecting to Stripe:", checkoutUrl);
  
  window.location.href = checkoutUrl;
  return false;
};

// ========== STRIPE SUCCESS HANDLER ==========

async function handleStripeSuccess() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success");
  const amount = Number(params.get("amount"));
  
  console.log("🔍 Checking for Stripe success...");
  console.log("  success param:", success);
  console.log("  amount param:", amount);
  
  if (success !== "true") {
    console.log("ℹ️ No Stripe success to process");
    return;
  }
  
  console.log("🎯 STRIPE SUCCESS DETECTED!");
  
  const savedName = localStorage.getItem("pendingName") || "Anonymous";
  
  console.log("📦 Payment details:");
  console.log("  Amount: $" + amount);
  console.log("  Name:", savedName);
  
  // Validate
  if (amount <= 0 || isNaN(amount)) {
    console.error("❌ Invalid amount:", amount);
    showPopup("🐰 Invalid payment amount");
    return;
  }
  
  try {
    console.log("💾 Reading current progress from Firebase...");
    const snap = await getDoc(progressRef);
    const data = snap.exists() ? snap.data() : { progress: 0, supporters: 0, carrots: 0 };
    
    console.log("📊 Current data:", data);
    
    // Calculate new progress (every $5 = 1%)
    const progressIncrease = Math.floor(amount / 5);
    const newProgress = Math.min((data.progress || 0) + progressIncrease, 100);
    
    console.log("🧮 Calculations:");
    console.log("  Progress increase: " + progressIncrease + "%");
    console.log("  New progress: " + newProgress + "%");
    
    // Update progress in Firebase
    console.log("⬆️ Updating progress in Firebase...");
    await updateDoc(progressRef, {
      progress: newProgress,
      supporters: (data.supporters || 0) + 1,
      carrots: (data.carrots || 0) + amount,
      lastUpdated: new Date().toISOString()
    });
    console.log("✅ Progress updated");
    
    // Add donation to leaderboard
    console.log("⬆️ Adding donation to leaderboard...");
    await addDoc(donationsRef, {
      name: savedName,
      amount: amount,
      date: new Date().toLocaleDateString(),
      time: new Date().toISOString()
    });
    console.log("✅ Donation added");
    
    // Celebrate
    createCelebration();
    showPopup("🐰 Thank you for supporting the journey! 💝");
    
    // Clean up
    localStorage.removeItem("pendingName");
    localStorage.removeItem("pendingDonation");
    
    // Remove success params from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log("✅ Payment fully processed!");
  } catch (error) {
    console.error("❌ Error processing payment:", error);
    showPopup("🐰 Error processing payment. Please try again.");
  }
}

// ========== STARTUP ==========

async function startup() {
  console.log("🚀 Starting Bunny Journey App...");
  
  // Wait for DOM
  await initializeDOMCache();
  
  // Setup Firebase listeners
  setupFirebaseListeners();
  
  // Check for Stripe success
  handleStripeSuccess();
  
  console.log("✅ Bunny Journey App Ready!");
}

// Start when DOM is ready
startup();