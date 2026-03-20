# Cartoon Generator Blueprint

## Overview

This is a web application that generates a 4-panel cartoon from a user's story. The user inputs a story, and the application uses Gemini 1.5 Flash to analyze the story and generate 4 visual prompts, which are then used to generate 4 images for the cartoon panels.

## Features

*   **Story Input:** A text area for the user to enter their story.
*   **Gemini Integration:**
    *   **Prompt Generation:** Uses Gemini 1.5 Flash to divide the story into 4 parts and create detailed visual descriptions.
    *   **Image Generation:** Uses Imagen 3 (via Gemini API) or a fallback (Pollinations AI) to create images from the generated prompts.
*   **Cartoon Display:** The four generated images are displayed in a 2x2 grid layout.
*   **Captions:** Visual descriptions are displayed as captions on hover for each panel.
*   **Responsive Design:** The application is responsive and works on different screen sizes.

## Current State

*   **HTML:** Basic structure in `index.html`.
*   **CSS:** Modern styles in `style.css` with a 2x2 grid and hover effects for captions.
*   **JavaScript:** `main.js` implements the full logic of calling Gemini API and handling image generation.
*   **Configuration:** `config.js` (ignored by git) contains the API key.

## Implementation Details

### Prompt Generation (Gemini 1.5 Flash)
The app sends the user's story to Gemini 1.5 Flash with a instruction to output 4 visual descriptions in JSON format.

### Image Generation
The app attempts to use the `imagen-3.0-generate-001` model. If it fails (due to API access or rollout status), it falls back to `pollinations.ai` to ensure the user always sees a result.

### UI/UX
*   Loading indicators are shown for each panel during generation.
*   The "Generate" button is disabled during the process to prevent multiple overlapping requests.
*   Error handling is implemented to alert the user if something goes wrong.
