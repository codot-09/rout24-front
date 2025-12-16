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

        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Autentifikatsiya xatosi');
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Server xatosi: ${response.status} - ${errorBody.message || response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('AuthFetch xatosi:', error);
        throw error;
    }
}

function renderRouteCard(route) {
    const isFinished = route.finished;
    const cardClass = isFinished ? 'route-card-modern route-card-finished' : 'route-card-modern';
    const deleteText = isFinished ? 'O\'chirish' : 'Tugatish';
    const deleteAction = isFinished ? `deleteRoute('${route.id}')` : `finishRoute('${route.id}')`;
    const deleteIcon = isFinished 
        ? `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
    
    // Swipe funksiyasi uchun alohida wrapper kerak
    const deleteBtnBlock = `
        <div class="delete-btn-wrapper" onclick="${deleteAction}">
            <button class="delete-btn" aria-label="Reysni ${deleteText}">${deleteIcon}</button>
        </div>
    `;

    // Finished reyslarga bosishni o'chirish
    const clickHandler = isFinished ? '' : `viewDetails('${route.id}')`;

    return `
        <div class="route-card-wrapper">
            <article class="${cardClass}" onclick="${clickHandler}" role="button" tabindex="0"
                data-route-id="${route.id}">
                <div class="route-image">
                    <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" alt="Reys rasmi" loading="lazy">
                    <div class="route-price">${route.price.toLocaleString('uz-UZ')} so'm</div>
                </div>
                <div class="route-content">
                    <div class="route-info">
                        <h3>${route.from} → ${route.to}</h3>
                        <p class="route-meta">${route.departureTime} dan boshlab</p>
                    </div>
                </div>
            </article>
            ${!isFinished ? deleteBtnBlock : ''}
        </div>
    `;
}

window.finishRoute = async function(routeId) {
    if (!confirm('Bu reysni yakunlashni xohlaysizmi?')) return;
    
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
        alert('Reysni yakunlashda xatolik yuz berdi: ' + err.message);
    }
}

window.deleteRoute = async function(routeId) {
    if (!confirm('Bu reysni butunlay o\'chirishni xohlaysizmi? Bu amalni qaytarib bo\'lmaydi.')) return;
    
    try {
        const result = await authFetch(`${API_BASE}/routes/${routeId}`, { 
            method: 'DELETE' 
        });
        
        // Agar API delete operatsiyasi uchun success/status qaytarsa
        if (result.success || result.status === 204) {
            await loadRoutes();
        } else {
            throw new Error(result.message || 'Noma\'lum xatolik');
        }
    } catch (err) {
        alert('Reysni o\'chirishda xatolik yuz berdi: ' + err.message);
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
    params.set('includeFinished', true); // Yakunlangan reyslarni ham yuklash uchun

    const paramString = params.toString() ? '?' + params : '';
    const url = `${API_BASE}/routes/my-routes${paramString}`;

    try {
        const result = await authFetch(url);

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Serverdan noto\'g\'ri ma\'lumot formati keldi');
        }

        const routes = result.data.sort((a, b) => (a.finished === b.finished) ? 0 : a.finished ? 1 : -1);

        if (routes.length === 0) {
            DOM.routesList.innerHTML = '';
            DOM.emptyState.hidden = false;
        } else {
            DOM.routesList.innerHTML = routes.map(renderRouteCard).join('');
            initSwipeHandlers();
        }
    } catch (err) {
        console.error('Reyslarni yuklashda xatolik:', err);
        DOM.routesList.innerHTML = `<div class="error-message">Ma'lumotlarni yuklashda xatolik yuz berdi: ${err.message}</div>`;
        DOM.emptyState.hidden = true;
    }
}

// Swipe (surish) funksiyasini qo'shish
function initSwipeHandlers() {
    const swipeableCards = DOM.routesList.querySelectorAll('.route-card-wrapper');
    const swipeWidth = 90; // CSS: --swipe-width

    let startX;
    let currentCard = null;

    function resetSwipe() {
        if (currentCard) {
            currentCard.classList.remove('swiped');
            currentCard = null;
        }
    }

    swipeableCards.forEach(wrapper => {
        const card = wrapper.querySelector('.route-card-modern:not(.route-card-finished)');
        if (!card) return;

        wrapper.addEventListener('touchstart', (e) => {
            resetSwipe(); 
            startX = e.touches[0].clientX;
            currentCard = wrapper;
        });

        wrapper.addEventListener('touchmove', (e) => {
            if (!currentCard) return;
            const diffX = e.touches[0].clientX - startX;

            if (diffX < -10) { // chapga surish
                e.preventDefault();
                const transformValue = Math.max(-swipeWidth, diffX);
                card.style.transform = `translateX(${transformValue}px)`;
            } else if (diffX > 10) { // o'ngga surish
                e.preventDefault();
                const transformValue = Math.min(0, diffX - swipeWidth);
                card.style.transform = `translateX(${transformValue}px)`;
            }
        });

        wrapper.addEventListener('touchend', () => {
            if (!currentCard) return;
            const style = window.getComputedStyle(card);
            const matrix = new WebKitCSSMatrix(style.transform);
            const currentX = matrix.m41;

            if (currentX < (-swipeWidth / 2)) {
                // To'liq ochish
                currentCard.classList.add('swiped');
                card.style.transform = `translateX(-${swipeWidth}px)`;
            } else {
                // Yopish
                resetSwipe();
                card.style.transform = `translateX(0)`;
            }
        });
    });

    // Boshqa joyga bosilganda yopish
    document.addEventListener('click', (e) => {
        if (currentCard && !currentCard.contains(e.target)) {
            resetSwipe();
        }
    });
}


DOM.clearFilter.addEventListener('click', () => {
    DOM.fromFilter.value = '';
    DOM.toFilter.value = '';
    loadRoutes();
});

DOM.fromFilter.addEventListener('change', loadRoutes);
DOM.toFilter.addEventListener('change', loadRoutes);

document.addEventListener('DOMContentLoaded', loadRoutes);