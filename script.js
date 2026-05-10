// Firebase (مربوط من index.html)
const db = window.db;

// State
const state = {
    totalDonated: 0,
    supporters: [],
    goal: 500,
};

// 🔥 تحميل البيانات من Firebase
async function loadState() {
    const snapshot = await db.ref("bunny").get();

    if (snapshot.exists()) {
        const data = snapshot.val();
        state.totalDonated = data.totalDonated || 0;
        state.supporters = data.supporters || [];
    }

    updateUI();
}

// 💾 حفظ البيانات في Firebase
function saveState() {
    db.ref("bunny").set({
        totalDonated: state.totalDonated,
        supporters: state.supporters
    });
}

// Select amount
function selectAmount(amount) {
    document.getElementById('customAmount').value = amount;

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.closest('.preset-btn').classList.add('active');
}

// 🚀 دعم جديد
function processSupport() {
    const customAmount = parseFloat(document.getElementById('customAmount').value);
    const supporterName = document.getElementById('supporterName').value.trim() || 'Anonymous Bunny Friend';

    if (!customAmount || customAmount <= 0) {
        alert('🐰 Please enter a valid support amount!');
        return;
    }

    state.supporters.push({
        name: supporterName,
        amount: customAmount,
        date: new Date().toLocaleString(),
    });

    state.totalDonated += customAmount;

    saveState(); // 🔥 Firebase save

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

function updateProgressBar() {
    const percentage = Math.min((state.totalDonated / state.goal) * 100, 100);

    document.getElementById('pathFill').style.width = percentage + '%';
    document.getElementById('bunnyCharacter').style.left = percentage + '%';

    document.getElementById('progressPercentage').textContent =
        Math.round(percentage) + '%';
}

function updateStats() {
    document.getElementById('totalSupporters').textContent = state.supporters.length;
    document.getElementById('carrotsEarned').textContent =
        Math.floor(state.totalDonated / 5);
}

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

// 🎉 احتفالات
function celebrate() {
    const container = document.getElementById('celebrationContainer');
    const items = ['🎉','✨','💝','🐰','🥕','⭐'];

    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.textContent = items[Math.floor(Math.random() * items.length)];
        el.style.position = 'absolute';
        el.style.left = Math.random() * 100 + '%';
        el.style.top = '-20px';
        el.style.fontSize = '20px';

        container.appendChild(el);

        setTimeout(() => el.remove(), 2000);
    }
}

// Scroll
function scrollToJourney() {
    document.getElementById('journey-section')
        .scrollIntoView({ behavior: 'smooth' });
}

// Load
window.addEventListener('load', loadState);

// Enter key
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'customAmount') {
        processSupport();
    }
});