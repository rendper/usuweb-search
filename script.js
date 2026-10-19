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
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`)}`;
        
        const response = await fetch(apiUrl);
        const wrapperData = await response.json();
        const data = JSON.parse(wrapperData.contents);

        resultsDiv.innerHTML = '';

        let resultsFound = false;

        // Display Primary Topic Result
        if (data.Heading && data.AbstractText) {
            resultsFound = true;
            const mainResult = document.createElement('div');
            mainResult.className = 'result-item';
            mainResult.innerHTML = `
                <a href="#" onclick="openInViewer('${data.AbstractURL}')">${data.Heading}</a>
                <p>${data.AbstractText}</p>
                <small style="color: #4db8ff; font-size: 0.8rem;">${cleanUrlDisplay(data.AbstractURL)}</small>
            `;
            resultsDiv.appendChild(mainResult);
        }

        // Display Related Results
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    resultsFound = true;
                    const titleParts = topic.Text.split(' - ');
                    const title = titleParts[0];

                    const resultElement = document.createElement('div');
                    resultElement.className = 'result-item';
                    resultElement.innerHTML = `
                        <a href="#" onclick="openInViewer('${topic.FirstURL}')">${title}</a>
                        <p>${topic.Text}</p>
                        <small style="color: #4db8ff; font-size: 0.8rem;">${cleanUrlDisplay(topic.FirstURL)}</small>
                    `;
                    resultsDiv.appendChild(resultElement);
                }
            });
        }

        if (!resultsFound) {
            resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center;">No results found for "${query}". Try entering a direct site link (e.g. news.ycombinator.com).</p>`;
        }

    } catch (error) {
        console.error('Usuweb Search Error:', error);
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Network error connecting to Usuweb search servers.</p>`;
    }
}

// NEW: Function to load live News directly in Usuweb
async function loadUsuwebNews() {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');

    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Fetching latest global news on Usuweb...</p>`;

    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=news&format=json&origin=*`);
        const data = await response.json();

        resultsDiv.innerHTML = '<h2 style="color: #4db8ff; margin-bottom: 20px;">Usuweb Top News Headlines</h2>';

        if (data.query && data.query.search) {
            data.query.search.forEach(item => {
                const articleUrl = `https://en.wikipedia.org/?curid=${item.pageid}`;
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.innerHTML = `
                    <a href="#" onclick="openInViewer('${articleUrl}')">${item.title}</a>
                    <p>${item.snippet.replace(/<\/?[^>]+(>|$)/g, "")}...</p>
                    <small style="color: #4db8ff; font-size: 0.8rem;">${articleUrl}</small>
                `;
                resultsDiv.appendChild(resultElement);
            });
        }
    } catch (err) {
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Failed to load live news feed.</p>`;
    }
}

function cleanUrlDisplay(rawUrl) {
    if (!rawUrl) return 'usuweb.internal';
    try {
        const parsed = new URL(rawUrl);
        return parsed.hostname + parsed.pathname;
    } catch(e) {
        return rawUrl;
    }
}

function openInViewer(url) {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
