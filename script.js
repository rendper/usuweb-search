function handleKeyPress(event) {
    if (event.key === "Enter") {
        navigateOrSearch();
    }
}

function navigateOrSearch() {
    const input = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');

    if (!input) return;

    // Check if user entered a direct website address (e.g. example.com or https://...)
    const isUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/i.test(input);

    if (isUrl) {
        resultsDiv.style.display = 'none';
        webViewer.style.display = 'block';
        
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        webViewer.src = url;
    } else {
        webViewer.style.display = 'none';
        resultsDiv.style.display = 'block';
        performSearch(input);
    }
}

async function performSearch(query) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching Usuweb network for "<strong>${query}</strong>"...</p>`;

    try {
        // Query DDG Instant Answers API via free CORS proxy
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`)}`;
        
        const response = await fetch(apiUrl);
        const wrapperData = await response.json();
        const data = JSON.parse(wrapperData.contents);

        resultsDiv.innerHTML = ''; // Clear loading message

        let resultsFound = false;

        // Display Primary Abstract / Direct Answer if available
        if (data.Heading && data.AbstractText) {
            resultsFound = true;
            const mainResult = document.createElement('div');
            mainResult.className = 'result-item';
            mainResult.innerHTML = `
                <a href="#" onclick="openInViewer('${data.AbstractURL}')">${data.Heading}</a>
                <p>${data.AbstractText}</p>
                <small style="color: #4db8ff; font-size: 0.8rem;">${data.AbstractURL}</small>
            `;
            resultsDiv.appendChild(mainResult);
        }

        // Display Related Topic results
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    resultsFound = true;
                    const resultElement = document.createElement('div');
                    resultElement.className = 'result-item';
                    resultElement.innerHTML = `
                        <a href="#" onclick="openInViewer('${topic.FirstURL}')">${topic.Text.split(' - ')[0]}</a>
                        <p>${topic.Text}</p>
                        <small style="color: #4db8ff; font-size: 0.8rem;">${topic.FirstURL}</small>
                    `;
                    resultsDiv.appendChild(resultElement);
                }
            });
        }

        // Fallback option if DDG Instant API didn't return structured list
        if (!resultsFound) {
            const fallbackResult = document.createElement('div');
            fallbackResult.className = 'result-item';
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            fallbackResult.innerHTML = `
                <a href="#" onclick="openInViewer('${searchUrl}')">View Web Results for "${query}" on Usuweb</a>
                <p>Click above to open web search results directly inside Usuweb's browser frame.</p>
                <small style="color: #4db8ff; font-size: 0.8rem;">${searchUrl}</small>
            `;
            resultsDiv.appendChild(fallbackResult);
        }

    } catch (error) {
        console.error('Usuweb Search Error:', error);
        // Clean error handler with working web fallback
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        resultsDiv.innerHTML = `
            <div class="result-item">
                <a href="#" onclick="openInViewer('${searchUrl}')">Explore "${query}" on Usuweb Browser</a>
                <p>Click above to view web results directly inside Usuweb.</p>
            </div>
        `;
    }
}

function openInViewer(url) {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
