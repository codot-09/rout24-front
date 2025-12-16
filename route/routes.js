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
    const actionText = isFinished ? 'O\'chirish' : 'Yakunlash';
    const action = isFinished ? `deleteRoute('${route.id}')` : `finishRoute('${route.id}')`;
    const actionIcon = isFinished 
        ? `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
    
    const clickHandler = `viewDetails('${route.id}')`;

    const deleteBtnBlock = `
        <div class="delete-btn-wrapper" onclick="${action}">
            <button class="delete-btn" aria-label="Reysni ${actionText}">
                ${actionIcon}
            </button>
            <span class="delete-label">${actionText}</span>
        </div>
    `;

    return `
        <div class="route-card-wrapper">
            <article class="${cardClass}" onclick="${clickHandler}" role="button" tabindex="0"
                data-route-id="${route.id}">
                <div class="route-image">
                    <img src="${route.coverImageUrl || '/assets/default-route.jpg'}" alt="Reys rasmi" loading="lazy">
                </div>
                <div class="route-content">
                    <div class="route-info">
                        <h3>${route.from} → ${route.to}</h3>
                        <p class="route-meta">Ketish: ${route.departureTime || 'Noma\'lum'}</p>
                    </div>
                </div>
                <div class="route-price">${route.price.toLocaleString('uz-UZ')} so'm</div>
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
    params.set('includeFinished', true);

    const paramString = params.toString() ? '?' + params : '';
    const url = `${API_BASE}/routes/my-routes${paramString}`;

    try {
        const result = await authFetch(url);

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error('Serverdan noto\'g\'ri ma\'lumot formati keldi');
        }

        // Active reyslar yuqorida, finished reyslar pastda
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

function initSwipeHandlers() {
    const swipeableWrappers = DOM.routesList.querySelectorAll('.route-card-wrapper');
    const swipeWidth = 90;

    let startX;
    let currentWrapper = null;
    let isSwiping = false;
    let initialSwipeX = 0;

    function resetSwipe() {
        if (currentWrapper) {
            currentWrapper.classList.remove('swiped');
            currentWrapper.querySelector('.route-card-modern').style.transform = `translateX(0)`;
            currentWrapper = null;
        }
    }

    // Har bir card wrapper uchun swipe eshituvchilarini o'rnating
    swipeableWrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.route-card-modern:not(.route-card-finished)');
        if (!card) return;

        wrapper.addEventListener('touchstart', (e) => {
            // Agar oldingi card ochiq bo'lsa, uni yoping
            if (currentWrapper && currentWrapper !== wrapper) {
                resetSwipe();
            }
            
            startX = e.touches[0].clientX;
            currentWrapper = wrapper;
            isSwiping = false;
            initialSwipeX = new WebKitCSSMatrix(window.getComputedStyle(card).transform).m41;
        });

        wrapper.addEventListener('touchmove', (e) => {
            if (!currentWrapper || e.touches.length > 1) return;
            
            const diffX = e.touches[0].clientX - startX;
            
            if (Math.abs(diffX) > 10) {
                isSwiping = true;
                const newX = initialSwipeX + diffX;

                let transformValue;
                if (newX < 0) {
                    // Chapga surish (ko'rsatish)
                    transformValue = Math.max(-swipeWidth, newX);
                } else {
                    // O'ngga surish (yopish)
                    transformValue = Math.min(0, newX);
                }

                card.style.transform = `translateX(${transformValue}px)`;
            }
        });

        wrapper.addEventListener('touchend', () => {
            if (!currentWrapper || !isSwiping) {
                isSwiping = false;
                return;
            }

            const style = window.getComputedStyle(card);
            const matrix = new WebKitCSSMatrix(style.transform);
            const currentX = matrix.m41;

            if (currentX < (-swipeWidth / 3)) {
                // To'liq ochish
                currentWrapper.classList.add('swiped');
                card.style.transform = `translateX(-${swipeWidth}px)`;
            } else {
                // Yopish
                resetSwipe();
            }
            isSwiping = false;
        });
    });

    document.addEventListener('click', (e) => {
        if (currentWrapper && !currentWrapper.contains(e.target)) {
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