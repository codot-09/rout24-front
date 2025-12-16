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
    clearFilter: document.getElementById('clearFilter')
};

const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

const USER_ROLE = localStorage.getItem('role');

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
    
    const deleteBtn =  
         `<button class="delete-btn" onclick="finishRoute('${route.id}', event)" aria-label="Reysni tugatish">
             <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
           </button>`;

    return `
        <article class="route-card-modern" onclick="viewDetails('${route.id}')" role="button" tabindex="0">
            <div class="route-image">
                <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" alt="Reys rasmi" loading="lazy">
                <div class="route-price">${route.price.toLocaleString('uz-UZ')} so'm</div>
            </div>
            <div class="route-content">
                <h3>${route.from} → ${route.to}</h3>
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

async function loadRoutes() {
    DOM.routesList.innerHTML = `<div class="loading">Yuklanmoqda...</div>`;
    DOM.emptyState.hidden = true;

    const params = new URLSearchParams();
    if (DOM.fromFilter.value) params.set('from', DOM.fromFilter.value);
    if (DOM.toFilter.value) params.set('to', DOM.toFilter.value);

    const paramString = params.toString() ? '?' + params : '';
    const url = `${API_BASE}/routes/my-routes${paramString}`;

    try {
        const result = await authFetch(url);

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Serverdan noto\'g\'ri ma\'lumot formati keldi');
        }

        const routes = result.data;

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

DOM.clearFilter.addEventListener('click', () => {
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
    loadRoutes();
});

DOM.fromFilter.addEventListener('change', loadRoutes);
DOM.toFilter.addEventListener('change', loadRoutes);

document.addEventListener('DOMContentLoaded', loadRoutes);