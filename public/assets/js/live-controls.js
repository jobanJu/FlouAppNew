/**
 * LIVE CONTROLS
 * Manages buttons and user interactions
 */

// Initialize controls
document.addEventListener('DOMContentLoaded', () => {
    // Controls are ready to use
});

/**
 * Toggle heart animation
 */
function toggleHeart() {
    const btn = event.target.closest('.btn-icon');
    btn.classList.toggle('active');
    
    // Optional: create floating animation
    createFloatingHeart();
}

/**
 * Create floating heart animation
 */
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-gift';
    heart.textContent = '❤️';
    heart.style.left = Math.random() * window.innerWidth + 'px';
    heart.style.top = (window.innerHeight - 100) + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
}

/**
 * Show gift modal
 */
function showGiftModal() {
    const modal = document.getElementById('giftModal');
    const isHidden = modal.style.display === 'none' || modal.style.display === '';
    modal.style.display = isHidden ? 'block' : 'none';
}

/**
 * Send gift with animation
 */
function sendGift(emoji) {
    const randomX = Math.random() * window.innerWidth;
    const randomY = window.innerHeight - 100;
    
    const gifElement = document.createElement('div');
    gifElement.className = 'floating-gift';
    gifElement.textContent = emoji;
    gifElement.style.left = randomX + 'px';
    gifElement.style.top = randomY + 'px';
    
    document.body.appendChild(gifElement);
    
    addSystemMessage(`Cadeau ${emoji} envoyé`);
    document.getElementById('giftModal').style.display = 'none';
    
    setTimeout(() => gifElement.remove(), 2000);
}

/**
 * Toggle follow button state
 */
function toggleFollow(event) {
    const btn = event.target;
    const isFollowing = btn.textContent === 'Suivi(e)';
    
    if (isFollowing) {
        btn.textContent = 'Suivre';
        btn.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
        btn.style.color = 'white';
        addMessageToChat('Système', 'Vous ne suivez plus ce live');
    } else {
        btn.textContent = 'Suivi(e)';
        btn.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
        btn.style.color = '#1a1a1a';
        addMessageToChat('Système', 'Vous suivez maintenant ce live');
    }
}

/**
 * Share stream
 */
function shareStream() {
    if (navigator.share) {
        navigator.share({
            title: 'Flou Live',
            text: 'Regardez Julia D. en live!',
            url: window.location.href
        }).catch(err => console.log('Share cancelled'));
    } else {
        alert('Lien copié! 📋');
        addMessageToChat('Système', 'Live partagé');
    }
}

/**
 * Close live stream
 */
function closeLive() {
    if (confirm('Êtes-vous sûr(e) de vouloir fermer le live ?')) {
        window.location.href = '/';
    }
}
