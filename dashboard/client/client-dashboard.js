// Token tekshiruvi – yo‘q bo‘lsa login sahifasiga yo‘naltirish
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// API base URL
const API_BASE = 'https://api.rout24.online';

// Viloyatlar ro‘yxati (API bilan mos)
const regions = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

// DOM elementlar
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

// Viloyatlarni selectlarga to‘ldirish
function populateRegions() {
    regions.forEach(region => {
        const formatted = region.charAt(0) + region.slice(1).toLowerCase();
        const optionFrom = new Option(formatted, region);
        const optionTo   = new Option(formatted, region);

        fromFilter.add(optionFrom);
        toFilter.add(optionTo);
    });

    // Default: Toshkentdan boshlash (foydalanuvchi uchun qulay)
    fromFilter.value = 'TOSHKENT';
}
populateRegions();

// Filter panelni ochish/yopish
filterToggle.addEventListener('click', () => {
    const isShown = searchCard.classList.toggle('show');
    filterToggle.setAttribute('aria-expanded', isShown);
});

// Umumiy authenticated fetch helper
async function authFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
    }

    return response.json();
}

// Yuklanmoqda holati
function showLoading() {
    routesList.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:16px;">
            Yuklanmoqda...
        </div>
    `;
    emptyState.hidden = true;
}

function clearRoutes() {
    routesList.innerHTML = '';
}

// Reys kartasini yaratish
function renderRouteCard(route) {
    const departure = new Date(route.departureDate);
    const formattedDate = departure.toLocaleString('uz-UZ', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');

    return `
        <article class="route" onclick="openRoute('${route.id}')" role="button" tabindex="0" aria-label="Reys tafsilotlari">
            <header class="route-header">
                <h3>${route.from} → ${route.to}</h3>
                <p>${formattedDate}</p>
            </header>
            <div class="route-body">
                <div class="route-info">
                    <div><strong>Narx:</strong> ${route.price.toLocaleString('uz-UZ')} so‘m</div>
                    <div><strong>O‘rinlar:</strong> ${route.seatsCount} ta</div>
                </div>
                <footer class="route-footer">
                    <div class="price">${route.price.toLocaleString('uz-UZ')} so‘m</div>
                    <div class="seats">${route.seatsCount} joy bo‘sh</div>
                </footer>
            </div>
        </article>
    `;
}

// Reys tafsilotlariga o‘tish
function openRoute(id) {
    window.location.href = `https://rout24.online/route/credentials?id=${id}`;
}

// Reyslarni yuklash
async function loadRoutes() {
    showLoading();

    const params = new URLSearchParams({
        page: 0,
        size: 30
    });

    if (fromFilter.value)   params.set('from', fromFilter.value);
    if (toFilter.value)     params.set('to', toFilter.value);
    if (minPrice.value)     params.set('minprice', minPrice.value);
    if (maxPrice.value)     params.set('maxprice', maxPrice.value);

    try {
        const result = await authFetch(`${API_BASE}/routes/search?${params}`);

        clearRoutes();

        if (!result.success || !result.data?.content?.length) {
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        routesList.innerHTML = result.data.content
            .map(renderRouteCard)
            .join('');

    } catch (error) {
        console.error('Reyslar yuklanmadi:', error);
        clearRoutes();
        emptyState.querySelector('p')?.remove(); // agar oldin o‘zgartirilgan bo‘lsa
        emptyState.innerHTML = `
            <svg viewBox="0 0 120 120" class="empty-icon" aria-hidden="true">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="4"/>
                <path d="M40 60L80 60" stroke="var(--border)" stroke-width="6" stroke-linecap="round"/>
            </svg>
            <p>Xatolik yuz berdi</p>
            <span>Internetni tekshiring va qayta urinib ko‘ring</span>
        `;
        emptyState.hidden = false;
    }
}

// Bannerlarni yuklash
async function loadBanners() {
    try {
        const result = await authFetch(`${API_BASE}/banners`);

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            bannersBox.innerHTML = result.data
                .map(banner => `
                    <img src="${banner.coverImage || ''}" alt="Reklama banneri" loading="lazy">
                `)
                .join('');
        }
    } catch (error) {
        console.error('Bannerlar yuklanmadi:', error);
        // Banner muhim emas – jim ishlayveradi
    }
}

// Event listeners
searchBtn.addEventListener('click', loadRoutes);

// Enter tugmasi bilan qidirish (inputlarda)
[minPrice, maxPrice].forEach(input => {
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') loadRoutes();
    });
});

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
    loadBanners();
});