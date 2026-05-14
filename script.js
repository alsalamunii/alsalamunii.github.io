// State Management
const state = {
    totalDonated: 0,
    supporters: [],
    goal: 500, // Target amount to reach 100%
};

// Load data from localStorage
function loadState() {
    const saved = localStorage.getItem('bunnyJourneyState');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.totalDonated = parsed.totalDonated || 0;
        state.supporters = parsed.supporters || [];
    }
    updateUI();
}

// Save data to localStorage
function saveState() {
    localStorage.setItem('bunnyJourneyState', JSON.stringify(state));
}

// Select preset amount
function selectAmount(amount) {
    document.getElementById('customAmount').value = amount;
    // Highlight the button
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.preset-btn').classList.add('active');
}

// Process support/donation
async function processSupport() {

  const amount =
    Number(document.getElementById("customAmount").value);

  if (!amount || amount <= 0) {

    showPopup("Enter a valid amount 🐰");

    return;
  }

  const response = await fetch(
    `https://bunny-api.mothmedtameraii.workers.dev/create-checkout-session?amount=${amount}`
  );

  const data = await response.json();

  if (data.url) {

    window.location.href = data.url;

  } else {

    showPopup("Stripe error 🐰");

  }

}

    // Add to supporters
    state.supporters.push({
        name: supporterName,
        amount: customAmount,
        date: new Date().toLocaleString(),
    });

    // Update total
    state.totalDonated += customAmount;

    // Save state
    saveState();

    // Clear inputs
    document.getElementById('customAmount').value = '';
    document.getElementById('supporterName').value = '';
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Celebration
    celebrate();

    // Update UI
    updateUI();
}

// Update all UI elements
function updateUI() {
    updateProgressBar();
    updateStats();
    updateLeaderboard();
}

// Update progress bar and bunny position
function updateProgressBar() {
    const percentage = Math.min((state.totalDonated / state.goal) * 100, 100);
    const pathFill = document.getElementById('pathFill');
    const bunnyCharacter = document.getElementById('bunnyCharacter');

    pathFill.style.width = percentage + '%';
    bunnyCharacter.style.left = percentage + '%';

    // Update percentage display
    document.getElementById('progressPercentage').textContent = Math.round(percentage) + '%';
}

// Update stats
function updateStats() {
    document.getElementById('totalSupporters').textContent = state.supporters.length;
    document.getElementById('carrotsEarned').textContent = Math.floor(state.totalDonated / 5);
}

// Update leaderboard
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const emptyLeaderboard = document.getElementById('emptyLeaderboard');

    if (state.supporters.length === 0) {
        leaderboardList.innerHTML = '';
        emptyLeaderboard.style.display = 'block';
        return;
    }

    emptyLeaderboard.style.display = 'none';

    // Sort by amount descending
    const sorted = [...state.supporters].sort((a, b) => b.amount - a.amount);

    // Get top 10
    const topTen = sorted.slice(0, 10);

    leaderboardList.innerHTML = topTen.map((supporter, index) => {
        const rank = index + 1;
        let rankEmoji = '🥇';
        let rankClass = 'rank-1';

        if (rank === 2) {
            rankEmoji = '🥈';
            rankClass = 'rank-2';
        } else if (rank === 3) {
            rankEmoji = '🥉';
            rankClass = 'rank-3';
        } else {
            rankEmoji = `#${rank}`;
            rankClass = 'rank-other';
        }

        return `
            <div class="leaderboard-item">
                <div class="leaderboard-rank ${rankClass}">${rankEmoji}</div>
                <div class="leaderboard-info">
                    <div class="supporter-name">${escapeHtml(supporter.name)}</div>
                    <div class="supporter-amount">$${supporter.amount.toFixed(2)} • ${supporter.date}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML for security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Celebration animation
function celebrate() {
    const celebrationContainer = document.getElementById('celebrationContainer');
    const confettiItems = ['🎉', '🌟', '✨', '💝', '🐰', '🥕', '💫', '⭐'];

    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.textContent = confettiItems[Math.floor(Math.random() * confettiItems.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.fontSize = (Math.random() * 20 + 10) + 'px';
        confetti.style.opacity = Math.random() * 0.5 + 0.5;

        celebrationContainer.appendChild(confetti);

        // Trigger animation
        setTimeout(() => {
            confetti.classList.add('animate');
        }, 10);

        // Remove element after animation
        setTimeout(() => {
            confetti.remove();
        }, 2000);
    }
}

// Scroll to journey section
function scrollToJourney() {
    const journeySection = document.getElementById('journey-section');
    journeySection.scrollIntoView({ behavior: 'smooth' });
}

// Initialize on load
window.addEventListener('load', () => {
    loadState();
});

// Optional: Add keyboard support for Enter key
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'customAmount') {
        processSupport();
    }
});
function showPopup(message) {

  const popup = document.createElement("div");

  popup.innerHTML = message;

  popup.style.position = "fixed";
  popup.style.top = "30px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background =
    "rgba(255,255,255,0.12)";
  popup.style.backdropFilter = "blur(16px)";
  popup.style.padding = "18px 28px";
  popup.style.borderRadius = "20px";
  popup.style.color = "white";
  popup.style.fontSize = "18px";
  popup.style.zIndex = "999999";
  popup.style.boxShadow =
    "0 10px 40px rgba(0,0,0,0.2)";
  popup.style.border =
    "1px solid rgba(255,255,255,0.15)";
  popup.style.animation =
    "popupFade 0.3s ease";

  document.body.appendChild(popup);

  setTimeout(() => {

    popup.style.opacity = "0";

    popup.style.transform =
      "translateX(-50%) translateY(-20px)";

  }, 2200);

  setTimeout(() => {

    popup.remove();

  }, 2600);

}