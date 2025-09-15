// Globale Variablen
let currentTextSections = [];
let currentSectionIndex = 0;
let selectedWordIndices = new Set(); // Changed from selectedWords to track specific positions
let currentStep = 1;

// Demo-Text
const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos', 'accusamus', 'accusantium',
    'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
    'inventore', 'veritatis', 'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'sunt',
    'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit', 'fugit',
    'sed', 'quia', 'consequuntur', 'magni', 'dolores', 'ratione', 'sequi', 'nesciunt', 'neque',
    'porro', 'quisquam', 'est', 'qui', 'dolorem', 'adipisci', 'numquam', 'eius', 'modi', 'tempora',
    'incidunt', 'ut', 'labore', 'et', 'dolore', 'magnam', 'aliquam', 'quaerat', 'voluptatem'
];

function generateLoremIpsum() {
    const wordCount = Math.floor(Math.random() * 51) + 100; // 100-150 Wörter
    const sentences = [];
    let currentSentence = [];
    
    for (let i = 0; i < wordCount; i++) {
        const randomWord = loremWords[Math.floor(Math.random() * loremWords.length)];
        
        // Ersten Buchstaben großschreiben wenn es der Satzanfang ist
        if (currentSentence.length === 0) {
            currentSentence.push(randomWord.charAt(0).toUpperCase() + randomWord.slice(1));
        } else {
            currentSentence.push(randomWord);
        }
        
        // Zufällig Sätze beenden (alle 8-15 Wörter)
        if (currentSentence.length >= 8 && (Math.random() < 0.3 || currentSentence.length >= 15)) {
            sentences.push(currentSentence.join(' ') + '.');
            currentSentence = [];
        }
    }
    
    // Letzten Satz abschließen falls noch Wörter übrig
    if (currentSentence.length > 0) {
        sentences.push(currentSentence.join(' ') + '.');
    }
    
    return sentences.join(' ');
}

// Utility Funktionen
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function sanitizeText(text) {
    return text.replace(/[<>&"']/g, function(match) {
        const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return escapeMap[match];
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// LocalStorage Funktionen
function saveToLocalStorage() {
    const data = {
        textSections: currentTextSections,
        currentSectionIndex: currentSectionIndex,
        settings: {
            theme: document.body.getAttribute('data-theme') || 'light',
            font: document.body.className.match(/font-\w+/)?.[0] || 'font-inter',
            fontSize: document.getElementById('font-size').value
        }
    };
    localStorage.setItem('wordRevealData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('wordRevealData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            currentTextSections = parsed.textSections || [];
            currentSectionIndex = parsed.currentSectionIndex || 0;
            
            // Einstellungen wiederherstellen
            if (parsed.settings) {
                setTheme(parsed.settings.theme);
                setFont(parsed.settings.font);
                setFontSize(parsed.settings.fontSize);
            }
            
            updateSectionTabs();
            if (currentTextSections.length > 0) {
                loadCurrentSection();
            }
        } catch (e) {
            console.error('Fehler beim Laden der Daten:', e);
        }
    }
}

// Theme Management
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.getElementById('theme-select').value = theme;
    saveToLocalStorage();
}

function setFont(fontClass) {
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    document.body.classList.add(fontClass);
    const fontValue = fontClass.replace('font-', '');
    document.getElementById('font-select').value = fontValue;
    saveToLocalStorage();
}

function setFontSize(size) {
    document.body.style.fontSize = size + 'px';
    document.getElementById('font-size').value = size;
    document.getElementById('font-size-display').textContent = size + 'px';
    saveToLocalStorage();
}

// Navigation zwischen Schritten
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    currentStep = stepNumber;
}

// Text Section Management
function createNewSection() {
    const sectionId = generateId();
    const section = {
        id: sectionId,
        title: `Text ${currentTextSections.length + 1}`,
        originalText: '',
        selectedWordIndices: [], // Changed from selectedWords
        gapText: ''
    };
    
    currentTextSections.push(section);
    currentSectionIndex = currentTextSections.length - 1;
    updateSectionTabs();
    loadCurrentSection();
    showStep(1);
    saveToLocalStorage();
}

function switchToSection(index) {
    if (index >= 0 && index < currentTextSections.length) {
        currentSectionIndex = index;
        loadCurrentSection();
        updateSectionTabs();
        saveToLocalStorage();
    }
}

function deleteSection(index) {
    if (currentTextSections.length <= 1) {
        return; // Don't delete if it's the last section
    }
    
    // Confirm deletion
    const section = currentTextSections[index];
    if (!confirm(`Möchten Sie "${section.title}" wirklich löschen?`)) {
        return;
    }
    
    // Remove the section
    currentTextSections.splice(index, 1);
    
    // Adjust current index if necessary
    if (currentSectionIndex >= index) {
        currentSectionIndex = Math.max(0, currentSectionIndex - 1);
    }
    
    // Ensure currentSectionIndex is within bounds
    if (currentSectionIndex >= currentTextSections.length) {
        currentSectionIndex = currentTextSections.length - 1;
    }
    
    // Update UI and save
    updateSectionTabs();
    loadCurrentSection();
    saveToLocalStorage();
}

function updateSectionTabs() {
    const tabsContainer = document.getElementById('section-tabs');
    tabsContainer.innerHTML = '';
    
    currentTextSections.forEach((section, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab-button';
        tab.setAttribute('data-section', index);
        
        if (index === currentSectionIndex) {
            tab.classList.add('active');
        }
        
        // Create tab content with text and optional delete button
        if (currentTextSections.length > 1) {
            tab.innerHTML = `
                <span class="tab-text">${section.title}</span>
                <span class="tab-delete" data-index="${index}">×</span>
            `;
            
            // Add event listeners
            tab.querySelector('.tab-text').addEventListener('click', (e) => {
                e.stopPropagation();
                switchToSection(index);
            });
            
            tab.querySelector('.tab-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSection(index);
            });
            
            tab.addEventListener('click', () => switchToSection(index));
        } else {
            tab.textContent = section.title;
            tab.addEventListener('click', () => switchToSection(index));
        }
        
        tabsContainer.appendChild(tab);
    });
}

function loadCurrentSection() {
    if (currentTextSections[currentSectionIndex]) {
        const section = currentTextSections[currentSectionIndex];
        document.getElementById('text-input').value = section.originalText;
        selectedWordIndices = new Set(section.selectedWordIndices || []);
        
        if (section.originalText) {
            updateNextButton();
            if (selectedWordIndices.size > 0) {
                generateWordSelection();
                updateSelectedWordsList();
                updateGenerateButton();
            }
        }
    }
}

// Text Processing
function tokenizeText(text) {
    return text.split(/(\s+|[.!?;,])/);
}

function isWord(token) {
    return /^[a-zA-ZäöüÄÖÜß]+$/.test(token);
}

function generateWordSelection() {
    const text = document.getElementById('text-input').value;
    const preview = document.getElementById('text-preview');
    
    if (!text.trim()) {
        preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Bitte geben Sie zuerst einen Text ein.</p>';
        return;
    }
    
    const tokens = tokenizeText(text);
    preview.innerHTML = '';
    
    tokens.forEach((token, index) => {
        if (isWord(token)) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = token;
            span.setAttribute('data-word', token.toLowerCase());
            span.setAttribute('data-index', index);
            
            if (selectedWordIndices.has(index)) {
                span.classList.add('selected');
            }
            
            span.addEventListener('click', () => toggleWordSelection(span, index, token));
            preview.appendChild(span);
        } else {
            const textNode = document.createTextNode(token);
            preview.appendChild(textNode);
        }
    });
}

function toggleWordSelection(element, index, word) {
    if (selectedWordIndices.has(index)) {
        selectedWordIndices.delete(index);
        element.classList.remove('selected');
    } else {
        selectedWordIndices.add(index);
        element.classList.add('selected');
    }
    
    updateSelectedWordsList();
    updateGenerateButton();
    saveCurrentSection();
}

function updateSelectedWordsList() {
    const list = document.getElementById('selected-words-list');
    list.innerHTML = '';
    
    if (selectedWordIndices.size === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Keine Wörter ausgewählt</p>';
        return;
    }
    
    // Get the text and tokens to show which words were selected
    const text = document.getElementById('text-input').value;
    const tokens = tokenizeText(text);
    
    // Create a list of selected words with their positions
    const selectedWords = Array.from(selectedWordIndices)
        .sort((a, b) => a - b) // Sort by position
        .map(index => tokens[index])
        .filter(token => isWord(token));
    
    selectedWords.forEach((word, displayIndex) => {
        const tag = document.createElement('div');
        tag.className = 'selected-word-tag';
        
        const wordSpan = document.createElement('span');
        wordSpan.textContent = word;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-word';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Wort entfernen';
        removeBtn.addEventListener('click', () => {
            // Find the index in the selectedWordIndices that corresponds to this word
            const sortedIndices = Array.from(selectedWordIndices).sort((a, b) => a - b);
            const indexToRemove = sortedIndices[displayIndex];
            selectedWordIndices.delete(indexToRemove);
            updateSelectedWordsList();
            updateWordPreviewSelection();
            updateGenerateButton();
            saveCurrentSection();
        });
        
        tag.appendChild(wordSpan);
        tag.appendChild(removeBtn);
        list.appendChild(tag);
    });
}

function updateWordPreviewSelection() {
    document.querySelectorAll('.word').forEach(wordElement => {
        const index = parseInt(wordElement.getAttribute('data-index'));
        if (selectedWordIndices.has(index)) {
            wordElement.classList.add('selected');
        } else {
            wordElement.classList.remove('selected');
        }
    });
}

// Einstellungen zwischen Seiten synchronisieren
function syncSettingsToStep2() {
    document.getElementById('theme-select-step2').value = document.getElementById('theme-select').value;
    document.getElementById('font-select-step2').value = document.getElementById('font-select').value;
    document.getElementById('font-size-step2').value = document.getElementById('font-size').value;
    document.getElementById('font-size-display-step2').textContent = document.getElementById('font-size').value + 'px';
}

// Präsentationsmodus
function enterPresentationMode() {
    document.body.classList.add('presentation-mode');
    updatePresentationNavigation();
    showStep(3);
}

function exitPresentationMode() {
    document.body.classList.remove('presentation-mode');
    showStep(2);
}

// Navigation zwischen Texten in der Präsentation
function navigatePresentationText(direction) {
    const newIndex = currentSectionIndex + direction;
    if (newIndex >= 0 && newIndex < currentTextSections.length) {
        currentSectionIndex = newIndex;
        loadCurrentSection();
        generatePresentationText();
        updatePresentationNavigation();
        saveToLocalStorage();
    }
}

function updatePresentationNavigation() {
    const navElement = document.getElementById('presentation-nav');
    const prevBtn = document.getElementById('prev-text');
    const nextBtn = document.getElementById('next-text');
    const indicator = document.getElementById('text-indicator');
    
    // Navigation nur anzeigen wenn mehr als ein Text vorhanden
    if (currentTextSections.length <= 1) {
        navElement.style.display = 'none';
        return;
    } else {
        navElement.style.display = 'flex';
    }
    
    // Buttons aktivieren/deaktivieren
    prevBtn.disabled = currentSectionIndex <= 0;
    nextBtn.disabled = currentSectionIndex >= currentTextSections.length - 1;
    
    // Anzeige aktualisieren
    const currentSection = currentTextSections[currentSectionIndex];
    indicator.textContent = currentSection ? currentSection.title : `Text ${currentSectionIndex + 1}`;
}

// Präsentations-Text generieren
function generatePresentationText() {
    const text = document.getElementById('text-input').value;
    const display = document.getElementById('gap-text-display');
    const wordsList = document.getElementById('hidden-words-list');
    
    if (!text.trim()) {
        display.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Bitte geben Sie zuerst einen Text ein.</p>';
        return;
    }
    
    // Wenn keine Wörter ausgewählt wurden, zeige den Text normal an
    if (selectedWordIndices.size === 0) {
        display.innerHTML = sanitizeText(text);
        wordsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; font-style: italic;">Keine Wörter versteckt</p>';
        saveCurrentSection();
        return;
    }
    
    // Text mit Lücken erstellen
    const tokens = tokenizeText(text);
    display.innerHTML = '';
    
    // Versteckte Wörter sammeln
    const hiddenWordsList = [];
    
    tokens.forEach((token, index) => {
        if (isWord(token) && selectedWordIndices.has(index)) {
            const span = document.createElement('span');
            span.className = 'gap-word hidden';
            span.textContent = token;
            span.setAttribute('data-word', token);
            span.setAttribute('data-index', index);
            span.setAttribute('data-revealed', 'false');
            
            span.addEventListener('click', () => revealPresentationWord(span));
            display.appendChild(span);
            
            // Wort zur Sammlung hinzufügen
            hiddenWordsList.push(token);
        } else {
            const textNode = document.createTextNode(token);
            display.appendChild(textNode);
        }
    });
    
    // Versteckte Wörter anzeigen
    wordsList.innerHTML = '';
    hiddenWordsList.forEach((word, displayIndex) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'collected-word';
        wordElement.textContent = word;
        wordElement.setAttribute('data-word', word);
        wordElement.setAttribute('data-display-index', displayIndex);
        wordsList.appendChild(wordElement);
    });
    
    saveCurrentSection();
}

function revealPresentationWord(element) {
    if (element.getAttribute('data-revealed') === 'false') {
        element.classList.remove('hidden');
        element.classList.add('revealed');
        element.setAttribute('data-revealed', 'true');
        
        // Entsprechendes Wort in der Sammlung als verwendet markieren
        const word = element.getAttribute('data-word');
        const index = element.getAttribute('data-index');
        
        // Find the corresponding word in the collection by matching both word and position
        const collectedWords = document.querySelectorAll('.collected-word');
        const hiddenWordsArray = Array.from(selectedWordIndices).sort((a, b) => a - b);
        const tokenIndex = parseInt(index);
        const displayIndex = hiddenWordsArray.indexOf(tokenIndex);
        
        if (displayIndex >= 0 && collectedWords[displayIndex]) {
            collectedWords[displayIndex].classList.add('used');
        }
    }
}

// Button State Management
function updateNextButton() {
    const btn = document.getElementById('next-to-selection');
    const text = document.getElementById('text-input').value.trim();
    btn.disabled = !text;
}

function updateGenerateButton() {
    const btn = document.getElementById('generate-gap-text');
    const text = document.getElementById('text-input').value.trim();
    btn.disabled = !text;
}

// Section Data Management
function saveCurrentSection() {
    if (currentTextSections[currentSectionIndex]) {
        const section = currentTextSections[currentSectionIndex];
        section.originalText = document.getElementById('text-input').value;
        section.selectedWordIndices = Array.from(selectedWordIndices);
        saveToLocalStorage();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme Switcher (beide Instanzen)
    document.getElementById('theme-select').addEventListener('change', (e) => {
        setTheme(e.target.value);
        document.getElementById('theme-select-step2').value = e.target.value;
    });
    
    document.getElementById('theme-select-step2').addEventListener('change', (e) => {
        setTheme(e.target.value);
        document.getElementById('theme-select').value = e.target.value;
    });
    
    // Font Switcher (beide Instanzen)
    document.getElementById('font-select').addEventListener('change', (e) => {
        setFont('font-' + e.target.value);
        document.getElementById('font-select-step2').value = e.target.value;
    });
    
    document.getElementById('font-select-step2').addEventListener('change', (e) => {
        setFont('font-' + e.target.value);
        document.getElementById('font-select').value = e.target.value;
    });
    
    // Font Size (beide Instanzen)
    document.getElementById('font-size').addEventListener('input', (e) => {
        setFontSize(e.target.value);
        document.getElementById('font-size-step2').value = e.target.value;
        document.getElementById('font-size-display-step2').textContent = e.target.value + 'px';
    });
    
    document.getElementById('font-size-step2').addEventListener('input', (e) => {
        setFontSize(e.target.value);
        document.getElementById('font-size').value = e.target.value;
        document.getElementById('font-size-display').textContent = e.target.value + 'px';
    });
    
    // Text Input
    document.getElementById('text-input').addEventListener('input', debounce(() => {
        updateNextButton();
        saveCurrentSection();
    }, 300));
    
    // Navigation Buttons
    document.getElementById('next-to-selection').addEventListener('click', () => {
        if (document.getElementById('text-input').value.trim()) {
            generateWordSelection();
            syncSettingsToStep2();
            showStep(2);
        }
    });
    
    document.getElementById('back-to-input').addEventListener('click', () => {
        showStep(1);
    });
    
    document.getElementById('generate-gap-text').addEventListener('click', () => {
        generatePresentationText();
        enterPresentationMode();
    });
    
    document.getElementById('back-to-selection-hidden').addEventListener('click', () => {
        exitPresentationMode();
    });
    
    // Text-Navigation in Präsentation
    document.getElementById('prev-text').addEventListener('click', () => {
        navigatePresentationText(-1);
    });
    
    document.getElementById('next-text').addEventListener('click', () => {
        navigatePresentationText(1);
    });
    
    // Demo Text Loader
    document.getElementById('load-demo').addEventListener('click', () => {
        document.getElementById('text-input').value = generateLoremIpsum();
        updateNextButton();
        saveCurrentSection();
    });
    
    // Section Management
    document.getElementById('add-section-btn').addEventListener('click', createNewSection);
}

// Initialization
function init() {
    setupEventListeners();
    loadFromLocalStorage();
    
    // Erstelle erste Sektion falls keine vorhanden
    if (currentTextSections.length === 0) {
        createNewSection();
    }
    
    // Initialisiere UI
    updateNextButton();
    updateGenerateButton();
    syncSettingsToStep2();
    showStep(1);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                if (!document.body.classList.contains('presentation-mode')) {
                    showStep(1);
                }
                break;
            case '2':
                e.preventDefault();
                if (!document.body.classList.contains('presentation-mode') && document.getElementById('text-input').value.trim()) {
                    generateWordSelection();
                    syncSettingsToStep2();
                    showStep(2);
                }
                break;
            case '3':
                e.preventDefault();
                if (!document.body.classList.contains('presentation-mode') && document.getElementById('text-input').value.trim()) {
                    generatePresentationText();
                    enterPresentationMode();
                }
                break;
            case 'n':
                e.preventDefault();
                if (!document.body.classList.contains('presentation-mode')) {
                    createNewSection();
                }
                break;
        }
    }
    
    // Navigation in Präsentation mit Pfeiltasten
    if (document.body.classList.contains('presentation-mode')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigatePresentationText(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigatePresentationText(1);
        }
    }
    
    // ESC zum Zurückgehen
    if (e.key === 'Escape') {
        if (document.body.classList.contains('presentation-mode')) {
            exitPresentationMode();
        } else if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }
});

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Prevent data loss on page unload
window.addEventListener('beforeunload', saveToLocalStorage);