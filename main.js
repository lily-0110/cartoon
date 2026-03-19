const storyEl = document.getElementById('story');
const generateBtn = document.getElementById('generate');
const panels = [
    document.getElementById('panel-1'),
    document.getElementById('panel-2'),
    document.getElementById('panel-3'),
    document.getElementById('panel-4'),
];

generateBtn.addEventListener('click', generateCartoon);

async function generateImage(prompt) {
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'YOUR_API_KEY') {
        alert('Please set your Gemini API key in config.js');
        throw new Error('API key not set');
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-image:generateImage?key=${GEMINI_API_KEY}`;

    const requestBody = {
        "prompt": {
            "text": prompt
        },
        "image_generation_config": {
            "number_of_images": 1,
            "image_format": "PNG"
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
        throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.images && data.images.length > 0) {
        return `data:image/png;base64,${data.images[0].base64Image}`;
    } else {
        // Fallback to a placeholder if the API doesn't return an image
        const hash = prompt.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return `https://via.placeholder.com/500x500/${color}/FFFFFF?text=${encodeURIComponent(prompt)}`;
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
        const storyParts = splitStory(story);

        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            const storyPart = storyParts[i] || '';

            const imageUrl = await generateImage(storyPart);

            console.log(`Generating panel ${i + 1} with story: ${storyPart}`);
            panel.classList.remove('loading');
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = storyPart;
            panel.appendChild(img);
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

function splitStory(story) {
    const sentences = story.match(/[^.!?]+[.!?]+/g) || [story];
    const parts = ['', '', '', ''];

    if (sentences.length === 1) {
        parts[0] = sentences[0];
    } else if (sentences.length === 2) {
        parts[0] = sentences[0];
        parts[1] = sentences[1];
    } else if (sentences.length === 3) {
        parts[0] = sentences[0];
        parts[1] = sentences[1];
        parts[2] = sentences[2];
    } else {
        const partLength = Math.ceil(sentences.length / 4);
        for (let i = 0; i < 4; i++) {
            parts[i] = sentences.slice(i * partLength, (i + 1) * partLength).join(' ');
        }
    }

    return parts;
}