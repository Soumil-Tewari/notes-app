📝 Notes App

A secure notes application that allows users to create, edit, modify, and delete notes, with authentication and background synchronization using Firebase.

This project focuses on clean architecture, real-world app behavior, and reliable data syncing rather than flashy UI.

🚀 Features

🔐 User Authentication

Secure login/signup using Firebase Authentication

User-specific notes (no data leakage)

✍️ CRUD Operations

Create new notes

Edit existing notes

Modify content in real time

Delete notes securely

🔄 Background Sync

Notes are synced with Firebase in the background

Offline-first behavior (local changes sync when online)

Consistent state across sessions

☁️ Cloud Storage

Notes stored and managed using Firebase

Real-time updates support

🛠 Tech Stack

Frontend: React Native

Backend / Cloud: Firebase

Firebase Authentication

Firestore / Realtime Database

State Management: Local state + sync layer

Platform: Android (extensible to iOS)

🧠 What This Project Demonstrates

Handling authenticated user data

Implementing full CRUD workflows

Designing background data synchronization

Managing offline + online state

Writing production-style app logic

This project is intentionally kept simple and focused to highlight core application fundamentals.


