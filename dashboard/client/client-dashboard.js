const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const API_BASE = 'https://api.rout24.online';

const regions = [
    "TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO",
    "XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON",
    "ANDIJON","NAMANGAN","FARGONA"
];

const fromFilter   = document.getElementById('fromFilter');
const toFilter     = document.getElementById('toFilter');
const minPrice     = document.getElementById('minPrice');
const maxPrice     = document.getElementById('maxPrice');
const searchBtn    = document.getElementById('searchBtn');
const filterToggle = document.getElementById('filterToggle');
const searchCard   = document.getElementById('searchCard');
const routesList   = document.getElementById('routesList');
const emptyState   = document.getElementById('emptyState');
const bannersBox   = document.getElementById('banners');

function populateRegions() {
    regions.forEach(r => {
        const label = r.charAt(0) + r.slice(1).toLowerCase();
        fromFilter.add(new Option(label, r));
        toFilter.add(new Option(label, r));
    });
}
populateRegions();

// Filter toggle
filterToggle.addEventListener('click', () => {
    const isOpen = searchCard.classList.toggle('show');
    filterToggle.setAttribute('aria-expanded', isOpen);
    searchCard.hidden = !isOpen;
});

async function authFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
}

function showLoading() {
    routesList.innerHTML = `<div style="padding:40px;text-align:center;color:#999">Yuklanmoqda...</div>`;
    emptyState.hidden = true;
}

function clearRoutes() {
    routesList.innerHTML = '';
}

function renderRouteCard(route) {
    const date = new Date(route.departureDate).toLocaleString('uz-UZ', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    return `
        <article class="route" onclick="openRoute('${route.id}')">
            <header class="route-header">
                <h3>${route.from} → ${route.to}</h3>
                <p>${date}</p>
            </header>
            <div class="route-body">
                <div>${route.price.toLocaleString('uz-UZ')} so‘m</div>
                <div>${route.seatsCount} joy</div>
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
        if (fromFilter.value) params.set('from', fromFilter.value);
        if (toFilter.value) params.set('to', toFilter.value);
        if (minPrice.value) params.set('minprice', minPrice.value);
        if (maxPrice.value) params.set('maxprice', maxPrice.value);
    }

    try {
        const res = await authFetch(`${API_BASE}/routes/search?${params}`);
        clearRoutes();

        if (!res.success || !res.data?.content?.length) {
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        routesList.innerHTML = res.data.content.map(renderRouteCard).join('');
    } catch {
        clearRoutes();
        emptyState.hidden = false;
    }
}

async function loadBanners() {
    try {
        const res = await authFetch(`${API_BASE}/banners`);
        if (!res.success || !res.data?.length) return;

        let index = 0;

        bannersBox.innerHTML = `
            <div class="banner-track">
                ${res.data.map(b =>
                    `<div class="banner-slide" data-id="${b.id}">
                        <img src="${b.coverImage}" loading="lazy">
                    </div>`
                ).join('')}
            </div>
            <div class="banner-dots">
                ${res.data.map((_, i) =>
                    `<span class="banner-dot ${i === 0 ? 'active' : ''}"></span>`
                ).join('')}
            </div>
        `;

        const track = bannersBox.querySelector('.banner-track');
        const dots = bannersBox.querySelectorAll('.banner-dot');
        const total = dots.length;

        const update = () => {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        };

        // Auto-slide
        setInterval(() => {
            index = (index + 1) % total;
            update();
        }, 4000);

        // Touch swipe
        let startX = 0;
        bannersBox.addEventListener('touchstart', e => startX = e.touches[0].clientX);
        bannersBox.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                index = diff > 0 ? (index + 1) % total : (index - 1 + total) % total;
                update();
            }
        });

        // Click on banner -> go to /banner/{id}
        bannersBox.querySelectorAll('.banner-slide').forEach(slide => {
            slide.addEventListener('click', () => {
                const id = slide.getAttribute('data-id');
                if (id) window.location.href = `/banner/${id}`;
            });
        });

    } catch (err) {
        console.error(err);
    }
}

searchBtn.addEventListener('click', () => loadRoutes(true));
[minPrice, maxPrice].forEach(i => i.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadRoutes(true);
}));

document.addEventListener('DOMContentLoaded', () => {
    searchCard.hidden = true;
    loadRoutes(false);
    loadBanners();
});
