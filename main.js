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
    //
    // In a real application, this would be a call to an image generation API.
    // For now, we'll return a placeholder image from unspalsh.
    //
    const response = await fetch(`https://source.unsplash.com/random/500x500/?${encodeURIComponent(prompt)}`);
    if (!response.ok) {
        throw new Error('Failed to generate image');
    }
    return response.url;
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