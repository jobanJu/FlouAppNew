/**
 * CHAT SYSTEM
 * Manages real-time chat functionality
 */

const CHAT_MAX_LENGTH = 200;

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', () => {
    setupChatHandlers();
});

/**
 * Setup chat event handlers
 */
function setupChatHandlers() {
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

/**
 * Send message to chat
 */
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addMessageToChat('Vous', message, '#8B5CF6');
        input.value = '';
        input.focus();
    }
}

/**
 * Add message to chat display
 */
function addMessageToChat(username, message, userColor = '#8B5CF6') {
    const chatMessages = document.getElementById('chatMessages');
    const msgElement = document.createElement('div');
    msgElement.className = 'chat-message';
    
    const avatar = username.substring(0, 1).toUpperCase();
    
    msgElement.innerHTML = `
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-content">
            <div class="chat-username">${username}</div>
            <div class="chat-text">${escapeHtml(message)}</div>
        </div>
    `;
    
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Add system message (non-user message)
 */
function addSystemMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const msgElement = document.createElement('div');
    msgElement.className = 'chat-message';
    
    msgElement.innerHTML = `
        <div class="chat-avatar" style="background: #9ca3af;">S</div>
        <div class="chat-content">
            <div class="chat-username">Système</div>
            <div class="chat-text" style="font-style: italic; color: #666;">${escapeHtml(message)}</div>
        </div>
    `;
    
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Toggle chat panel visibility
 */
function toggleChat() {
    const panel = document.getElementById('chatPanel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        document.getElementById('chatInput').focus();
    } else {
        panel.style.display = 'none';
    }
}
