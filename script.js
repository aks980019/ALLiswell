// =========================================
// GLOBAL VARIABLES AND AUTHENTICATION
// =========================================

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let clipboardHistory = JSON.parse(localStorage.getItem('clipboardHistory')) || [];
let timerInterval = null;
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let currentTime = pomodoroTime;
let isTimerRunning = false;
let stopwatchInterval = null;
let stopwatchTime = 0;
let isStopwatchRunning = false;
let lapCounter = 0;
let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let currentRotation = 0;

// =========================================
// AUTHENTICATION AND SESSION MANAGEMENT
// =========================================

function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');

    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }

    if (loginTime) {
        const sessionTime = new Date(loginTime);
        const currentTime = new Date();
        const hoursDiff = (currentTime - sessionTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            logout();
            return false;
        }
    }

    return true;
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// =========================================
// APPLICATION INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuthentication()) {
        initializeApp();
        addLogoutButton();
        initializeNewComponents();
    }
});

function initializeApp() {
    setupNavigation();
    loadTodos();
    loadClipboardHistory();
    loadNotes();
    setupEventListeners();
    setupSearch();
    updateColorPicker();
    setupUnitConverter();
    updateTimerDisplay();
    renderEvents();
}

function addLogoutButton() {
    const username = localStorage.getItem('username');
    const usernameDisplay = document.querySelector('.username-display');

    if (usernameDisplay) {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }
}

function initializeNewComponents() {
    renderEvents();
}

function setupSearch() {
    // Empty implementation for search functionality
}

// =========================================
// NAVIGATION AND UI MANAGEMENT
// =========================================

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const hamburger = document.getElementById('hamburger');

    mobileNav.classList.toggle('active');
    hamburger.classList.toggle('active');

    if (mobileNav.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.category-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.category && btn.dataset.category !== 'home') {
                showCategory(btn.dataset.category);
            }
        });
    });
}

function showCategory(category) {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.category-section');
    const homeOverview = document.querySelector('.home-overview');

    const categoryMap = {
        'productivity': 'productivity',
        'documents': 'documents',
        'images': 'images',
        'web-code': 'web-code',
        'business': 'business',
        'security': 'security',
        'system': 'system'
    };

    const sectionId = categoryMap[category] || category;

    navButtons.forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`[data-category="${category}"]`) || 
                     document.querySelector(`[data-category="${sectionId}"]`);
    if (targetBtn) targetBtn.classList.add('active');

    if (homeOverview) homeOverview.style.display = 'none';

    sections.forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');

    updateNavigation(category);
}

function showHome() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.category-section');
    const homeOverview = document.querySelector('.home-overview');

    navButtons.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));

    if (homeOverview) {
        homeOverview.style.display = 'block';
    }

    updateNavigation('home');
}

function updateNavigation(activeCategory) {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');

        if ((activeCategory === 'home' && link.textContent.trim() === 'Home') ||
            link.textContent.toLowerCase().includes(activeCategory.replace('-', ' '))) {
            link.classList.add('active');
        }
    });
}

// Quick Action Functions 


function setupEventListeners() {
    const todoInput = document.getElementById('todo-input');
    if (todoInput) {
        todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTodo();
        });
    }

    const notesArea = document.getElementById('notes-area');
    if (notesArea) {
        notesArea.addEventListener('input', function() {
            localStorage.setItem('quickNotes', this.value);
        });
    }

    const counterInput = document.getElementById('counter-input');
    if (counterInput) {
        counterInput.addEventListener('input', updateTextCounter);
    }

    const markdownInput = document.getElementById('markdown-input');
    if (markdownInput) {
        markdownInput.addEventListener('input', updateMarkdownPreview);
    }

    const colorInput = document.getElementById('color-input');
    if (colorInput) {
        colorInput.addEventListener('input', updateColorPicker);
    }

    const unitType = document.getElementById('unit-type');
    if (unitType) {
        unitType.addEventListener('change', setupUnitConverter);
    }

    const imageInput = document.getElementById('image-input');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    const faviconInput = document.getElementById('favicon-input');
    if (faviconInput) {
        faviconInput.addEventListener('change', handleFaviconUpload);
    }

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                searchWithAI();
            }
        });
    }

    const slider = document.getElementById('quality-slider');
    if (slider) {
        slider.addEventListener('input', function() {
            const qualityValue = document.getElementById('quality-value');
            if (qualityValue) {
                qualityValue.textContent = Math.round(this.value * 100) + '%';
            }
        });
    }
}

// =========================================
// PRODUCTIVITY TOOLS
// =========================================

// TO-DO LIST FUNCTIONALITY
function addTodo() {
    const input = document.getElementById('todo-input');
    if (!input) return;

    const text = input.value.trim();

    if (text) {
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        todos.unshift(todo);
        saveTodos();
        renderTodos();
        input.value = '';
    }
}

function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = todos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <span onclick="toggleTodo(${todo.id})">${todo.text}</span>
            <div class="todo-actions">
                <button onclick="toggleTodo(${todo.id})" class="small">
                    ${todo.completed ? '↶' : '✓'}
                </button>
                <button onclick="deleteTodo(${todo.id})" class="small">×</button>
            </div>
        </li>
    `).join('');
}

function loadTodos() {
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// POMODORO TIMER FUNCTIONALITY
function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            currentTime--;
            updateTimerDisplay();

            if (currentTime <= 0) {
                pauseTimer();
                alert('Pomodoro session completed!');
                resetTimer();
            }
        }, 1000);
    }
}

function pauseTimer() {
    isTimerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    currentTime = pomodoroTime;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// NOTES FUNCTIONALITY
function saveNotes() {
    const notesArea = document.getElementById('notes-area');
    if (notesArea) {
        const notes = notesArea.value;
        localStorage.setItem('quickNotes', notes);
        alert('Notes saved!');
    }
}

function exportNotes() {
    const notesArea = document.getElementById('notes-area');
    if (notesArea) {
        const notes = notesArea.value;
        const blob = new Blob([notes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function clearNotes() {
    if (confirm('Are you sure you want to clear all notes?')) {
        const notesArea = document.getElementById('notes-area');
        if (notesArea) {
            notesArea.value = '';
            localStorage.removeItem('quickNotes');
        }
    }
}

function loadNotes() {
    const notes = localStorage.getItem('quickNotes');
    const notesArea = document.getElementById('notes-area');
    if (notes && notesArea) {
        notesArea.value = notes;
    }
}

// CLIPBOARD MANAGER FUNCTIONALITY - DISABLED
function saveToClipboard() {
    alert('Clipboard manager is disabled');
}

function renderClipboardHistory() {
    const historyDiv = document.getElementById('clipboard-history');
    if (historyDiv) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Clipboard manager is disabled</p>';
    }
}

function copyToClipboard(text) {
    alert('Clipboard manager is disabled');
}

function deleteClipboardItem(id) {
    alert('Clipboard manager');
}

function loadClipboardHistory() {
    renderClipboardHistory();
}

// CALENDAR WIDGET FUNCTIONALITY
function addEvent() {
    const titleInput = document.getElementById('event-title');
    const datetimeInput = document.getElementById('event-datetime');

    if (!titleInput || !datetimeInput) return;

    const title = titleInput.value;
    const datetime = datetimeInput.value;

    if (title && datetime) {
        const event = {
            id: Date.now(),
            title: title,
            datetime: datetime
        };

        events.push(event);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        renderEvents();

        titleInput.value = '';
        datetimeInput.value = '';
    }
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (list) {
        list.innerHTML = events.map(event => `
            <div class="event-item">
                <strong>${event.title}</strong>
                <span>${new Date(event.datetime).toLocaleString()}</span>
                <button onclick="deleteEvent(${event.id})" class="small">×</button>
            </div>
        `).join('');
    }
}

function deleteEvent(id) {
    events = events.filter(event => event.id !== id);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderEvents();
}

// =========================================
// DOCUMENT TOOLS
// =========================================

// TEXT FORMATTER
function formatText(type) {
    const input = document.getElementById('text-input');
    const output = document.getElementById('text-output');
    if (!input || !output) return;

    const text = input.value;

    let formatted = '';
    switch (type) {
        case 'uppercase':
            formatted = text.toUpperCase();
            break;
        case 'lowercase':
            formatted = text.toLowerCase();
            break;
        case 'title':
            formatted = text.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            break;
        case 'sentence':
            formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            break;
    }

    output.textContent = formatted;
}

// WORD COUNCOUNTER
function updateTextCounter() {
    const textInput = document.getElementById('counter-input');
    if (!textInput) return;

    const text = textInput.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;

    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const lineCount = document.getElementById('line-count');

    if (charCount) charCount.textContent = chars;
    if (wordCount) wordCount.textContent = words;
    if (lineCount) lineCount.textContent = lines;
}

// MARKDOWN PREVIEWER
function updateMarkdownPreview() {
    const input = document.getElementById('markdown-input');
    const output = document.getElementById('markdown-output');

    if (input && output) {
        const text = input.value;
        // Simple markdown conversion (basic implementation)
        let html = text
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>');

        output.innerHTML = html;
    }
}

// PDF TOOLS (Mock implementations)
function mergePDFs() {
    alert('PDF merge functionality would require a backend service. This is a frontend-only demo.');
}

function splitPDF() {
    alert('PDF split functionality would require a backend service. This is a frontend-only demo.');
}

function compressPDF() {
    alert('PDF compression would require a backend service. This is a frontend-only demo.');
}

// =========================================
// IMAGE TOOLS
// =========================================

// IMAGE RESIZER
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const widthInput = document.getElementById('width-input');
                const heightInput = document.getElementById('height-input');
                const preview = document.getElementById('image-preview');

                if (widthInput) widthInput.value = img.width;
                if (heightInput) heightInput.value = img.height;
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function resizeImage() {
    const fileInput = document.getElementById('image-input');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');

    if (!fileInput || !widthInput || !heightInput) return;

    const file = fileInput.files[0];
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    if (file && width && height) {
        const canvas = document.getElementById('image-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resized_${file.name}`;
                a.click();
                URL.revokeObjectURL(url);
            });
        };

        const reader = new FileReader();
        reader.onload = e => img.src = e.target.result;
        reader.readAsDataURL(file);
    }
}

// FAVICON GENERATOR


// IMAGE COMPRESSOR
// FORMAT CONVERTER

// CROP & ROTATE


// =========================================
// WEB & CODE TOOLS
// =========================================
// JSON FORMATTER
// QR CODE GENERATOR
function generateQR() {
    const textInput = document.getElementById('qr-input');
    const output = document.getElementById('qr-output');

    if (!textInput || !output) return;

    const text = textInput.value;

    if (text) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
        output.innerHTML = `
            <img src="${qrUrl}" alt="QR Code" style="max-width: 200px;">
            <p>QR Code for: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}</p>
        `;
    }
}

// BASE64 ENCODER/DECODER
// COLOR PICKER
function updateColorPicker() {
    const colorInput = document.getElementById('color-input');
    if (!colorInput) return;

    const color = colorInput.value;

    // Convert hex to RGB
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);

    // Convert RGB to HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h, s;
    if (diff === 0) {
        h = s = 0;
    } else {
        s = l > 0.5 ? diff / (2 - sum) : diff / sum;
        switch (max) {
            case r / 255: h = ((g - b) / 255) / diff + (g < b ? 6 : 0); break;
            case g / 255: h = ((b - r) / 255) / diff + 2; break;
            case b / 255: h = ((r - g) / 255) / diff + 4; break;
        }
        h /= 6;
    }

    const hexValue = document.getElementById('hex-value');
    const rgbValue = document.getElementById('rgb-value');
    const hslValue = document.getElementById('hsl-value');

    if (hexValue) hexValue.textContent = color.toUpperCase();
    if (rgbValue) rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
    if (hslValue) hslValue.textContent = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    // Generate palette
    generateColorPalette(color);
}

function generateColorPalette(baseColor) {
    const palette = document.getElementById('color-palette');
    if (!palette) return;

    const colors = [];

    // Generate variations
    for (let i = 0; i < 5; i++) {
        const factor = 0.2 + (i * 0.2);
        const r = Math.round(parseInt(baseColor.substr(1, 2), 16) * factor);
        const g = Math.round(parseInt(baseColor.substr(3, 2), 16) * factor);
        const b = Math.round(parseInt(baseColor.substr(5, 2), 16) * factor);
        colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    }

    palette.innerHTML = colors.map(color => 
        `<div class="color-swatch" style="background-color: ${color}" onclick="document.getElementById('color-input').value='${color}'; updateColorPicker()"></div>`
    ).join('');
}

// LOREM IPSUM GENERATOR
function generateLorem() {
    const countInput = document.getElementById('lorem-count');
    const typeSelect = document.getElementById('lorem-type');
    const output = document.getElementById('lorem-output');

    if (!countInput || !typeSelect || !output) return;

    const count = parseInt(countInput.value);
    const type = typeSelect.value;

    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    let result = '';

    switch (type) {
        case 'paragraphs':
            for (let i = 0; i < count; i++) {
                result += loremText + '\n\n';
            }
            break;
        case 'sentences':
            const sentences = loremText.split('. ');
            for (let i = 0; i < count; i++) {
                result += sentences[i % sentences.length] + '. ';
            }
            break;
        case 'words':
            const words = loremText.split(' ');
            for (let i = 0; i < count; i++) {
                result += words[i % words.length] + ' ';
            }
            break;
    }

    output.textContent = result.trim();
}

// CODE MINIFIER
// REGEX TESTER
// URL ENCODER
// =========================================
// BUSINESS TOOLS
// =========================================

// CURRENCY CONVERTER
function convertCurrency() {
    const amountInput = document.getElementById('currency-amount');
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const result = document.getElementById('currency-result');

    if (!amountInput || !fromSelect || !toSelect || !result) return;

    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;

    if (isNaN(amount)) {
        result.textContent = 'Please enter a valid amount';
        return;
    }

    // Mock exchange rates (in a real app, you'd use an API)
    const rates = {
        'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110 },
        'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129 },
        'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 151 },
        'JPY': { 'USD': 0.009, 'EUR': 0.008, 'GBP': 0.007 }
    };

    let convertedAmount;
    if (fromCurrency === toCurrency) {
        convertedAmount = amount;
    } else {
        const rate = rates[fromCurrency]?.[toCurrency] || 1;
        convertedAmount = amount * rate;
    }

    result.textContent = `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`;
}

// UNIT CONVERTER
// INVOICE GENERATOR
// EMAIL TEMPLATES
// MEETING NOTES
// =========================================
// SECURITY TOOLS
// =========================================

// PASSWORD GENERATOR
function generatePassword() {
    const lengthInput = document.getElementById('password-length');
    const includeUpper = document.getElementById('include-uppercase');
    const includeLower = document.getElementById('include-lowercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');

    if (!lengthInput || !includeUpper || !includeLower || !includeNumbers || !includeSymbols) return;

    const length = parseInt(lengthInput.value);

    let chars = '';
    if (includeUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers.checked) chars += '0123456789';
    if (includeSymbols.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
        alert('Please select at least one character type');
        return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let strength = 0;
    let strengthText = '';
    let strengthColor = '';

    if (length >= 8) strength += 25;
    if (length >= 12) strength += 25;
    if (includeUpper.checked && includeLower.checked) strength += 20;
    if (includeNumbers.checked) strength += 15;
    if (includeSymbols.checked) strength += 15;

    if (strength >= 80) {
        strengthText = 'Very Strong';
        strengthColor = '#48bb78';
    } else if (strength >= 60) {
        strengthText = 'Strong';
        strengthColor = '#68d391';
    } else if (strength >= 40) {
        strengthText = 'Medium';
        strengthColor = '#f6e05e';
    } else {
        strengthText = 'Weak';
        strengthColor = '#fc8181';
    }

    const output = document.getElementById('password-output');
    if (output) {
        output.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-family: monospace; font-size: 1.1em; font-weight: bold; flex: 1; word-break: break-all;">${password}</span>
                <button onclick="navigator.clipboard.writeText('${password}').then(() => showToast('Password copied!'))" 
                        style="padding: 8px 12px; font-size: 12px; min-width: 60px;">Copy</button>
            </div>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-size: 0.9em;">Strength:</span>
                    <span style="color: ${strengthColor}; font-weight: bold; font-size: 0.9em;">${strengthText}</span>
                </div>
                <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${strengthColor}; height: 100%; width: ${strength}%; transition: all 0.3s ease;"></div>
                </div>
            </div>
        `;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #48bb78; color: white; padding: 12px 20px;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px; font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// SECURE NOTEPAD


// =========================================
// SYSTEM TOOLS
// =========================================

// TIMEZONE CONVERTER

// STOPWATCH
function startStopwatch() {
    if (!isStopwatchRunning) {
        isStopwatchRunning = true;
        stopwatchInterval = setInterval(() => {
            stopwatchTime++;
            updateStopwatchDisplay();
        }, 1000);
    }
}

function pauseStopwatch() {
    isStopwatchRunning = false;
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchTime = 0;
    lapCounter = 0;
    updateStopwatchDisplay();
    const lapTimes = document.getElementById('lap-times');
    if (lapTimes) {
        lapTimes.innerHTML = '';
    }
}

function lapStopwatch() {
    if (isStopwatchRunning) {
        lapCounter++;
        const lapTime = formatTime(stopwatchTime);
        const lapTimes = document.getElementById('lap-times');
        if (lapTimes) {
            const lapDiv = document.createElement('div');
            lapDiv.className = 'lap-time';
            lapDiv.innerHTML = `<span>Lap ${lapCounter}</span><span>${lapTime}</span>`;
            lapTimes.appendChild(lapDiv);
        }
    }
}

function updateStopwatchDisplay() {
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    if (stopwatchDisplay) {
        stopwatchDisplay.textContent = formatTime(stopwatchTime);
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// AI SEARCH ASSISTANT
// WEATHER WIDGET