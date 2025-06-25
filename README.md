# AI-Powered Journal App

A simple journal app that uses AI to analyze your entries and detect your mood. Deploys directly to GitHub Pages.

## Features

- Write and save journal entries
- AI-generated summaries of each entry
- Mood detection (happy, sad, neutral, anxious, excited)
- Timeline view of all entries
- Data stored in Firebase

## Setup Instructions

1. Fork this repository
2. Go to Settings > Pages and enable GitHub Pages for the main branch
3. Get your Firebase config:
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Create a Firestore database
   - Get your web app configuration
4. Paste your Firebase config in the app when prompted
5. Enter your OpenAI API key

## Sample Entry

**Journal Entry:**
"Today was amazing! I got promoted at work and celebrated with my friends. Best day in a long time."

**AI Analysis:**
- **Summary:** The user had an excellent day getting promoted at work and celebrating with friends.
- **Mood:** Happy

## How It Works

1. User writes a journal entry
2. The app sends the entry to OpenAI for analysis
3. OpenAI returns a summary and mood detection
4. The entry and analysis are saved to Firebase
5. All entries are displayed in a timeline

## Requirements

- Firebase account (free tier)
- OpenAI API key
- Modern web browser

## Security Note

- Your OpenAI API key is stored only in your browser's localStorage
- All data is stored in your own Firebase project
- No server-side code means your keys never leave your browser
- 
