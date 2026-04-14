class TVShowsApp {
    constructor() {
        this.API_BASE = 'https://api.tvmaze.com';
        this.userData = this.loadUserData();
        this.currentShows = [];
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkUserLogin();
    }

    bindEvents() {
        document.getElementById('guestLoginBtn').addEventListener('click', () => this.handleGuestLogin());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchShows());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchShows();
        });
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            if (!this.searchTerm) {
                this.loadAllShows();
            }
        });
    }

    checkUserLogin() {
        if (this.userData.username) {
            this.showMainContent(this.userData.username);
        } else {
            document.getElementById('loginModal').classList.add('active');
        }
    }

    handleGuestLogin() {
        const username = document.getElementById('usernameInput').value.trim() || 'Guest';
        
        this.userData = {
            username,
            loginTime: new Date().toISOString(),
            showsViewed: [],
            searchHistory: [],
            preferences: {
                darkMode: false,
                showsPerPage: 20
            }
        };

        this.saveUserData();
        this.showMainContent(username);
        this.loadAllShows();
    }

    handleLogout() {
        this.userData = {};
        this.saveUserData();
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('showsGrid').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('searchInput').value = '';
    }

    showMainContent(username) {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('welcomeUser').textContent = `Welcome, ${username}!`;
        document.getElementById('showsGrid').style.display = 'grid';
    }

    async loadAllShows() {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.API_BASE}/shows?page=0`);
            this.currentShows = await response.json();
            this.renderShows();
        } catch (error) {
            console.error('Error loading shows:', error);
            this.showError('Failed to load shows. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async searchShows() {
        if (!this.searchTerm.trim()) return;

        this.showLoading(true);
        try {
            const response = await fetch(`${this.API_BASE}/search/shows?q=${encodeURIComponent(this.searchTerm)}`);
            const results = await response.json();
            this.currentShows = results.map(result => result.show);
            this.addToSearchHistory(this.searchTerm);
            this.renderShows();
        } catch (error) {
            console.error('Error searching shows:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    renderShows() {
        const grid = document.getElementById('showsGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.currentShows.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        grid.innerHTML = this.currentShows.map(show => `
            <div class="show-card" data-show-id="${show.id}" onclick="app.trackShowView(${show.id})">
                <img src="${show.image?.medium || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${show.name}" class="show-image" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="show-content">
                    <h3 class="show-title">${show.name}</h3>
                    ${show.network?.name ? `<div class="show-info"><span>📺 ${show.network.name}</span></div>` : ''}
                    ${show.genres?.length ? `<div class="show-info">${show.genres.map(g => `<span>${g}</span>`).join('')}</div>` : ''}
                    <p class="show-summary">${show.summary ? this.stripHtml(show.summary).substring(0, 150) + '...' : 'No summary available'}</p>
                </div>
            </div>
        `).join('');
    }

    trackShowView(showId) {
        const show = this.currentShows.find(s => s.id === showId);
        if (show && !this.userData.showsViewed.includes(showId)) {
            this.userData.showsViewed.push(showId);
            this.userData.showsViewed = [...new Set(this.userData.showsViewed)]; // Remove duplicates
            this.saveUserData();
        }
    }

    addToSearchHistory(term) {
        this.userData.searchHistory.unshift(term);
        this.userData.searchHistory = [...new Set(this.userData.searchHistory.slice(0, 10))]; // Keep top 10 unique
        this.saveUserData();
    }

    showLoading(show = true) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('showsGrid').style.display = show ? 'none' : 'grid';
        document.getElementById('noResults').style.display = 'none';
    }

    showError(message) {
        const grid = document.getElementById('showsGrid');
        grid.innerHTML = `<div class="show-card"><div class="show-content"><h3>Error</h3><p>${message}</p></div></div>`;
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    saveUserData() {
        localStorage.setItem('tvShowsUserData', JSON.stringify(this.userData));
    }

    loadUserData() {
        try {
            const data = localStorage.getItem('tvShowsUserData');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading user data:', error);
            return {};
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TVShowsApp();
});