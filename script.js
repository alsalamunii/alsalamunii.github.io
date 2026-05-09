// ===========================
// STATE MANAGEMENT
// ===========================

let state = {
    totalDonated: 0,
    totalSupporters: 0,
    supporters: [],
    selectedAmount: 0,
};

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('bunnyJourneyState');
    if (saved) {
        state = JSON.parse(saved);
        updateUI();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('bunnyJourneyState', JSON.stringify(state));
}

// ===========================
// SUPPORT FUNCTIONS
// ===========================

function selectAmount(amount) {
    state.selectedAmount = amount;
    document.getElementById('customAmount').value = '';
    
    // Update button states
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.preset-btn').classList.add('active');
}

function processSupport() {
    let amount = state.selectedAmount;
    
    // Get custom amount if no preset selected
    if (amount === 0) {
        const customAmount = parseFloat(document.getElementById('customAmount').value);
        if (!customAmount || customAmount <= 0) {
            showAlert('Please select or enter an amount! 💝');
            return;
        }
        amount = customAmount;
    }
    
    const supporterName = document.getElementById('supporterName').value || 'Anonymous Bunny Friend';
    
    // Add to supporters
    const supporter = {
        name: supporterName,
        amount: amount,
        timestamp: new Date()
    };
    
    state.supporters.unshift(supporter);
    state.totalDonated += amount;
    state.totalSupporters += 1;
    
    // Save state
    saveState();
    
    // Celebrate!
    celebrate();
    
    // Update UI
    updateUI();
    
    // Clear form
    document.getElementById('customAmount').value = '';
    document.getElementById('supporterName').value = '';
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    state.selectedAmount = 0;
    
    // Show success message
    showAlert(`Thank you ${supporterName}! The bunny hopped forward! 🐰✨`, 'success');
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#a89dd9' : '#b89dd9'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function celebrate() {
    const celebrationContainer = document.getElementById('celebrationContainer');
    const emojis = ['🎉', '🥕', '✨', '💕', '🐰', '⭐', '🌟', '💫'];
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const emoji = document.createElement('span');
        emoji.className = 'confetti-piece';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        
        const x = Math.random() * window.innerWidth;
        const delay = Math.random() * 0.2;
        const duration = 2 + Math.random() * 1;
        
        confetti.style.left = x + 'px';
        confetti.style.top = '0px';
        
        emoji.style.animation = `confettiFall ${duration}s ease-out ${delay}s forwards`;
        
        confetti.appendChild(emoji);
        celebrationContainer.appendChild(confetti);
        
        // Clean up
        setTimeout(() => confetti.remove(), (duration + delay) * 1000);
    }
}

// ===========================
// UI UPDATE FUNCTIONS
// ===========================

function updateUI() {
    updateProgress();
    updateStats();
    updateLeaderboard();
}

function updateProgress() {
    // Calculate progress (every $5 = 1 unit, let's say we need $500 total = 100%)
    const progressPercentage = Math.min((state.totalDonated / 500) * 100, 100);
    
    // Update path fill
    const pathFill = document.getElementById('pathFill');
    pathFill.style.width = progressPercentage + '%';
    
    // Update bunny position
    const bunnyCharacter = document.getElementById('bunnyCharacter');
    bunnyCharacter.style.left = progressPercentage + '%';
    
    // Update percentage text
    document.getElementById('progressPercentage').textContent = Math.round(progressPercentage) + '%';
}

function updateStats() {
    document.getElementById('totalSupporters').textContent = state.totalSupporters;
    document.getElementById('carrotsEarned').textContent = Math.floor(state.totalDonated / 10);
}

function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const emptyLeaderboard = document.getElementById('emptyLeaderboard');
    
    if (state.supporters.length === 0) {
        leaderboardList.style.display = 'none';
        emptyLeaderboard.style.display = 'block';
        return;
    }
    
    leaderboardList.style.display = 'flex';
    emptyLeaderboard.style.display = 'none';
    
    leaderboardList.innerHTML = state.supporters
        .slice(0, 10) // Top 10
        .map((supporter, index) => {
            let rankClass = 'rank-other';
            let rankIcon = `#${index + 1}`;
            
            if (index === 0) {
                rankClass = 'rank-1';
                rankIcon = '🥇';
            } else if (index === 1) {
                rankClass = 'rank-2';
                rankIcon = '🥈';
            } else if (index === 2) {
                rankClass = 'rank-3';
                rankIcon = '🥉';
            }
            
            return `
                <div class="leaderboard-item">
                    <div class="rank-badge ${rankClass}">${rankIcon}</div>
                    <div class="supporter-info">
                        <div class="supporter-name">${escapeHtml(supporter.name)}</div>
                        <div class="supporter-amount">Supported with $${supporter.amount.toFixed(2)}</div>
                    </div>
                </div>
            `;
        })
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// SCROLL FUNCTIONS
// ===========================

function scrollToJourney() {
    const journeySection = document.getElementById('journey-section');
    journeySection.scrollIntoView({ behavior: 'smooth' });
}

// ===========================
// PARTICLES BACKGROUND
// ===========================

function createFloatingStars() {
    const background = document.querySelector('.stars-background');
    
    // This is handled by CSS now, but we can enhance with JavaScript if needed
    // The CSS pseudo-elements create the starfield effect
}

// ===========================
// RESPONSIVE ANIMATIONS
// ===========================

function adjustAnimationsForDevice() {
    // Reduce animations on mobile devices for better performance
    if (window.innerWidth < 768) {
        // Could add mobile-specific animation styles here
    }
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

document.addEventListener('keydown', (e) => {
    // Support button on Enter
    if (e.key === 'Enter' && document.activeElement.id === 'customAmount') {
        processSupport();
    }
});

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Load saved state
    loadState();
    
    // Adjust animations for device
    adjustAnimationsForDevice();
    
    // Add keyboard shortcut hints (optional)
    console.log('🐰 Bunny\'s Journey loaded! Help the bunny reach the carrot village! ✨');
    
    // Add some cute console messages
    console.log('%c🐰 Welcome to Bunny\'s Journey! 🥕', 'font-size: 20px; color: #b89dd9; font-weight: bold;');
    console.log('%cMay your support bring joy and magic to the bunny\'s path! ✨', 'font-size: 14px; color: #9d7eb8;');
});

// ===========================
// WINDOW RESIZE HANDLER
// ===========================

window.addEventListener('resize', () => {
    adjustAnimationsForDevice();
});

// ===========================
// PAGE VISIBILITY HANDLER
// ===========================

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - could pause animations if needed
    } else {
        // Page is visible - resume
    }
});

// ===========================
// ERROR HANDLING
// ===========================

window.addEventListener('error', (e) => {
    console.error('🐰 Oops! An error occurred:', e.error);
});

// ===========================
// SMOOTH ANIMATIONS ON SCROLL
// ===========================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in on scroll
document.querySelectorAll('.leaderboard-item, .fact-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.5s ease-out';
    observer.observe(el);
});

// ===========================
// ACTIVE PRESET BUTTON TRACKING
// ===========================

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ===========================
// CUSTOM AMOUNT INTERACTION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    const customAmountInput = document.getElementById('customAmount');
    
    customAmountInput.addEventListener('focus', () => {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        state.selectedAmount = 0;
    });
});

