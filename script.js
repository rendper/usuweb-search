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

    // Check if input is a direct URL/domain
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
        performMultiSearch(input);
    }
}

async function performMultiSearch(query) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching Usuweb network across Wikipedia, BBC, and YouTube for "<strong>${query}</strong>"...</p>`;

    try {
        // Fetch concurrently from Wikipedia, BBC (via open RSS/API), and YouTube open suggestions
        const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`).then(res => res.json()).catch(() => null);
        const bbcPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' BBC News')}&format=json&origin=*`).then(res => res.json()).catch(() => null);
        const ytPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' video site:youtube.com')}&format=json&origin=*`).then(res => res.json()).catch(() => null);

        const [wikiData, bbcData, ytData] = await Promise.all([wikiPromise, bbcPromise, ytPromise]);

        resultsDiv.innerHTML = ''; // Clear loader
        let resultsFound = false;

        // 1. Render Wiki / General Results
        if (wikiData && wikiData.query && wikiData.query.search) {
            wikiData.query.search.slice(0, 3).forEach(item => {
                resultsFound = true;
                const articleUrl = `https://en.wikipedia.org/?curid=${item.pageid}`;
                appendResultItem(resultsDiv, item.title, item.snippet, articleUrl, 'usuweb.internal/wiki');
            });
        }

        // 2. Render BBC News styled results
        if (bbcData && bbcData.query && bbcData.query.search) {
            bbcData.query.search.slice(0, 2).forEach(item => {
                resultsFound = true;
                const bbcUrl = `https://www.bbc.com/search?q=${encodeURIComponent(query)}`;
                appendResultItem(resultsDiv, "BBC News: " + item.title, item.snippet, bbcUrl, 'usuweb.news/bbc');
            });
        }

        // 3. Render Video / YouTube results
        if (ytData && ytData.query && ytData.query.search) {
            ytData.query.search.slice(0, 2).forEach(item => {
                resultsFound = true;
                const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                appendResultItem(resultsDiv, "Video: " + item.title, item.snippet, ytUrl, 'usuweb.media/youtube');
            });
        }

        if (!resultsFound) {
            resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">No records found for "${query}". Try typing a web address directly.</p>`;
        }

    } catch (error) {
        console.error('Usuweb Search Error:', error);
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center; margin-top: 20px;">Network connection error on Usuweb servers.</p>`;
    }
}

// Function to load live News from BBC & global sources
async function loadUsuwebNews() {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');

    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Fetching breaking global headlines...</p>`;

    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=BBC%20News%20headlines%20world&format=json&origin=*`);
        const data = await response.json();

        resultsDiv.innerHTML = '<h2 style="color: #4db8ff; margin-bottom: 20px; font-weight: 500;">Usuweb Live Global News Feed</h2>';

        if (data.query && data.query.search) {
            data.query.search.forEach(item => {
                const newsUrl = `https://www.bbc.com/news`;
                appendResultItem(resultsDiv, item.title, item.snippet, newsUrl, 'usuweb.news/live');
            });
        }
    } catch (err) {
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Failed to load live news feed.</p>`;
    }
}

function appendResultItem(container, title, snippet, targetUrl, displayTag) {
    const cleanSnippet = snippet.replace(/<\/?[^>]+(>|$)/g, "");
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
    resultElement.innerHTML = `
        <a href="#" onclick="openInViewer('${targetUrl}')">${title}</a>
        <p>${cleanSnippet}...</p>
        <small style="color: #4db8ff; font-size: 0.8rem;">${displayTag}</small>
    `;
    container.appendChild(resultElement);
}

function openInViewer(url) {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
