
# Data Compliance & Privacy Framework (POC)

## Overview
This document outlines the strategy for handling user data, compliance (GDPR/CCPA), and AI transparency in the Pathfinder application. As a Proof of Concept (POC), this framework emphasizes transparency, modularity, and user control without a full legal backend implementation.

## Checklist

### 1. Transparency & Disclosure
- [ ] **Public Privacy Page**: A dedicated `/privacy` route explaining data practices.
- [ ] **AI Disclosure**: Explicitly state usage of Google Gemini and other AI models.
- [ ] **Data Collection**: List what is collected (Location, Preferences, Auth).

### 2. User Control (Data Subject Rights)
- [ ] **Data Export**: Allow users to download their data (JSON format).
- [ ] **Right to Erasure**: Allow users to delete their account and associated data.
- [ ] **Consent Management**: (Future) granular toggles for specific data uses.

### 3. Compliance Framework
- [ ] **Modular Regulations**: Structure code to handle different regions (CA, EU, ROW).
- [ ] **Dynamic Requirements**: A system to enable/disable features based on detected regulation (mocked for POC).

## Technical Implementation Plan

1.  **Compliance Service** (`src/services/compliance.ts`):
    -   Methods to `exportUserData(userId)`
    -   Methods to `deleteUserAccount(userId)`
    -   Configuration for enabled regulations.

2.  **UI Updates**:
    -   **ConfigureView**: Add a "Privacy & Data" section.
        -   Download Data button.
        -   Delete Account button.
        -   "AI Transparency" info card.
    -   **PrivacyPage**: Ensure it reflects the latest features and AI disclosures.

3.  **Data Schema (Conceptual)**:
    -   Users own their "Itineraries" and "Preferences".
    -   Deletion should cascade to these tables.
