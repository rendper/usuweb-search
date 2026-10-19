let tabs = [{ id: 0, title: "Usuweb Home", query: "", url: "" }];
let activeTabId = 0;

// Local persistent mock user database
let userDatabase = JSON.parse(localStorage.getItem('usuweb_users')) || { "admin": "usuweb123" };
let loggedInUser = localStorage.getItem('usuweb_logged_in') || null;

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
    resDiv.innerHTML = `<div style="text-align: center; margin-top: 50px; color: #777;"><h2>Usuweb Search</h2><p>Explore the secure web ecosystem.</p></div>`;

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

    // INTERCEPT: Check if user entered the verification site url
    if (input.toLowerCase().includes('usuwebverisite.lol.com')) {
        renderVerificationPortal();
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

        const webViewer = document.getElementById(`webViewer-${activeTabId}`);
        const resultsDiv = document.getElementById(`results-${activeTabId}`);
        resultsDiv.style.display = 'none';
        webViewer.style.display = 'block';
        webViewer.src = url;
    } else {
        performMultiSearch(input);
    }
}

// Render Authentication & Verification Portal
function renderVerificationPortal() {
    const resultsDiv = document.getElementById(`results-${activeTabId}`);
    const webViewer = document.getElementById(`webViewer-${activeTabId}`);
    webViewer.style.display = 'none';
    resultsDiv.style.display = 'block';

    if (loggedInUser) {
        resultsDiv.innerHTML = `
            <div style="max-width: 450px; margin: 40px auto; background: #1e1e1e; padding: 30px; border-radius: 12px; border: 1px solid #333; text-align: center;">
                <h2 style="color: #4db8ff;">Usuweb Verification Dashboard</h2>
                <p style="color: #6bbe6b; font-weight: bold;">Status: Authenticated & Verified</p>
                <p style="color: #aaa; margin: 20px 0;">Logged in as: <strong>${loggedInUser}</strong></p>
                <button onclick="logoutUser()" style="background: #ff5555; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Sign Out</button>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = `
            <div style="max-width: 450px; margin: 40px auto; background: #1e1e1e; padding: 30px; border-radius: 12px; border: 1px solid #333;">
                <h2 style="color: #4db8ff; text-align: center; margin-bottom: 5px;">Usuweb Security Portal</h2>
                <p style="color: #ffb84d; text-align: center; font-size: 0.9rem; margin-bottom: 20px;">⚠️ Warning: Valid account required for system verification.</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #aaa; font-size: 0.85rem; display: block; margin-bottom: 5px;">Username</label>
                    <input type="text" id="authUsername" placeholder="Enter username" style="width: 100%; padding: 10px; background: #121212; border: 1px solid #444; color: white; border-radius: 6px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="color: #aaa; font-size: 0.85rem; display: block; margin-bottom: 5px;">Password</label>
                    <input type="password" id="authPassword" placeholder="Enter password" style="width: 100%; padding: 10px; background: #121212; border: 1px solid #444; color: white; border-radius: 6px; box-sizing: border-box;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="handleLogin()" style="flex: 1; background: #4db8ff; color: #121212; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">Sign In</button>
                    <button onclick="handleSignup()" style="flex: 1; background: #2a2a2a; color: #4db8ff; border: 1px solid #4db8ff; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">Sign Up</button>
                </div>
                <p id="authMessage" style="text-align: center; margin-top: 15px; font-size: 0.9rem;"></p>
            </div>
        `;
    }
}

function handleLogin() {
    const user = document.getElementById('authUsername').value.trim();
    const pass = document.getElementById('authPassword').value.trim();
    const msg = document.getElementById('authMessage');

    if (!user || !pass) {
        msg.style.color = '#ff6b6b';
        msg.innerText = 'Please enter both username and password.';
        return;
    }

    if (userDatabase[user] && userDatabase[user] === pass) {
        loggedInUser = user;
        localStorage.setItem('usuweb_logged_in', user);
        msg.style.color = '#6bbe6b';
        msg.innerText = 'Success! Verifying session...';
        setTimeout(renderVerificationPortal, 1000);
    } else {
        msg.style.color = '#ff6b6b';
        msg.innerText = 'Incorrect username or password.';
    }
}

function handleSignup() {
    const user = document.getElementById('authUsername').value.trim();
    const pass = document.getElementById('authPassword').value.trim();
    const msg = document.getElementById('authMessage');

    if (!user || !pass) {
        msg.style.color = '#ff6b6b';
        msg.innerText = 'Please enter a valid username and password to register.';
        return;
    }

    if (userDatabase[user]) {
        msg.style.color = '#ff6b6b';
        msg.innerText = 'Username already exists. Please sign in.';
        return;
    }

    userDatabase[user] = pass;
    localStorage.setItem('usuweb_users', JSON.stringify(userDatabase));
    msg.style.color = '#6bbe6b';
    msg.innerText = 'Account created and saved successfully! You can now sign in.';
}

function logoutUser() {
    loggedInUser = null;
    localStorage.removeItem('usuweb_logged_in');
    renderVerificationPortal();
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
