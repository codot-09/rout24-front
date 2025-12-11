/**
 * @fileoverview Reyslarni qidirish va ko'rsatish uchun asosiy skript.
 * Sahifaning yuklanishi, avtorizatsiya nazorati, filtrlarni initsializatsiya qilish,
 * reyslarni va bannerlarni API dan yuklashni boshqaradi.
 */

// --- KONSTANTALAR VA KONFIGURATSIYA ---
const API_BASE_URL = 'https://api.rout24.online';
const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

// --- DOM ELEMENTLARINI TANLASH ---
const DOM = {
    fromFilter: document.getElementById('fromFilter'),
    toFilter: document.getElementById('toFilter'),
    minPrice: document.getElementById('minPrice'),
    maxPrice: document.getElementById('maxPrice'),
    searchCard: document.getElementById('searchCard'),
    filterToggle: document.getElementById('filterToggle'),
    searchBtn: document.getElementById('searchBtn'),
    routesList: document.getElementById('routesList'),
    emptyState: document.getElementById('emptyState'),
    bannersContainer: document.getElementById('banners'),
};

// --- AVTORIZATSIYA ---
const token = localStorage.getItem('token');
if (!token) {
    location.href = 'login.html';
}

/**
 * Viloyatlar ro'yxatini From va To filtrlari uchun yuklaydi.
 */
function initializeFilters() {
    REGIONS.forEach(region => {
        // "TOSHKENT" -> "Toshkent" formatiga o'tkazish
        const formattedRegion = region[0] + region.slice(1).toLowerCase();
        
        // "From" filtri
        const optionFrom = new Option(formattedRegion, region);
        DOM.fromFilter.add(optionFrom.cloneNode(true)); // cloneNode(true) bilan nusxa olindi
        
        // "To" filtri
        const optionTo = new Option(formattedRegion, region);
        DOM.toFilter.add(optionTo);
    });

    // Filtrlash panelini ochish/yopish funksiyasi
    DOM.filterToggle.onclick = () => {
        DOM.searchCard.classList.toggle('show');
        const isShow = DOM.searchCard.classList.contains('show');
        DOM.filterToggle.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg> 
            ${isShow ? 'Yopish' : 'Filtrlar'}
        `;
    };
}

/**
 * Olingan reyslar ro'yxatini DOM'ga render qiladi.
 * @param {Array<Object>} routes - Reyslar ma'lumotlari massivi.
 */
function renderRoutes(routes) {
    if (!routes || routes.length === 0) {
        DOM.routesList.innerHTML = '';
        DOM.emptyState.textContent = 'Afsuski, bu filtrlarga mos reyslar topilmadi.';
        DOM.emptyState.style.display = 'block';
        return;
    }

    DOM.emptyState.style.display = 'none';

    DOM.routesList.innerHTML = routes.map(r => {
        const departureTime = new Date(r.departureDate).toLocaleString('uz-UZ', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // ESLATMA: Route Credentials url o'zgartirildi
        return `
            <div class="route" onclick="location.href='${API_BASE_URL}/route/credentials/${r.id}'">
                <div class="route-header">
                    <h3>${r.from} &rarr; ${r.to}</h3>
                    <p>${departureTime}</p>
                </div>
                <div class="route-body">
                    <div class="route-info">
                        <div><strong>Narx:</strong> ${r.price.toLocaleString('uz-UZ')} so‘m</div>
                        <div><strong>O‘rin:</strong> ${r.seatsCount} ta</div>
                    </div>
                </div>
                <div class="route-footer">
                    <div class="price">${r.price.toLocaleString('uz-UZ')} so‘m</div>
                    <div class="seats">${r.seatsCount} joy</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Reyslarni API dan yuklaydi va natijalarni render qiladi.
 */
async function loadRoutes() {
    DOM.emptyState.textContent = 'Yuklanmoqda...';
    DOM.emptyState.style.display = 'block';
    DOM.routesList.innerHTML = '';

    const params = new URLSearchParams();
    
    // Filtrlarni paramsga qo'shish
    if (DOM.fromFilter.value) params.append('from', DOM.fromFilter.value);
    if (DOM.toFilter.value) params.append('to', DOM.toFilter.value);
    if (DOM.minPrice.value) params.append('minprice', DOM.minPrice.value);
    if (DOM.maxPrice.value) params.append('maxprice', DOM.maxPrice.value);

    // Pagination
    params.append('page', 0);
    params.append('size', 30);

    try {
        const response = await fetch(`${API_BASE_URL}/routes/search?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const { success, data } = await response.json();

        if (success && data?.content) {
            renderRoutes(data.content);
        } else {
            renderRoutes([]); // Ma'lumot yo'q yoki API xato berdi
        }
    } catch (error) {
        console.error("Reyslarni yuklashda xatolik:", error);
        DOM.emptyState.textContent = 'Tarmoq xatoligi yoki serverga ulanishda muammo yuz berdi.';
        DOM.emptyState.style.display = 'block';
    }
}

/**
 * Bannerlarni API dan yuklaydi va DOM'ga render qiladi.
 */
async function loadBanners() {
    try {
        const response = await fetch(`${API_BASE_URL}/banners`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const { success, data } = await response.json();

        if (success && data?.length) {
            DOM.bannersContainer.innerHTML = data.map(b => 
                `<div class="banners"><img src="${b.coverImage}" alt="Banner rasmi"></div>`
            ).join('');
        }
    } catch (error) {
        console.error("Bannerlarni yuklashda xatolik:", error);
        // Bannerlar yuklanmasa ham, asosiy sahifa ishlashda davom etadi
    }
}

// --- INISIALIZATSIYA ---
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    
    // Tugmalarni bog'lash
    DOM.searchBtn.onclick = loadRoutes;
    
    // Dastlabki yuklash
    loadRoutes();
    loadBanners();
});