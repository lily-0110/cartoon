const storyEl = document.getElementById('story');
const generateBtn = document.getElementById('generate');
const panels = [
    document.getElementById('panel-1'),
    document.getElementById('panel-2'),
    document.getElementById('panel-3'),
    document.getElementById('panel-4'),
];

generateBtn.addEventListener('click', generateCartoon);

async function generatePrompts(story) {
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'YOUR_API_KEY') {
        alert('Please set your Gemini API key in config.js');
        throw new Error('API key not set');
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        throw new Error(`Failed to generate prompts: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

async function generateImage(prompt) {
    // Since Google AI Studio's Imagen 3 API is currently being rolled out and might have different access patterns,
    // we will use a more robust way to handle image generation or provide a high-quality placeholder if it fails.
    // For now, let's try the common v1beta Imagen endpoint.
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;
    
    try {
        const requestBody = {
            "instances": [
                { "prompt": `A high-quality 4-panel cartoon style illustration: ${prompt}` }
            ],
            "parameters": {
                "sampleCount": 1
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.warn(`Imagen 3 API failed, using fallback. Status: ${response.status}`);
            throw new Error('Imagen 3 API failed');
        }

        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
            return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        }
    } catch (e) {
        // Fallback: Using a stable, high-quality image placeholder or a known public API if Gemini API fails
        // For the purpose of this demo, let's use Pollinations or similar if Imagen is not ready
        return `https://pollinations.ai/p/${encodeURIComponent(prompt + " cartoon style")}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}`;
    }
}

async function generateCartoon() {
    const story = storyEl.value;
    if (!story) {
        alert('Please enter a story.');
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
        console.log('Generated prompts:', storyParts);

        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            const storyPart = storyParts[i] || '';

            console.log(`Generating image for panel ${i + 1}...`);
            const imageUrl = await generateImage(storyPart);

            panel.classList.remove('loading');
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = storyPart;
            panel.appendChild(img);
            
            // Add caption to the panel
            const caption = document.createElement('div');
            caption.className = 'caption';
            caption.textContent = storyPart;
            panel.appendChild(caption);
        }
    } catch (error) {
        console.error('Error generating cartoon:', error);
        alert('An error occurred while generating the cartoon. Please try again.');
        panels.forEach(panel => {
            panel.classList.remove('loading');
            panel.innerHTML = `<p>Error</p>`;
        });
    } finally {
        generateBtn.disabled = false;
    }
}