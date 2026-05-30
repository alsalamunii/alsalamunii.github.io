import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,       
  getDocs,      
  collection,
  query,
  orderBy,
  limit
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  getAnalytics,
  logEvent
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";

console.log("🐰 Script loaded!");

const firebaseConfig = {
  apiKey: "AIzaSyC3haJqrGABgiaDBVDNWq91T0uHN0wj0_w",
  authDomain: "getbunny-4fa71.firebaseapp.com",
  projectId: "getbunny-4fa71",
  storageBucket: "getbunny-4fa71.firebasestorage.app",
  messagingSenderId: "697945124500",
  appId: "1:697945124500:web:0112ba3384588f11488e81",
  measurementId: "G-T5VKBKQ2J5"
};

const app = initializeApp(firebaseConfig);
console.log("FIREBASE OK");

let analytics = null;
try {
  analytics = getAnalytics(app);
  console.log("📊 Analytics Ready");
  logEvent(analytics, "test_event");
} catch (e) {
  console.warn("Analytics unavailable", e);
}

const db = getFirestore(app);
console.log("FIRESTORE OK");
console.log("🔥 Firebase initialized");

const progressRef = doc(db, "bunny", "journey");
const donationsRef = collection(db, "donations");
const leaderboardQuery = query(
  donationsRef,
  orderBy("amount", "desc"),
  limit(3)
);

// متغيرات عالمية لحفظ الحالة الحالية في الصفحة
let currentCarrots = 0;
let currentSupporters = 0;
let currentProgress = 0;

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
    journeySection: document.getElementById("journey-section"),
    cookieBanner: document.getElementById("cookieBanner"),
    acceptBtn: document.getElementById("acceptCookiesBtn")
  };

  console.log("📍 DOM cached");

  loadInitialProgress();
  loadLeaderboard();
  setupCookieBanner();
  handleStripeSuccess();
}

function renderProgressUI(carrots, supporters, progress) {
  if (DOM.pathFill) DOM.pathFill.style.width = progress + "%";

  if (DOM.bunnyCharacter) {
    const safeProgress = Math.max(3, Math.min(progress, 97));
    DOM.bunnyCharacter.style.left = `calc(${safeProgress}% - 30px)`;

    DOM.bunnyCharacter.classList.add("hop");
    setTimeout(() => {
      DOM.bunnyCharacter.classList.remove("hop");
    }, 600);
  }

  if (DOM.progressPercentage) DOM.progressPercentage.textContent = Math.round(progress) + "%";
  if (DOM.totalSupporters) DOM.totalSupporters.textContent = supporters;
  if (DOM.carrotsEarned) DOM.carrotsEarned.textContent = "$" + carrots.toFixed(2);
}

// تعديل الدالة لتعمل بنظام العزل التام
async function loadInitialProgress() {
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";

  // 1. إذا كان المستخدم راجعاً من الدفع بنجاح، استعد حالته القديمة "هو فقط" المخزنة محلياً
  if (isSuccess && localStorage.getItem("frozen_carrots") !== null) {
    console.log("✨ Success detected. Loading frozen state for total isolation...");
    
    let carrots = parseFloat(localStorage.getItem("frozen_carrots") || 0);
    let supporters = parseInt(localStorage.getItem("frozen_supporters") || 0);
    let progress = parseFloat(localStorage.getItem("frozen_progress") || 0);
    const paidAmount = parseFloat(localStorage.getItem("pendingDonation") || 0);

    if (!isNaN(paidAmount) && paidAmount > 0) {
      // أضف عليها قيمته الشخصية الجديدة فقط
      carrots += paidAmount;
      supporters += 1;
      
      const totalGoal = 10000; // قيمة هدفك الكلي التقديري لحساب حركة الأرنب
      progress = Math.min(100, progress + ((paidAmount / totalGoal) * 100));
    }

    renderProgressUI(carrots, supporters, progress);
    return; // أوقف الدالة هنا (لا تسأل السيرفر عن أي شيء منعاً للتداخل)
  }

  // 2. إذا كان تصفح عادي أو عمل Refresh، اجلب البيانات الحية من السيرفر بشكل طبيعي
  console.log("📦 Loading fresh progress data from Firestore...");
  try {
    const snap = await getDoc(progressRef);
    if (snap.exists()) {
      const data = snap.data();
      currentCarrots = data.carrots || 0;
      currentSupporters = data.supporters || 0;
      currentProgress = data.progress || 0;

      renderProgressUI(currentCarrots, currentSupporters, currentProgress);
    } else {
      await setDoc(progressRef, { progress: 0, supporters: 0, carrots: 0, createdAt: new Date().toISOString() });
      renderProgressUI(0, 0, 0);
    }
  } catch (error) {
    console.error("❌ Progress load error:", error);
  }
}

async function loadLeaderboard() {
  // نمنع جلب المتصدرين الجدد لو راجع من دفع ناجح لضمان عدم ظهور اسم مستخدم آخر تداخل معه
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") return; 

  if (!DOM.leaderboardList) return;

  try {
    const snapshot = await getDocs(leaderboardQuery);
    DOM.leaderboardList.innerHTML = "";

    if (snapshot.empty) {
      if (DOM.emptyLeaderboard) DOM.emptyLeaderboard.style.display = "block";
      return;
    }

    if (DOM.emptyLeaderboard) DOM.emptyLeaderboard.style.display = "none";
    let donations = [];
    snapshot.forEach((doc) => { donations.push(doc.data()); });

    donations.sort((a, b) => b.amount - a.amount);

    donations.forEach((d, i) => {
      const rank = i + 1;
      let emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

      const item = document.createElement("div");
      item.className = "leaderboard-item";
      item.innerHTML = `
        <div class="leaderboard-rank">${emoji}</div>
        <div class="leaderboard-info">
          <div class="supporter-name">${escapeHtml(d.name || "Anonymous")}</div>
          <div class="supporter-amount">💖 $${(d.amount || 0).toFixed(2)}</div>
        </div>
      `;
      DOM.leaderboardList.appendChild(item);
    });
  } catch (error) {
    console.error("❌ Leaderboard load error:", error);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showPopup(message) {
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
  setTimeout(() => { popup.style.opacity = "1"; }, 10);
  setTimeout(() => { popup.style.opacity = "0"; }, 2400);
  setTimeout(() => { popup.remove(); }, 3000);
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
    setTimeout(() => { confetti.remove(); }, 3000);
  }
}

window.scrollToJourney = function() {
  if (DOM.journeySection) DOM.journeySection.scrollIntoView({ behavior: "smooth" });
};

window.selectAmount = function(amount) {
  if (DOM.customAmount) DOM.customAmount.value = amount;
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.remove("active");
    const amountSpan = btn.querySelector(".amount");
    if (amountSpan && amountSpan.innerText.trim() === `$${amount}`) btn.classList.add("active");
  });
};

window.processSupport = function(event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }

  const amount = Number(DOM.customAmount?.value || 0);
  const errorLabel = document.getElementById("amountError");

  if (errorLabel) { errorLabel.style.display = "none"; if (DOM.customAmount) DOM.customAmount.style.border = ""; }
  if (!amount || isNaN(amount)) { showPopup("Enter valid amount"); return false; }
  if (amount < 1) {
    if (errorLabel) { errorLabel.textContent = "❌ Minimum support amount is $1.00"; errorLabel.style.display = "block"; }
    if (DOM.customAmount) DOM.customAmount.style.border = "2px solid #ff4d4d";
    showPopup("🐰 Minimum amount is $1");
    resetPaymentButton();
    return false;
  }
  if (amount > 10000) { showPopup("🐰 Support amount cannot exceed $10,000"); return false; }

  if (window.processingPayment) return false;
  window.processingPayment = true;

  const name = escapeHtml((DOM.supporterName?.value || "").trim()) || "Anonymous Bunny Friend";

  // 🔥 سحر الفكرة هنا: نجمد حالة العدادات الحالية قبل الانتقال لصفحة الدفع
  localStorage.setItem("pendingDonation", amount.toString());
  localStorage.setItem("pendingName", name);
  localStorage.setItem("frozen_carrots", currentCarrots.toString());
  localStorage.setItem("frozen_supporters", currentSupporters.toString());
  localStorage.setItem("frozen_progress", currentProgress.toString());

  const checkoutUrl = `https://bunny-api.mothmedtameraii.workers.dev/create-checkout-session?amount=${amount}&name=${encodeURIComponent(name)}`;

  if (analytics) logEvent(analytics, "support_clicked", { amount: amount });

  const button = document.querySelector(".full-width");
  if (button) {
    button.disabled = true;
    button.style.opacity = "0.7";
    button.style.cursor = "not-allowed";
    button.innerHTML = `<span class="spinner"></span>Redirecting...`;
  }

  setTimeout(() => { window.location.href = checkoutUrl; }, 500);
  return false;
};

function resetPaymentButton() {
    window.processingPayment = false;
    const button = document.querySelector(".full-width");
    if (button) {
        button.disabled = false;
        button.style.opacity = "";
        button.style.cursor = "";
        button.innerHTML = `<span class="btn-icon">💝</span> Support the Journey`;
    }
}

resetPaymentButton();

window.addEventListener("pageshow", (event) => { if (event.persisted) resetPaymentButton(); });

async function handleStripeSuccess() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success");

  if (success !== "true") return;

  const paidAmount = Number(localStorage.getItem("pendingDonation") || 0);
  if (analytics) logEvent(analytics, "payment_success", { amount: paidAmount });

  createCelebration();
  showPopup("🐰 Thank you for supporting the journey! 💝");

  // تنظيف الذاكرة المؤقتة تماماً بعد الانتهاء
  localStorage.removeItem("pendingName");
  localStorage.removeItem("pendingDonation");
  localStorage.removeItem("frozen_carrots");
  localStorage.removeItem("frozen_supporters");
  localStorage.removeItem("frozen_progress");

  setTimeout(() => {
    window.location.href = window.location.pathname; // يعيد توجيهه للصفحة النظيفة بدون ?success=true
  }, 4500);
}

function setupCookieBanner() {
  if (localStorage.getItem("cookiesAccepted") === "true") {
    if (DOM.cookieBanner) DOM.cookieBanner.style.display = "none";
    return;
  }
  if (DOM.acceptBtn && DOM.cookieBanner) {
    DOM.acceptBtn.addEventListener("click", () => {
      localStorage.setItem("cookiesAccepted", "true");
      DOM.cookieBanner.style.opacity = "0";
      DOM.cookieBanner.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => { DOM.cookieBanner.remove(); }, 300);
    });
  }
}

initializeDOMCache();