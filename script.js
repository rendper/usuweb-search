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

    // Check if user entered a direct website address (e.g. example.com or http://...)
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
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching Usuweb network for "${query}"...</p>`;

    try {
        // Querying public multi-engine search API for universal web results
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
        const textHtml = await response.text();
        
        // Parse the returned HTML search results cleanly
        const parser = new DOMParser();
        const doc = parser.parseFromString(textHtml, 'text_html');
        const results = doc.querySelectorAll('.result');

        if (!results || results.length === 0) {
            resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center;">No web results found for "${query}" on Usuweb.</p>`;
            return;
        }

        resultsDiv.innerHTML = ''; // Clear loading message

        let count = 0;
        results.forEach(item => {
            if (count >= 10) return;
            const titleElem = item.querySelector('.result__title');
            const snippetElem = item.querySelector('.result__snippet');
            const linkElem = item.querySelector('.result__url');

            if (titleElem && linkElem) {
                const title = titleElem.textContent.trim();
                const rawUrl = linkElem.getAttribute('href');
                const snippet = snippetElem ? snippetElem.textContent.trim() : 'Explore this website on Usuweb.';
                
                // Clean up destination link
                let finalUrl = rawUrl;
                if (rawUrl && rawUrl.includes('uddg=')) {
                    const match = rawUrl.match(/uddg=([^&]+)/);
                    if (match) finalUrl = decodeURIComponent(match[1]);
                }

                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.innerHTML = `
                    <a href="#" onclick="openInViewer('${finalUrl}')">${title}</a>
                    <p>${snippet}</p>
                    <small style="color: #4db8ff; font-size: 0.8rem;">${finalUrl}</small>
                `;
                resultsDiv.appendChild(resultElement);
                count++;
            }
        });

        if (count === 0) {
            resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center;">No valid web entries found for "${query}".</p>`;
        }

    } catch (error) {
        console.error('Usuweb Search Error:', error);
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Network error while querying Usuweb servers.</p>`;
    }
}

function openInViewer(url) {
    const resultsDiv = document.getElementById('results');
    const webViewer = document.getElementById('webViewer');
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
