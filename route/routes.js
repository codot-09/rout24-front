const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
    throw new Error('No token');
}

const API_BASE = 'https://api.rout24.online';

const DOM = {
    routesList: document.getElementById('routesList'),
    emptyState: document.getElementById('emptyState'),
    fromFilter: document.getElementById('fromFilter'),
    toFilter: document.getElementById('toFilter'),
    clearFilter: document.getElementById('clearFilter'),
};

const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

const USER_ROLE = localStorage.getItem('role');

function populateRegions() {
    const f1 = document.createDocumentFragment();
    const f2 = document.createDocumentFragment();

    REGIONS.forEach(r => {
        const label = r.charAt(0) + r.slice(1).toLowerCase();
        const opt = new Option(label, r);
        f1.appendChild(opt.cloneNode(true));
        f2.appendChild(opt);
    });

    DOM.fromFilter.appendChild(f1);
    DOM.toFilter.appendChild(f2);
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
}
populateRegions();

async function authFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

function renderRouteCard(route) {
    const isDriver = USER_ROLE === 'driver';

    const finishBtn = isDriver
        ? `<button class="delete-btn" onclick="finishRoute('${route.id}', event)">
                <svg viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7"/>
                </svg>
           </button>`
        : '';

    return `
        <article class="route-card-modern" onclick="viewDetails('${route.id}')">
            <div class="route-image">
                <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" loading="lazy">
                <div class="route-price">${route.price.toLocaleString('uz-UZ')} so‘m</div>
            </div>
            <div class="route-content">
                <h3>${route.from} → ${route.to}</h3>
            </div>
            ${finishBtn}
        </article>
    `;
}

window.finishRoute = async function (routeId, event) {
    event.stopPropagation();
    if (!confirm('Reysni yakunlashni xohlaysizmi?')) return;
    await authFetch(`${API_BASE}/routes/finish/${routeId}`, { method: 'PATCH' });
    loadRoutes();
};

window.viewDetails = function (routeId) {
    window.location.href = `/route/credentials?id=${routeId}`;
};

async function loadRoutes() {
    DOM.routesList.innerHTML = `<div class="loading">Yuklanmoqda...</div>`;
    DOM.emptyState.hidden = true;

    const params = new URLSearchParams();
    if (DOM.fromFilter.value) params.set('from', DOM.fromFilter.value);
    if (DOM.toFilter.value) params.set('to', DOM.toFilter.value);

    const url = `${API_BASE}/routes/my-routes${params.toString() ? '?' + params : ''}`;

    const res = await authFetch(url);

    const content = res?.data?.content || [];

    if (!content.length) {
        DOM.routesList.innerHTML = '';
        DOM.emptyState.hidden = false;
        return;
    }

    DOM.routesList.innerHTML = content.map(renderRouteCard).join('');
}

DOM.clearFilter.addEventListener('click', () => {
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
    loadRoutes();
});

DOM.fromFilter.addEventListener('change', loadRoutes);
DOM.toFilter.addEventListener('change', loadRoutes);

document.addEventListener('DOMContentLoaded', loadRoutes);
