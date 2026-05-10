let db;

// State Management
const state = {
    totalDonated: 0,
    supporters: [],
    goal: 500,
};

// 🔥 Load data (Firebase + fallback localStorage)
async function loadState() {

    db = window.db; // FIX: نستنى Firebase يجهز هنا

    try {
        if (db) {
            const snapshot = await db.ref("bunny").get();

            if (snapshot.exists()) {
                const data = snapshot.val();
                state.totalDonated = data.totalDonated || 0;
                state.supporters = data.supporters || [];
            }
        } else {
            const saved = localStorage.getItem('bunnyJourneyState');
            if (saved) {
                const parsed = JSON.parse(saved);
                state.totalDonated = parsed.totalDonated || 0;
                state.supporters = parsed.supporters || [];
            }
        }
    } catch (e) {
        console.log("Firebase error → fallback localStorage");
    }

    updateUI();
}

// 💾 Save data
function saveState() {
    localStorage.setItem('bunnyJourneyState', JSON.stringify(state));

    if (db) {
        db.ref("bunny").set({
            totalDonated: state.totalDonated,
            supporters: state.supporters
        });
    }
}

// 🧹 RESET ALL
async function resetAll() {
    state.totalDonated = 0;
    state.supporters = [];

    localStorage.removeItem('bunnyJourneyState');

    if (db) {
        await db.ref("bunny").remove();
    }

    updateUI();
    alert("🐰 Reset completed!");
}

// Select preset amount
function selectAmount(amount) {
    document.getElementById('customAmount').value = amount;

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.closest('.preset-btn').classList.add('active');
}

// Support
function processSupport() {
    const customAmount = parseFloat(document.getElementById('customAmount').value);
    const supporterName = document.getElementById('supporterName').value.trim() || 'Anonymous Bunny Friend';

    if (!customAmount || customAmount <= 0) {
        alert('🐰 Please enter valid amount!');
        return;
    }

    state.supporters.push({
        name: supporterName,
        amount: customAmount,
        date: new Date().toLocaleString(),
    });

    state.totalDonated += customAmount;

    saveState();

    document.getElementById('customAmount').value = '';
    document.getElementById('supporterName').value = '';

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    celebrate();
    updateUI();
}

// UI
function updateUI() {
    updateProgressBar();
    updateStats();
    updateLeaderboard();
}

// Progress
function updateProgressBar() {
    const percentage = Math.min((state.totalDonated / state.goal) * 100, 100);

    document.getElementById('pathFill').style.width = percentage + '%';
    document.getElementById('bunnyCharacter').style.left = percentage + '%';

    document.getElementById('progressPercentage').textContent =
        Math.round(percentage) + '%';
}

// Stats
function updateStats() {
    document.getElementById('totalSupporters').textContent = state.supporters.length;
    document.getElementById('carrotsEarned').textContent =
        Math.floor(state.totalDonated / 5);
}

// Leaderboard
function updateLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const empty = document.getElementById('emptyLeaderboard');

    if (state.supporters.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    const sorted = [...state.supporters].sort((a, b) => b.amount - a.amount);

    list.innerHTML = sorted.slice(0, 10).map((s, i) => `
        <div class="leaderboard-item">
            <div>#${i + 1}</div>
            <div>
                <b>${s.name}</b><br>
                $${s.amount} • ${s.date}
            </div>
        </div>
    `).join('');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Celebration
function celebrate() {
    const container = document.getElementById('celebrationContainer');
    const items = ['🎉','🌟','✨','💝','🐰','🥕','💫','⭐'];

    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.textContent = items[Math.floor(Math.random() * items.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.top = '-20px';
        el.style.position = 'absolute';
        el.style.fontSize = '18px';

        container.appendChild(el);

        setTimeout(() => el.remove(), 2000);
    }
}

// Scroll
function scrollToJourney() {
    document.getElementById('journey-section')
        .scrollIntoView({ behavior: 'smooth' });
}

// Init
window.addEventListener('load', loadState);

// Enter key
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'customAmount') {
        processSupport();
    }
});