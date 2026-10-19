function handleKeyPress(event) {
    if (event.key === "Enter") {
        performSearch();
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('results');

    if (!query) {
        resultsDiv.innerHTML = '<p style="color: #ff6b6b;">Please enter something to search.</p>';
        return;
    }

    resultsDiv.innerHTML = '<p style="color: #aaa;">Searching Usuweb...</p>';

    // Redirects to Wikipedia search (Free API test)
    setTimeout(() => {
        const targetUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
        resultsDiv.innerHTML = `
            <div class="result-item">
                <a href="${targetUrl}" target="_blank">Search results for "${query}" on Wikipedia</a>
                <p>Click the link above to view free instant web results inside Usuweb.</p>
            </div>
            <div class="result-item">
                <a href="https://duckduckgo.com/?q=${encodeURIComponent(query)}" target="_blank">Search "${query}" on Web Aggregator</a>
                <p>Direct web query output without tracking.</p>
            </div>
        `;
    }, 500);
}
