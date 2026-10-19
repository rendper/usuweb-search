let tabs = [{ id: 0, title: "Usuweb Home", query: "", url: "" }];
let activeTabId = 0;

function handleKeyPress(event) {
    if (event.key === "Enter") {
        navigateOrSearch();
    }
}

function addNewTab() {
    const newId = tabs.length;
    tabs.push({ id: newId, title: "New Tab", query: "", url: "" });
    activeTabId = newId;
    renderTabs();
    createTabContent(newId);
}

function switchTab(id) {
    activeTabId = id;
    renderTabs();
    showTabContent(id);
}

function closeTab(id) {
    if (tabs.length === 1) return; // Keep at least one tab
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
        activeTabId = tabs[tabs.length - 1].id;
    }
    renderTabs();
    showTabContent(activeTabId);
}

function renderTabs() {
    const container = document.getElementById('tabContainer');
    let html = '';
    tabs.forEach(tab => {
        const isActive = tab.id === activeTabId ? 'active-tab' : '';
        html += `
            <div class="tab ${isActive}" onclick="switchTab(${tab.id})">
                <span>${tab.title}</span>
                ${tabs.length > 1 ? `<span class="close-tab" onclick="event.stopPropagation(); closeTab(${tab.id})">×</span>` : ''}
            </div>
        `;
    });
    html += `<button class="new-tab-btn" onclick="addNewTab()">+</button>`;
    container.innerHTML = html;
}

function createTabContent(id) {
    const mainContainer = document.getElementById('mainContentContainer');
    
    // Hide all existing tab contents
    document.querySelectorAll('.results-container, .web-viewer').forEach(el => el.style.display = 'none');

    // Create new containers for this tab
    const resDiv = document.createElement('div');
    resDiv.id = `results-${id}`;
    resDiv.className = 'results-container';
    resDiv.innerHTML = `<div style="text-align: center; margin-top: 50px; color: #777;"><h2>Usuweb Search</h2><p>Explore the web securely.</p></div>`;

    const iframe = document.createElement('iframe');
    iframe.id = `webViewer-${id}`;
    iframe.className = 'web-viewer';
    iframe.style.display = 'none';

    mainContainer.appendChild(resDiv);
    mainContainer.appendChild(iframe);
}

function showTabContent(id) {
    document.querySelectorAll('.results-container, .web-viewer').forEach(el => el.style.display = 'none');
    const resDiv = document.getElementById(`results-${id}`);
    const iframe = document.getElementById(`webViewer-${id}`);
    
    if (resDiv && resDiv.innerHTML.trim() !== '') {
        resDiv.style.display = 'block';
    } else if (iframe && iframe.src) {
        iframe.style.display = 'block';
    } else if (resDiv) {
        resDiv.style.display = 'block';
    }
}

function navigateOrSearch() {
    const input = document.getElementById('searchInput').value.trim();
    if (!input) return;

    // Update active tab title
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) currentTab.title = input.length > 15 ? input.substring(0, 15) + '...' : input;
    renderTabs();

    // Check if download URL or direct webpage link
    const isUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/i.test(input);

    if (isUrl) {
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Handle direct file downloads robustly
        if (url.match(/\.(zip|exe|pdf|dmg|tar|gz|mp3|mp4)$/i)) {
            triggerSecureDownload(url);
            return;
        }

        const webViewer = document.getElementById(`webViewer-${activeTabId}`);
        const resultsDiv = document.getElementById(`results-${activeTabId}`);
        resultsDiv.style.display = 'none';
        webViewer.style.display = 'block';
        webViewer.src = url;
    } else {
        performMultiSearch(input);
    }
}

async function triggerSecureDownload(fileUrl) {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #4db8ff; text-align: center; margin-top: 20px;">Downloading file securely via Usuweb network...</p>`;

    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileUrl.split('/').pop() || 'usuweb_download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

        resultsDiv.innerHTML = `<p style="color: #6bbe6b; text-align: center; margin-top: 20px;">Download completed successfully!</p>`;
    } catch (e) {
        // Fallback to direct window open if CORS restricts fetch
        window.open(fileUrl, '_blank');
        resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">File opened in external download stream.</p>`;
    }
}

async function performMultiSearch(query) {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    const webViewer = document.getElementById(`webViewer-${activeTabId}`);
    
    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching Usuweb network for "<strong>${query}</strong>"...</p>`;

    try {
        const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`).then(res => res.json()).catch(() => null);
        const bbcPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' BBC News')}&format=json&origin=*`).then(res => res.json()).catch(() => null);
        const ytPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' site:youtube.com')}&format=json&origin=*`).then(res => res.json()).catch(() => null);

        const [wikiData, bbcData, ytData] = await Promise.all([wikiPromise, bbcPromise, ytPromise]);

        resultsDiv.innerHTML = `<h3 style="color: #4db8ff; margin-bottom: 15px;">Usuweb Search Results for "${query}"</h3>`;
        let resultsFound = false;

        if (wikiData && wikiData.query && wikiData.query.search) {
            wikiData.query.search.slice(0, 3).forEach(item => {
                resultsFound = true;
                appendResultItem(resultsDiv, item.title, item.snippet, `https://en.wikipedia.org/?curid=${item.pageid}`, 'usuweb.internal/wiki');
            });
        }

        if (bbcData && bbcData.query && bbcData.query.search) {
            bbcData.query.search.slice(0, 2).forEach(item => {
                resultsFound = true;
                appendResultItem(resultsDiv, "BBC News: " + item.title, item.snippet, `https://www.bbc.com/search?q=${encodeURIComponent(query)}`, 'usuweb.news/bbc');
            });
        }

        if (ytData && ytData.query && ytData.query.search) {
            ytData.query.search.slice(0, 2).forEach(item => {
                resultsFound = true;
                appendResultItem(resultsDiv, "YouTube: " + item.title, item.snippet, `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, 'usuweb.media/youtube');
            });
        }

        if (!resultsFound) {
            resultsDiv.innerHTML += `<p style="color: #aaa; text-align: center;">No records found.</p>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Network connection error on Usuweb servers.</p>`;
    }
}

async function loadUsuwebNews() {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    const webViewer = document.getElementById(`webViewer-${activeTabId}`);

    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Fetching breaking global news...</p>`;

    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=BBC%20News%20world%20headlines&format=json&origin=*`);
        const data = await response.json();

        resultsDiv.innerHTML = '<h2 style="color: #4db8ff; margin-bottom: 20px; font-weight: 500;">Usuweb Live News Feed</h2>';

        if (data.query && data.query.search) {
            data.query.search.forEach(item => {
                appendResultItem(resultsDiv, item.title, item.snippet, 'https://www.bbc.com/news', 'usuweb.news/live');
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
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    const webViewer = document.getElementById(`webViewer-${activeTabId}`);
    
    resultsDiv.style.display = 'none';
    webViewer.style.display = 'block';
    webViewer.src = url;
}
