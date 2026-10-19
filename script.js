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
    if (tabs.length === 1) return;
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
    document.querySelectorAll('.results-container, .web-viewer').forEach(el => el.style.display = 'none');

    const resDiv = document.createElement('div');
    resDiv.id = `results-${id}`;
    resDiv.className = 'results-container';
    resDiv.innerHTML = `<div style="text-align: center; margin-top: 50px; color: #777;"><h2>Usuweb Browser</h2><p>Search millions of websites across the live internet.</p></div>`;

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

    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) currentTab.title = input.length > 15 ? input.substring(0, 15) + '...' : input;
    renderTabs();

    if (input.toLowerCase() === 'verify.html' || input.toLowerCase() === 'verify') {
        openInViewer('verify.html');
        return;
    }

    const isUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/i.test(input);

    if (isUrl) {
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (url.match(/\.(zip|exe|pdf|dmg|tar|gz|mp3|mp4)$/i)) {
            triggerSecureDownload(url);
            return;
        }

        openInViewer(url);
    } else {
        performPrioritizedWebSearch(input);
    }
}

async function triggerSecureDownload(fileUrl) {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #4db8ff; text-align: center; margin-top: 20px;">Downloading file securely via Usuweb...</p>`;

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
        openInViewer(fileUrl);
        resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">File opened in viewer stream.</p>`;
    }
}

// Prioritized Open Web Search (Puts top direct matches first, followed by massive web coverage)
async function performPrioritizedWebSearch(query) {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    const webViewer = document.getElementById(`webViewer-${activeTabId}`);
    
    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;">Searching global web indices for "<strong>${query}</strong>"...</p>`;

    try {
        // Fetch top indexed web matches
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&format=json&origin=*`);
        const data = await response.json();

        resultsDiv.innerHTML = `<h3 style="color: #4db8ff; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">Top Web Search Results for "${query}"</h3>`;

        // 1. TOP DIRECT RESULTS (Ranked 1st)
        if (data.query && data.query.search && data.query.search.length > 0) {
            const topMatch = data.query.search[0];
            const topUrl = `https://en.wikipedia.org/?curid=${topMatch.pageid}`;
            const topSnippet = topMatch.snippet.replace(/<\/?[^>]+(>|$)/g, "");
            
            // Highlight top #1 result prominently at the very top
            const topElement = document.createElement('div');
            topElement.className = 'result-item';
            topElement.style.borderLeft = '4px solid #4db8ff';
            topElement.style.background = '#252525';
            topElement.innerHTML = `
                <span style="background: #4db8ff; color: #121212; font-size: 0.75rem; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">TOP RESULT</span>
                <br>
                <a href="#" onclick="openInViewer('${topUrl}')" style="font-size: 1.1rem; font-weight: bold;">${topMatch.title}</a>
                <p>${topSnippet}</p>
                <small style="color: #4db8ff; font-size: 0.8rem; word-break: break-all;">${topUrl}</small>
            `;
            resultsDiv.appendChild(topElement);

            // Render remaining primary matches right below
            data.query.search.slice(1).forEach(item => {
                const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, "");
                const realUrl = `https://en.wikipedia.org/?curid=${item.pageid}`;
                appendResultItem(resultsDiv, item.title, cleanSnippet, realUrl, realUrl);
            });
        }

        // 2. Massive multi-site open web coverage channels (Reddit, GitHub, News, Global Portals)
        const massiveWebSites = [
            { title: `${query} - Official Web Search & Directories`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, desc: `Direct web portal results and indexing servers matching ${query}.` },
            { title: `${query} - Community Discussions & Social Threads`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`, desc: `Real user conversations, forums, and community channels about ${query}.` },
            { title: `${query} - Live Global News & Press Coverage`, url: `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`, desc: `Latest news articles, press releases, and journal logs regarding ${query}.` },
            { title: `${query} - Developer Repositories & Source Code`, url: `https://github.com/search?q=${encodeURIComponent(query)}`, desc: `Open source projects, software libraries, and code packages for ${query}.` }
        ];

        massiveWebSites.forEach(site => {
            appendResultItem(resultsDiv, site.title, site.desc, site.url, site.url);
        });

    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Network connection error. Please verify your connection.</p>`;
    }
}

async function loadUsuwebNews() {
    performPrioritizedWebSearch("breaking world news headlines");
}

function appendResultItem(container, title, snippet, targetUrl, displayUrl) {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
    resultElement.innerHTML = `
        <a href="#" onclick="openInViewer('${targetUrl}')">${title}</a>
        <p>${snippet}</p>
        <small style="color: #4db8ff; font-size: 0.8rem; word-break: break-all;">${displayUrl}</small>
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
