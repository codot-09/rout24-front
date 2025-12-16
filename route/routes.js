// Token va Baza URL
const token = localStorage.getItem('token');
if (!token) {
    // Optimallashtirish: Kirishga yo'naltirishdan oldin funksiyadan chiqish
    window.location.href = '/login';
    // Kodning davom etishini oldini oladi
    throw new Error('Token topilmadi. Kirish sahifasiga yo‘naltirilmoqda.');
}

const API_BASE = 'https://api.rout24.online';

// DOM Elementlarini olish (QuerySelector barcha elementlar uchun umumiy)
const DOM = {
    routesList:  document.getElementById('routesList'),
    emptyState:  document.getElementById('emptyState'),
    fromFilter:  document.getElementById('fromFilter'),
    toFilter:    document.getElementById('toFilter'),
    clearFilter: document.getElementById('clearFilter'),
};

// Viloyatlar (Const qolishi yaxshiroq)
const REGIONS = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

const USER_ROLE = localStorage.getItem('role'); // "driver" yoki boshqa

/**
 * Viloyatlar ro'yxatini filtrlash selectlariga joylashtiradi.
 * Optimallashtirish: DocumentFragment dan foydalanish DOM manipulyatsiyasini kamaytiradi.
 */
function populateRegions() {
    const fragmentFrom = document.createDocumentFragment();
    const fragmentTo = document.createDocumentFragment();

    REGIONS.forEach(region => {
        // region.toLowerCase() qilib bitta joyda formatlash.
        const formatted = region.charAt(0) + region.slice(1).toLowerCase();
        
        const option = new Option(formatted, region);
        
        fragmentFrom.appendChild(option.cloneNode(true));
        fragmentTo.appendChild(option);
    });

    DOM.fromFilter.appendChild(fragmentFrom);
    DOM.toFilter.appendChild(fragmentTo);
    
    // Boshlang'ich qiymatni o'rnatish
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
}
populateRegions();

/**
 * Avtorizatsiya headeri bilan fetch so'rovini bajaradi.
 * Optimallashtirish: Xato boshqaruvini markazlashtirish.
 * @param {string} url - API URL.
 * @param {object} options - Fetch options.
 * @returns {Promise<object>} Serverdan kelgan ma'lumot.
 */
async function authFetch(url, options = {}) {
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers, // Boshqa headerni override qilish imkoniyati
            },
        });

        if (!response.ok) {
            // Server xatosini to'g'ri qayta ishlash
            const errorText = await response.text();
            throw new Error(`Server xatosi: ${response.status} - ${errorText || response.statusText}`);
        }
        
        // JSON paringda xatolik bo'lsa ham ushlanadi
        return response.json();
    } catch (error) {
        // Tarmoq yoki boshqa xatoliklarni qayta otish
        console.error('AuthFetch xatosi:', error);
        throw error; // Yuklovchi funksiyada ushlash uchun qayta otiladi
    }
}

/**
 * Reys kartasini HTML formatida qaytaradi.
 * Optimallashtirish: dateStr va timeStr ni ajratib olish (yaxshi o'qilish uchun).
 * @param {object} route - Reys ma'lumotlari.
 * @returns {string} HTML string.
 */
function renderRouteCard(route) {
    const dep = new Date(route.departureDate);
    // Formatlash variantlari
    const dateStr = dep.toLocaleDateString('uz-UZ', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'long' 
    });
    const timeStr = dep.toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const isDriver = USER_ROLE === 'driver';
    
    // Delete tugmasi HTML'i
    const deleteBtn = isDriver 
        ? `<button class="delete-btn" onclick="deleteRoute('${route.id}', event)" aria-label="Reysni o‘chirish">
             <svg viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg>
           </button>`
        : '';

    return `
        <article class="route-card-modern" onclick="viewDetails('${route.id}')" role="button" tabindex="0">
            <div class="route-image">
                <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" alt="Reys rasmi" loading="lazy">
                <div class="route-price">${route.price.toLocaleString('uz-UZ')} so‘m</div>
            </div>
            <div class="route-content">
                <h3>${route.from} → ${route.to}</h3>
                <div class="route-meta">
                    <div class="meta-item">
                        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>
                        <span>${dateStr}</span>
                    </div>
                    <div class="meta-item">
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        <span>${timeStr}</span>
                    </div>
                    <div class="meta-item">
                        <svg viewBox="0 0 24 24"><path d="M14 10h-4v4h4v-4z"/></svg>
                        <span>${route.seatsCount || 'Noma‘lum'} o‘rin</span>
                    </div>
                </div>
            </div>
            ${deleteBtn}
        </article>
    `;
}

/**
 * Reysni o'chiradi va ro'yxatni yangilaydi.
 * Optimallashtirish: Eventni funksiya ichida stop qilish.
 * @param {string} routeId - O'chiriladigan reys ID'si.
 * @param {Event} event - Klik hodisasi (o'chirish tugmasi uchun).
 */
window.deleteRoute = async function(routeId, event) {
    // Event propagation'ni to'xtatish (karta detallarga o'tmasligi uchun)
    if (event) event.stopPropagation();
    
    if (!confirm('Bu reysni o‘chirishni xohlaysizmi?')) return;

    try {
        await authFetch(`${API_BASE}/routes/${routeId}`, { method: 'DELETE' });
        // Muvaffaqiyatli o'chirilgach ro'yxatni yuklash
        await loadRoutes(); 
    } catch (err) {
        console.error('Reysni o‘chirishda xatolik:', err);
        alert('Reysni o‘chirishda xatolik yuz berdi: ' + err.message);
    }
}

/**
 * Reys tafsilotlari sahifasiga o'tish.
 * @param {string} routeId - Reys ID'si.
 */
window.viewDetails = function(routeId) {
    window.location.href = `/route/credentials?id=${routeId}`;
}

/**
 * Filtrlar asosida reyslar ro'yxatini yuklaydi va render qiladi.
 * Optimallashtirish: Async/await va xatolarni yanada aniqroq boshqarish.
 */
async function loadRoutes() {
    DOM.routesList.innerHTML = `<div class="loading">Yuklanmoqda...</div>`;
    DOM.emptyState.hidden = true;

    // URL parametrlari
    const params = new URLSearchParams();
    if (DOM.fromFilter.value) params.set('from', DOM.fromFilter.value);
    if (DOM.toFilter.value)   params.set('to', DOM.toFilter.value);

    // Filter parametrlari bo'lsa "?" qo'shish
    const paramString = params.toString() ? '?' + params : '';
    const url = `${API_BASE}/routes/my-routes${paramString}`;

    try {
        const result = await authFetch(url);

        // Natija tekshiruvi
        if (!result.success || !Array.isArray(result.data)) {
            // API formati o'zgarganda xatolik
            throw new Error('Serverdan noto‘g‘ri ma‘lumot formati keldi.'); 
        }

        const routes = result.data;

        if (routes.length === 0) {
            DOM.routesList.innerHTML = '';
            DOM.emptyState.hidden = false;
        } else {
            // Optimallashtirish: map bilan barcha kartalarni yaratib, join() bilan DOM'ga bir marta yozish.
            DOM.routesList.innerHTML = routes.map(renderRouteCard).join('');
        }
    } catch (err) {
        console.error('Reyslarni yuklashda xatolik:', err);
        DOM.routesList.innerHTML = `<div class="error-message">Ma‘lumotlarni yuklashda xatolik yuz berdi: ${err.message}.</div>`;
        DOM.emptyState.hidden = true; // Error xabari turgani uchun empty state yashirin qolishi kerak.
    }
}

// --- Event Listenerlar ---

/**
 * Filterlarni tozalash va ro'yxatni yangilash.
 */
DOM.clearFilter.addEventListener('click', () => {
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
    loadRoutes();
});

/**
 * Filtr o'zgarganda ro'yxatni yuklash.
 */
DOM.fromFilter.addEventListener('change', loadRoutes);
DOM.toFilter.addEventListener('change', loadRoutes);

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', loadRoutes);