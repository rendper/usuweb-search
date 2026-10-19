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

    // Check if user entered a URL (e.g. example.com, http://..., or www...)
    const isUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/i.test(input);

    if (isUrl) {
        // Mode 1: Acts like Edge / Chrome (Direct Website Browser)
        resultsDiv.style.display = 'none';
        webViewer.style.display = 'block';
        
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        webViewer.src = url;
    } else {
        // Mode 2: Acts like Google / DuckDuckGo (Web Search Engine)
        webViewer.style.display = 'none';
        resultsDiv.style.display = 'block';
        performSearch(input);
    }
}

async function performSearch(query) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching Usuweb for "${query}"...</p>`;

    try {
        // Query Wikipedia Open Search directly for instant custom result cards
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=10&prop=extracts&exintro=1&explaintext=1&exsentences=2&format=json&origin=*`);
        const data = await response.json();

        if (!data.query || !data.query.pages) {
            resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center;">No results found on Usuweb for "${query}".</p>`;
            return;
        }

        const pages = Object.values(data.query.pages);
        resultsDiv.innerHTML = ''; // Clear loading state

        pages.forEach(page => {
            const pageUrl = `https://en.wikipedia.org/?curid=${page.pageid}`;
            const snippet = page.extract ? page.extract : 'Click link below to open full page...';

            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.innerHTML = `
                <a href="#" onclick="openInViewer('${pageUrl}')">${page.title}</a>
                <p>${snippet}</p>
                <small style="color: #4db8ff; font-size: 0.8rem;">${pageUrl}</small>
            `;
            resultsDiv.appendChild(resultElement);
        });

    } catch (error) {
        console.error('Usuweb Search Error:', error);
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Error connecting to Usuweb search servers.</p>`;
    }
}

function openInViewer(url) {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
