/* AUTH CHECK */
const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

/* CONSTANTS */
const API_BASE = 'https://api.rout24.online';
const regions = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

/* ELEMENTS */
const fromFilter = document.getElementById('fromFilter');
const toFilter = document.getElementById('toFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const routesList = document.getElementById('routesList');
const emptyState = document.getElementById('emptyState');
const searchCard = document.getElementById('searchCard');
const bannersBox = document.getElementById('banners');

/* INIT REGIONS */
regions.forEach(r => {
    const text = r.charAt(0) + r.slice(1).toLowerCase();
    fromFilter.add(new Option(text, r));
    toFilter.add(new Option(text, r));
});

/* TOGGLE FILTER CARD */
document.getElementById('filterToggle').onclick = () => {
    searchCard.classList.toggle('show');
};

/* LOADERS */
function showLoading() {
    routesList.innerHTML = `
        <div style="padding:20px;text-align:center;color:#64748b;font-size:16px;">
            Yuklanmoqda...
        </div>
    `;
}

function clearLoading() {
    routesList.innerHTML = '';
}

/* FETCH HELPERS */
async function apiGet(url) {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Server xatosi");
    return res.json();
}

/* RENDER ROUTE CARD */
function renderRouteCard(route) {
    const date = new Date(route.departureDate).toLocaleString('uz-UZ', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="route" onclick="location.href='route-credentials.html?id=${route.id}'">
            <div class="route-header">
                <h3>${route.from} → ${route.to}</h3>
                <p>${date}</p>
            </div>

            <div class="route-body">
                <div class="route-info">
                    <div><strong>Narx:</strong> ${route.price.toLocaleString()} so‘m</div>
                    <div><strong>O‘rin:</strong> ${route.seatsCount} ta</div>
                </div>

                <div class="route-footer">
                    <div class="price">${route.price.toLocaleString()} so‘m</div>
                    <div class="seats">${route.seatsCount} joy</div>
                </div>
            </div>
        </div>
    `;
}

/* LOAD ROUTES */
async function loadRoutes() {
    showLoading();

    const params = new URLSearchParams({
        page: 0,
        size: 30
    });

    if (fromFilter.value) params.append('from', fromFilter.value);
    if (toFilter.value) params.append('to', toFilter.value);
    if (minPrice.value) params.append('minprice', minPrice.value);
    if (maxPrice.value) params.append('maxprice', maxPrice.value);

    try {
        const { success, data } = await apiGet(`${API_BASE}/routes/search?${params}`);
        
        clearLoading();

        if (!success || !data?.content?.length) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        routesList.innerHTML = data.content.map(renderRouteCard).join('');

    } catch (err) {
        clearLoading();
        emptyState.textContent = 'Xatolik. Iltimos qayta urinib ko‘ring.';
        emptyState.style.display = 'block';
    }
}

/* LOAD BANNERS */
async function loadBanners() {
    try {
        const { success, data } = await apiGet(`${API_BASE}/banners`);

        if (success && data?.length) {
            bannersBox.innerHTML = data
                .map(b => `<img src="${b.coverImage}" alt="Banner">`)
                .join('');
        }

    } catch {
        console.log("Banner yuklab bo‘lmadi");
    }
}

/* EVENTS */
document.getElementById('searchBtn').onclick = loadRoutes;

/* INITIAL DATA */
loadRoutes();
loadBanners();
