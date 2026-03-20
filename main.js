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

// New function to find any available model that supports generateContent
async function findAvailableModel(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error('Failed to list models');
        const data = await response.json();
        
        // Find models that support generateContent
        const validModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        
        if (validModels.length > 0) {
            // Priority list for better quality
            const priority = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
            for (const p of priority) {
                const found = validModels.find(m => m.name.includes(p));
                if (found) return found.name;
            }
            // If none of the priority models are found, return the first valid one
            return validModels[0].name;
        }
    } catch (e) {
        console.warn('Could not list models, falling back to gemini-pro', e);
    }
    return 'models/gemini-pro'; // Last resort fallback
}

async function generatePrompts(story) {
    const apiKey = getApiKey();
    if (!apiKey) {
        modal.style.display = 'flex';
        throw new Error('Please set your Gemini API key.');
    }

    // Step 1: Discover which model name works for this API Key
    const modelPath = await findAvailableModel(apiKey);
    console.log(`Using discovered model: ${modelPath}`);

    // Step 2: Use the discovered model path to generate content
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

    const prompt = `Divide the following story into exactly 4 parts for a 4-panel cartoon. For each part, provide a short visual description that can be used as an image generation prompt. Output the results as a JSON array of 4 strings.
    
    Story: ${story}
    
    Output format example:
    ["description of panel 1", "description of panel 2", "description of panel 3", "description of panel 4"]`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || response.statusText;
        throw new Error(`Gemini API Error (${modelPath}): ${message}`);
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format from Gemini');
}

async function generateImage(prompt) {
    console.log(`Generating image for: ${prompt}`);
    // Using Pollinations for maximum stability
    return `https://pollinations.ai/p/${encodeURIComponent(prompt + " 4-panel cartoon style, high quality, vibrant colors")}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;
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
        console.log('Finding available model and generating prompts...');
        const storyParts = await generatePrompts(story);
        
        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            const storyPart = storyParts[i] || '';

            const imageUrl = await generateImage(storyPart);

            panel.classList.remove('loading');
            panel.innerHTML = ''; 
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = storyPart;
            img.onerror = () => {
                panel.innerHTML = '<div style="padding:20px; color:red; font-size:10px;">Image failed</div>';
            };
            panel.appendChild(img);
            
            const caption = document.createElement('div');
            caption.className = 'caption';
            caption.textContent = storyPart;
            panel.appendChild(caption);
        }
    } catch (error) {
        console.error('Cartoon Generation Error:', error);
        alert(error.message || 'An error occurred.');
        panels.forEach(panel => {
            panel.classList.remove('loading');
            panel.innerHTML = `<div style="padding: 10px; text-align: center; color: red; font-size: 10px;">${error.message}</div>`;
        });
    } finally {
        generateBtn.disabled = false;
    }
}