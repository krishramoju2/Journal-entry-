// Firebase configuration
let db;
let isFirebaseInitialized = false;

// DOM elements
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keySavedMessage = document.getElementById('keySavedMessage');
const firebaseConfigTextarea = document.getElementById('firebaseConfig');
const initFirebaseBtn = document.getElementById('initFirebaseBtn');
const journalEntry = document.getElementById('journalEntry');
const submitEntryBtn = document.getElementById('submitEntryBtn');
const formError = document.getElementById('formError');
const loadingIndicator = document.getElementById('loadingIndicator');
const timeline = document.getElementById('timeline');
const noEntriesMessage = document.getElementById('noEntriesMessage');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key from localStorage
  const savedKey = localStorage.getItem('openai_api_key');
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  // Event listeners
  saveKeyBtn.addEventListener('click', saveApiKey);
  initFirebaseBtn.addEventListener('click', initializeFirebase);
  submitEntryBtn.addEventListener('click', submitJournalEntry);

  // Check if we have a saved Firebase config
  const savedFirebaseConfig = localStorage.getItem('firebase_config');
  if (savedFirebaseConfig) {
    firebaseConfigTextarea.value = savedFirebaseConfig;
  }
});

function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return;

  localStorage.setItem('openai_api_key', apiKey);
  keySavedMessage.classList.remove('hidden');
  setTimeout(() => keySavedMessage.classList.add('hidden'), 3000);
}

function initializeFirebase() {
  const configText = firebaseConfigTextarea.value.trim();
  if (!configText) {
    alert('Please enter your Firebase configuration');
    return;
  }

  try {
    const config = JSON.parse(configText.replace(/(\w+)\s*:/g, '"$1":'));
    
    // Initialize Firebase
    const firebaseApp = firebase.initializeApp(config);
    db = firebase.firestore();
    isFirebaseInitialized = true;
    
    // Save config to localStorage
    localStorage.setItem('firebase_config', configText);
    
    alert('Firebase initialized successfully!');
    loadJournalEntries();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    alert('Error initializing Firebase. Please check your configuration.');
  }
}

async function submitJournalEntry() {
  const entryText = journalEntry.value.trim();
  if (!entryText) {
    showError('Please write something in your journal entry');
    return;
  }

  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    showError('Please enter and save your OpenAI API key');
    return;
  }

  if (!isFirebaseInitialized) {
    showError('Please initialize Firebase first');
    return;
  }

  // Show loading state
  submitEntryBtn.disabled = true;
  loadingIndicator.classList.remove('hidden');
  formError.classList.add('hidden');

  try {
    // Get summary and mood from OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze this journal entry. Provide a 1-2 sentence summary and detect the mood (happy, sad, neutral, anxious, excited). Respond in format: SUMMARY: [summary] | MOOD: [mood]"
          },
          {
            role: "user",
            content: entryText
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze journal entry');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Extract summary and mood
    const summary = analysis.split('SUMMARY: ')[1].split(' | MOOD: ')[0];
    const mood = analysis.split(' | MOOD: ')[1];

    // Save to Firebase
    const docRef = await db.collection("journals").add({
      text: entryText,
      summary,
      mood,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Clear form
    journalEntry.value = '';
    
    // Reload entries
    loadJournalEntries();
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  } finally {
    submitEntryBtn.disabled = false;
    loadingIndicator.classList.add('hidden');
  }
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove('hidden');
}

async function loadJournalEntries() {
  if (!isFirebaseInitialized) return;

  try {
    const querySnapshot = await db.collection("journals").orderBy("createdAt", "desc").get();
    
    if (querySnapshot.empty) {
      noEntriesMessage.classList.remove('hidden');
      timeline.innerHTML = '';
      return;
    }

    noEntriesMessage.classList.add('hidden');
    timeline.innerHTML = '';

    querySnapshot.forEach(doc => {
      const entry = doc.data();
      const entryElement = createEntryElement(entry);
      timeline.appendChild(entryElement);
    });
  } catch (error) {
    console.error('Error loading entries:', error);
    showError('Failed to load journal entries');
  }
}

function createEntryElement(entry) {
  const entryElement = document.createElement('div');
  entryElement.className = 'timeline-item';
  
  const date = entry.createdAt ? entry.createdAt.toDate().toLocaleDateString() : 'No date';
  
  entryElement.innerHTML = `
    <div class="timeline-date">${date}</div>
    <div class="timeline-content">
      <div class="mood-badge mood-${entry.mood.toLowerCase()}">${entry.mood}</div>
      <p class="entry-text">${entry.text}</p>
      <p class="entry-summary"><strong>Summary:</strong> ${entry.summary}</p>
    </div>
  `;
  
  return entryElement;
}
