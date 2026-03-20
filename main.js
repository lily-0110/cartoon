const storyEl = document.getElementById('story');
const generateBtn = document.getElementById('generate');
const panels = [
    document.getElementById('panel-1'),
    document.getElementById('panel-2'),
    document.getElementById('panel-3'),
    document.getElementById('panel-4'),
];

// Modal elements
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('api-modal');
const closeBtn = document.getElementById('close-modal');
const saveBtn = document.getElementById('save-key');
const apiKeyInput = document.getElementById('api-key-input');

// Function to get the current API Key
function getApiKey() {
    return window.GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
}

// Initialize API Key from localStorage if available
const storedKey = localStorage.getItem('gemini_api_key');
if (storedKey) {
    window.GEMINI_API_KEY = storedKey;
    apiKeyInput.value = storedKey;
}

settingsBtn.onclick = () => modal.style.display = 'flex';
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

saveBtn.onclick = () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        window.GEMINI_API_KEY = key;
        alert('API Key saved successfully!');
        modal.style.display = 'none';
    }
};

generateBtn.addEventListener('click', generateCartoon);

async function generatePrompts(story) {
    const apiKey = getApiKey();
    if (!apiKey) {
        modal.style.display = 'flex';
        throw new Error('Please set your Gemini API key.');
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Divide the following story into exactly 4 parts for a 4-panel cartoon. For each part, provide a short visual description that can be used as an image generation prompt. Output the results as a JSON array of 4 strings.
    
    Story: ${story}
    
    Output format example:
    ["description of panel 1", "description of panel 2", "description of panel 3", "description of panel 4"]`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || response.statusText;
        throw new Error(`Gemini API Error: ${message}`);
    }

    const data = await response.json();
    try {
        let text = data.candidates[0].content.parts[0].text;
        // Sometimes the model might wrap JSON in backticks even if mime type is set
        text = text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse Gemini response:', data);
        throw new Error('Failed to parse the story into 4 parts. Please try a simpler story.');
    }
}

async function generateImage(prompt) {
    const apiKey = getApiKey();
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    
    try {
        const requestBody = {
            "instances": [{ "prompt": `A high-quality cartoon illustration: ${prompt}` }],
            "parameters": { "sampleCount": 1 }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error('Imagen 3 API failed');

        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
            return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        }
        throw new Error('No image returned');
    } catch (e) {
        console.warn('Imagen fallback used for:', prompt);
        return `https://pollinations.ai/p/${encodeURIComponent(prompt + " cartoon style")}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}`;
    }
}

async function generateCartoon() {
    const story = storyEl.value.trim();
    if (!story) {
        alert('Please enter a story.');
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        modal.style.display = 'flex';
        return;
    }

    generateBtn.disabled = true;
    panels.forEach(panel => {
        panel.innerHTML = '';
        panel.classList.add('loading');
    });

    try {
        console.log('Generating prompts...');
        const storyParts = await generatePrompts(story);
        
        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            const storyPart = storyParts[i] || '';

            console.log(`Generating image for panel ${i + 1}...`);
            const imageUrl = await generateImage(storyPart);

            panel.classList.remove('loading');
            panel.innerHTML = ''; // Clear loading state
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = storyPart;
            panel.appendChild(img);
            
            const caption = document.createElement('div');
            caption.className = 'caption';
            caption.textContent = storyPart;
            panel.appendChild(caption);
        }
    } catch (error) {
        console.error('Cartoon Generation Error:', error);
        alert(error.message || 'An error occurred. Please try again.');
        panels.forEach(panel => {
            panel.classList.remove('loading');
            panel.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">Error</div>`;
        });
    } finally {
        generateBtn.disabled = false;
    }
}