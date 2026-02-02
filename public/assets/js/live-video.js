/**
 * LIVE VIDEO SYSTEM
 * Manages video participants and video requests
 */

let participants = [];
const MAX_PARTICIPANTS = 3;
let pendingRequest = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateViewerCount();
    setInterval(updateViewerCount, 5000);
    setupVideoRequestButton();
    setupModalOverlay();
});

/**
 * Update viewer count every 5 seconds
 */
function updateViewerCount() {
    const count = Math.floor(Math.random() * 450) + 50; // 50-500
    document.getElementById('viewerCount').textContent = count;
}

/**
 * Setup video request button
 */
function setupVideoRequestButton() {
    const btn = document.getElementById('requestCameraBtn');
    btn.addEventListener('click', requestVideoAccess);
}

/**
 * Request video access from someone
 */
function requestVideoAccess() {
    if (participants.length >= MAX_PARTICIPANTS) {
        alert(`Limite de ${MAX_PARTICIPANTS} participants atteinte`);
        return;
    }

    const requesters = ['Alice M.', 'Marc P.', 'Sophie D.', 'Luc B.', 'Emma R.', 'Thomas C.'];
    const requester = requesters[Math.floor(Math.random() * requesters.length)];
    
    showVideoRequestModal(requester);
}

/**
 * Show video request modal
 */
function showVideoRequestModal(username) {
    pendingRequest = {
        username: username,
        id: Date.now()
    };
    
    document.getElementById('requestUsername').textContent = '@' + username;
    document.getElementById('videoRequestModal').classList.add('show');
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('requestCameraBtn').classList.add('pending');
}

/**
 * Accept video request
 */
function acceptVideoRequest() {
    if (pendingRequest && participants.length < MAX_PARTICIPANTS) {
        addParticipant(pendingRequest.username);
        closeVideoRequestModal();
    }
}

/**
 * Decline video request
 */
function declineVideoRequest() {
    closeVideoRequestModal();
}

/**
 * Close video request modal
 */
function closeVideoRequestModal() {
    document.getElementById('videoRequestModal').classList.remove('show');
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('requestCameraBtn').classList.remove('pending');
    pendingRequest = null;
}

/**
 * Add participant to grid
 */
function addParticipant(username) {
    if (participants.length >= MAX_PARTICIPANTS) {
        alert('Limite de participants atteinte');
        return;
    }

    const participant = {
        id: Date.now(),
        username: username,
        avatar: username.substring(0, 1).toUpperCase()
    };

    participants.push(participant);
    updateVideoGrid();
    addSystemMessage(`${username} a rejoint la vidéo`);
}

/**
 * Remove participant from grid
 */
function removeParticipant(id) {
    const participant = participants.find(p => p.id === id);
    participants = participants.filter(p => p.id !== id);
    updateVideoGrid();
    
    if (participant) {
        addSystemMessage(`${participant.username} a quitté la vidéo`);
    }

    // Re-enable button if under limit
    if (participants.length < MAX_PARTICIPANTS) {
        document.getElementById('requestCameraBtn').classList.remove('disabled');
        document.getElementById('requestCameraBtn').disabled = false;
    }
}

/**
 * Update video grid display
 */
function updateVideoGrid() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';

    participants.forEach(participant => {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'video-participant';
        videoDiv.innerHTML = `
            <div class="video-participant-video"></div>
            <div class="video-participant-label">${participant.username}</div>
            <button class="remove-participant" onclick="removeParticipant(${participant.id})">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
        grid.appendChild(videoDiv);
    });

    // Disable button if at max capacity
    const btn = document.getElementById('requestCameraBtn');
    if (participants.length >= MAX_PARTICIPANTS) {
        btn.classList.add('disabled');
        btn.disabled = true;
    }
}

/**
 * Setup modal overlay click handling
 */
function setupModalOverlay() {
    document.getElementById('modalOverlay').addEventListener('click', () => {
        if (document.getElementById('videoRequestModal').classList.contains('show')) {
            declineVideoRequest();
        }
    });
}
