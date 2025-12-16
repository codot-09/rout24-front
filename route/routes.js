const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
    throw new Error('Token topilmadi');
}

const API_BASE = 'https://api.rout24.online';

const DOM = {
    routesList: document.getElementById('routesList'),
    emptyState: document.getElementById('emptyState'),
    fromFilter: document.getElementById('fromFilter'),
    toFilter: document.getElementById('toFilter'),
    clearFilter: document.getElementById('clearFilter'),
    pageInfo: document.getElementById('pageInfo'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage')
};

const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

const USER_ROLE = localStorage.getItem('role');
let currentPage = 0;
let totalPages = 0;

function populateRegions() {
    const fragmentFrom = document.createDocumentFragment();
    const fragmentTo = document.createDocumentFragment();

    REGIONS.forEach(region => {
        const formatted = region.charAt(0) + region.slice(1).toLowerCase();
        const option = new Option(formatted, region);
        fragmentFrom.appendChild(option.cloneNode(true));
        fragmentTo.appendChild(option);
    });

    DOM.fromFilter.appendChild(fragmentFrom);
    DOM.toFilter.appendChild(fragmentTo);
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
}

populateRegions();

async function authFetch(url, options = {}) {
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server xatosi: ${response.status} - ${errorText || response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('AuthFetch xatosi:', error);
        throw error;
    }
}

function renderRouteCard(route) {
    const dep = route.departureDate ? new Date(route.departureDate) : null;
    const dateStr = dep ? dep.toLocaleDateString('uz-UZ', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'long' 
    }) : 'Sana noma\'lum';
    const timeStr = dep ? dep.toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }) : '';

    const isDriver = USER_ROLE === 'driver';
    
    const deleteBtn = isDriver 
        ? `<button class="delete-btn" onclick="finishRoute('${route.id}', event)" aria-label="Reysni tugatish">
             <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
           </button>`
        : '';

    return `
        <article class="route-card-modern" onclick="viewDetails('${route.id}')" role="button" tabindex="0">
            <div class="route-image">
                <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" alt="Reys rasmi" loading="lazy">
                <div class="route-price">${route.price.toLocaleString('uz-UZ')} so'm</div>
            </div>
            <div class="route-content">
                <h3>${route.from} → ${route.to}</h3>
                <div class="route-meta">
                    <div class="meta-item">
                        <svg viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg>
                        <span>${dateStr}</span>
                    </div>
                    <div class="meta-item">
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        <span>${timeStr}</span>
                    </div>
                </div>
            </div>
            ${deleteBtn}
        </article>
    `;
}

window.finishRoute = async function(routeId, event) {
    if (event) event.stopPropagation();
    
    if (!confirm('Bu reysni tugatishni xohlaysizmi?')) return;

    try {
        const result = await authFetch(`${API_BASE}/routes/finish/${routeId}`, { 
            method: 'PATCH' 
        });
        
        if (result.success) {
            await loadRoutes();
        } else {
            throw new Error(result.message || 'Noma\'lum xatolik');
        }
    } catch (err) {
        console.error('Reysni tugatishda xatolik:', err);
        alert('Reysni tugatishda xatolik yuz berdi: ' + err.message);
    }
}

window.viewDetails = function(routeId) {
    window.location.href = `/route/credentials?id=${routeId}`;
}

async function loadRoutes(page = 0) {
    DOM.routesList.innerHTML = `<div class="loading">Yuklanmoqda...</div>`;
    DOM.emptyState.hidden = true;

    const params = new URLSearchParams();
    if (DOM.fromFilter.value) params.set('from', DOM.fromFilter.value);
    if (DOM.toFilter.value) params.set('to', DOM.toFilter.value);
    params.set('page', page);
    params.set('size', 10);

    const url = `${API_BASE}/routes/my-routes?${params}`;

    try {
        const result = await authFetch(url);

        if (!result.success || !result.data || !Array.isArray(result.data.content)) {
            throw new Error('Serverdan noto\'g\'ri ma\'lumot formati keldi');
        }

        const routes = result.data.content;
        currentPage = result.data.pageNumber;
        totalPages = result.data.totalPages;

        updatePagination();

        if (routes.length === 0) {
            DOM.routesList.innerHTML = '';
            DOM.emptyState.hidden = false;
        } else {
            DOM.routesList.innerHTML = routes.map(renderRouteCard).join('');
        }
    } catch (err) {
        console.error('Reyslarni yuklashda xatolik:', err);
        DOM.routesList.innerHTML = `<div class="error-message">Ma'lumotlarni yuklashda xatolik yuz berdi: ${err.message}</div>`;
        DOM.emptyState.hidden = true;
    }
}

function updatePagination() {
    if (DOM.pageInfo) {
        DOM.pageInfo.textContent = `Sahifa ${currentPage + 1} / ${totalPages || 1}`;
    }
    if (DOM.prevPage) {
        DOM.prevPage.disabled = currentPage === 0;
    }
    if (DOM.nextPage) {
        DOM.nextPage.disabled = currentPage >= totalPages - 1;
    }
}

DOM.clearFilter.addEventListener('click', () => {
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
    currentPage = 0;
    loadRoutes();
});

DOM.fromFilter.addEventListener('change', () => {
    currentPage = 0;
    loadRoutes();
});

DOM.toFilter.addEventListener('change', () => {
    currentPage = 0;
    loadRoutes();
});

if (DOM.prevPage) {
    DOM.prevPage.addEventListener('click', () => {
        if (currentPage > 0) {
            loadRoutes(currentPage - 1);
        }
    });
}

if (DOM.nextPage) {
    DOM.nextPage.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            loadRoutes(currentPage + 1);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => loadRoutes());