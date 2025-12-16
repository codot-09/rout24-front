const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const API_BASE = 'https://api.rout24.online';

const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

const DOM = {
    fromFilter: document.getElementById('fromFilter'),
    toFilter: document.getElementById('toFilter'),
    minPrice: document.getElementById('minPrice'),
    maxPrice: document.getElementById('maxPrice'),
    searchBtn: document.getElementById('searchBtn'),
    filterToggle: document.getElementById('filterToggle'),
    searchCard: document.getElementById('searchCard'),
    routesList: document.getElementById('routesList'),
    emptyState: document.getElementById('emptyState'),
    bannersBox: document.getElementById('banners')
};

function populateRegions() {
    const fragmentFrom = document.createDocumentFragment();
    const fragmentTo = document.createDocumentFragment();

    REGIONS.forEach(r => {
        const label = r.charAt(0) + r.slice(1).toLowerCase();
        const option = new Option(label, r);
        fragmentFrom.appendChild(option.cloneNode(true));
        fragmentTo.appendChild(option);
    });

    DOM.fromFilter.appendChild(fragmentFrom);
    DOM.toFilter.appendChild(fragmentTo);
}
populateRegions();

DOM.filterToggle.addEventListener('click', () => {
    const isOpen = DOM.searchCard.classList.toggle('show');
    DOM.filterToggle.setAttribute('aria-expanded', isOpen);
    DOM.searchCard.hidden = !isOpen;
});

async function authFetch(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (res.status === 401) {
            location.href = '/login';
            throw new Error('Autentifikatsiya xatosi');
        }

        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(`Server xatosi: ${res.status} - ${errorBody.message || res.statusText}`);
        }
        return res.json();
    } catch (error) {
        console.error('AuthFetch xatosi:', error);
        throw error;
    }
}

function showLoading() {
    DOM.routesList.innerHTML = `<div class="loading">Yuklanmoqda...</div>`;
    DOM.emptyState.hidden = true;
}

function clearRoutes() {
    DOM.routesList.innerHTML = '';
}

function renderRouteCard(route) {
    const price = route.price ? route.price.toLocaleString('uz-UZ') + ' so‘m' : 'Kelishilgan narx';
    const imageUrl = route.coverImage || '/assets/default-route-cover.jpg';

    return `
        <article class="route-card-search" onclick="openRoute('${route.id}')" role="button" tabindex="0">
            <div class="route-image-container">
                <img src="${imageUrl}" alt="${route.from} dan ${route.to} ga" loading="lazy">
            </div>
            <div class="route-card-content">
                <div class="route-direction">
                    <span class="route-from">${route.from}</span>
                    <svg class="arrow" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    <span class="route-to">${route.to}</span>
                </div>
            </div>
            <div class="route-price-tag">
                ${price}
            </div>
        </article>
    `;
}

function openRoute(id) {
    location.href = `/route/credentials?id=${id}`;
}

async function loadRoutes(withFilters = false) {
    showLoading();

    const params = new URLSearchParams({ page: 0, size: 30 });
    if (withFilters) {
        if (DOM.fromFilter.value) params.set('from', DOM.fromFilter.value);
        if (DOM.toFilter.value) params.set('to', DOM.toFilter.value);
        if (DOM.minPrice.value) params.set('minprice', DOM.minPrice.value);
        if (DOM.maxPrice.value) params.set('maxprice', DOM.maxPrice.value);
    }

    try {
        const res = await authFetch(`${API_BASE}/routes/search?${params}`);
        clearRoutes();

        if (!res.success || !res.data?.content?.length) {
            DOM.emptyState.hidden = false;
            return;
        }

        DOM.emptyState.hidden = true;
        DOM.routesList.innerHTML = res.data.content.map(renderRouteCard).join('');
    } catch {
        clearRoutes();
        DOM.emptyState.hidden = false;
    }
}

async function loadBanners() {
    try {
        const res = await authFetch(`${API_BASE}/banners`);
        if (!res.success || !res.data?.length) return;

        let index = 0;
        const banners = res.data;
        const total = banners.length;

        DOM.bannersBox.innerHTML = `
            <div class="banner-track">
                ${banners.map(b =>
                    `<div class="banner-slide" data-id="${b.id}">
                        <img src="${b.coverImage}" alt="Banner" loading="lazy">
                    </div>`
                ).join('')}
            </div>
            <div class="banner-dots">
                ${banners.map((_, i) =>
                    `<span class="banner-dot ${i === 0 ? 'active' : ''}"></span>`
                ).join('')}
            </div>
        `;

        const track = DOM.bannersBox.querySelector('.banner-track');
        const dots = DOM.bannersBox.querySelectorAll('.banner-dot');

        const update = () => {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        };

        setInterval(() => {
            index = (index + 1) % total;
            update();
        }, 4000);

        let startX = 0;
        let isSwiping = false;

        DOM.bannersBox.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            isSwiping = true;
        });
        
        DOM.bannersBox.addEventListener('touchmove', () => {});

        DOM.bannersBox.addEventListener('touchend', e => {
            if (!isSwiping) return;
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                index = diff > 0 ? (index + 1) % total : (index - 1 + total) % total;
                update();
            }
            isSwiping = false;
        });

        DOM.bannersBox.querySelectorAll('.banner-slide').forEach(slide => {
            slide.addEventListener('click', () => {
                if (!isSwiping) {
                    const id = slide.getAttribute('data-id');
                    if (id) window.location.href = `/banner/${id}`;
                }
            });
        });

    } catch (err) {
        console.error(err);
    }
}

DOM.searchBtn.addEventListener('click', () => loadRoutes(true));
[DOM.minPrice, DOM.maxPrice].forEach(i => i.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadRoutes(true);
}));

document.addEventListener('DOMContentLoaded', () => {
    DOM.searchCard.hidden = true;
    loadRoutes(false);
    loadBanners();
});