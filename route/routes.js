// Token tekshiruvi – yo‘q bo‘lsa login sahifasiga yo‘naltirish
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// API base URL
const API_BASE = 'https://api.rout24.online';

// DOM elementlar
const routesList   = document.getElementById('routesList');
const emptyState   = document.getElementById('emptyState');
const fromFilter   = document.getElementById('fromFilter');
const toFilter     = document.getElementById('toFilter');
const clearFilter  = document.getElementById('clearFilter');

// Viloyatlar ro‘yxati
const regions = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

// Viloyatlarni selectlarga to‘ldirish
function populateRegions() {
    regions.forEach(region => {
        const formatted = region.charAt(0) + region.slice(1).toLowerCase()
            .replace('qalpog‘iston', 'qalpog‘iston'); // agar kerak bo‘lsa to‘g‘rilash

        const optionFrom = new Option(formatted, region);
        const optionTo   = new Option(formatted, region);

        fromFilter.add(optionFrom);
        toFilter.add(optionTo);
    });

    // Default: barcha reyslar ko‘rsatilsin
    fromFilter.value = '';
    toFilter.value = '';
}
populateRegions();

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

// Reys kartasini yaratish
function renderRouteCard(route) {
    const departure = new Date(route.departureDate);

    const dateStr = departure.toLocaleDateString('uz-UZ', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const timeStr = departure.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusClass = route.finished ? 'finished' : 'active';
    const statusText  = route.finished ? 'Yakunlangan' : 'Faol';

    return `
        <article class="route-card" onclick="viewDetails('${route.id}')" role="button" tabindex="0" aria-label="Reys tafsilotlari">
            <header class="route-header">
                <h3>${route.from} → ${route.to}</h3>
                <div class="price">${route.price.toLocaleString('uz-UZ')} so‘m</div>
            </header>
            <div class="route-body">
                <div class="route-info">
                    <div class="info-item">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>
                        <span>${dateStr}</span>
                    </div>
                    <div class="info-item">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        <span>${timeStr}</span>
                    </div>
                </div>
                <footer class="route-footer">
                    <div class="seats">${route.seatsCount} o‘rin</div>
                    <div class="status ${statusClass}">${statusText}</div>
                </footer>
            </div>
        </article>
    `;
}

// Reys tafsilotlariga o‘tish
function viewDetails(routeId) {
    window.location.href = `/route/credentials?id=${routeId}`;
}

// Reyslarni yuklash (filtr bilan)
async function loadRoutes() {
    // Yuklanmoqda holati (ixtiyoriy – CSS da loading spinner qo‘shsa bo‘ladi)
    routesList.innerHTML = `
        <div style="padding:60px 20px;text-align:center;color:var(--text-muted);font-size:16px;">
            Yuklanmoqda...
        </div>
    `;
    emptyState.hidden = true;

    const params = new URLSearchParams();
    if (fromFilter.value) params.set('from', fromFilter.value);
    if (toFilter.value)   params.set('to', toFilter.value);

    const url = `${API_BASE}/routes/my-routes${params.toString() ? `?${params}` : ''}`;

    try {
        const result = await authFetch(url);

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Noto‘g‘ri ma‘lumot formati');
        }

        const routes = result.data;

        if (routes.length === 0) {
            routesList.innerHTML = '';
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        routesList.innerHTML = routes.map(renderRouteCard).join('');

    } catch (error) {
        console.error('Reyslar yuklanmadi:', error);
        routesList.innerHTML = '';
        emptyState.hidden = false;
        // Empty state ichidagi matnni o‘zgartirish mumkin, lekin HTML da allaqachon bor
    }
}

// Filtrlarni tozalash
clearFilter.addEventListener('click', () => {
    fromFilter.value = '';
    toFilter.value = '';
    loadRoutes();
});

// Filter o‘zgarishida avto-qidiruv
fromFilter.addEventListener('change', loadRoutes);
toFilter.addEventListener('change', loadRoutes);

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
});