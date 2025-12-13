// Token tekshiruvi – agar yo‘q bo‘lsa login sahifasiga yo‘naltirish
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// API base URL (kelajakda o‘zgartirish oson bo‘lishi uchun)
const API_BASE = 'https://api.rout24.online';

// Umumiy fetch helper – xatoliklarni markazlashgan boshqarish
async function authFetch(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
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

// Profil ma‘lumotlarini yuklash
async function loadProfile() {
    try {
        const result = await authFetch('/drivers/profile');

        if (!result.success || !result.data) {
            throw new Error('Profil ma‘lumotlari topilmadi');
        }

        const { fullName, imageUrl, status } = result.data;

        // Ism
        const fullNameEl = document.getElementById('fullName');
        if (fullNameEl) {
            fullNameEl.textContent = fullName || 'Haydovchi';
        }

        // Profil rasmi
        const profileImg = document.getElementById('profileImg');
        if (profileImg) {
            const defaultImg = '/assets/default.png';
            profileImg.src = imageUrl || defaultImg;

            // Rasm yuklanmasa defaultga o‘tish
            profileImg.onerror = () => {
                profileImg.src = defaultImg;
            };
        }

        // Statusga qarab UI o‘zgartirish
        const profileCard = document.querySelector('.profile-card');
        const statusRing = document.getElementById('statusRing');
        const statusBadge = document.getElementById('statusText') || document.querySelector('#statusBadge span');

        // Oldingi classlarni tozalash
        if (profileCard) {
            profileCard.classList.remove('confirmed', 'waiting', 'pending', 'not-confirmed', 'rejected');
        }
        if (statusRing) {
            statusRing.classList.remove('visible', 'green', 'yellow', 'red');
        }

        // Status mapping (CSS ga moslashtirilgan)
        let cardClass = '';
        let ringClass = '';
        let badgeText = 'Noma‘lum';

        switch (status) {
            case 'CONFIRMED':
                cardClass = 'confirmed';
                ringClass = 'green';
                badgeText = 'Faol';
                break;
            case 'WAITING':
            case 'PENDING':
                cardClass = 'waiting';
                ringClass = 'yellow';
                badgeText = 'Tekshiruvda';
                break;
            case 'NOT_CONFIRMED':
                cardClass = 'not-confirmed';
                ringClass = 'red';
                badgeText = 'To‘ldirish kerak';
                break;
            default:
                cardClass = 'not-confirmed';
                ringClass = 'red';
                badgeText = 'Noma‘lum';
        }

        // Classlarni qo‘shish
        if (profileCard && cardClass) {
            profileCard.classList.add(cardClass);
        }
        if (statusRing && ringClass) {
            statusRing.classList.add('visible', ringClass);
        }
        if (statusBadge) {
            statusBadge.textContent = badgeText;
        }

    } catch (error) {
        console.error('Profil yuklashda xato:', error);
        alert('Profil yuklanmadi. Internet aloqasini tekshiring yoki qayta urinib ko‘ring.');
    }
}

// Statistika yuklash
async function loadStats() {
    try {
        const result = await authFetch('/statistics/me');

        if (result.success && result.data) {
            const s = result.data;

            const routesEl = document.getElementById('routesCount');
            const ordersEl = document.getElementById('ordersCount');
            const incomeEl = document.getElementById('monthlyIncome');

            if (routesEl) routesEl.textContent = s.routesCount ?? 0;
            if (ordersEl) ordersEl.textContent = s.ordersCount ?? 0;
            if (incomeEl) {
                const income = Number(s.monthlyIncome ?? 0);
                incomeEl.textContent = income.toLocaleString('uz-UZ') + ' so‘m';
            }
        }
    } catch (error) {
        console.error('Statistika yuklashda xato:', error);
        // Foydalanuvchiga xabar bermaymiz – statistika muhim emas, sahifa ishlayveradi
    }
}

async function loadBanners() {
    try {
        const result = await authFetch('/banners');

        if (!result.success || !Array.isArray(result.data) || result.data.length === 0) return;

        const wrapper = document.getElementById('bannerWrapper');
        if (!wrapper) return;

        wrapper.innerHTML = result.data
            .map(
                b => `
                    <div class="swiper-slide" onclick="location.href='/banner/${b.id}'">
                        <img src="${b.coverImage || ''}" alt="Reklama banneri" loading="lazy">
                    </div>
                `
            )
            .join('');

        new Swiper('#bannerSwiper', {
            loop: result.data.length > 1,
            autoplay: result.data.length > 1 ? { delay: 4000, disableOnInteraction: false } : false,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 1,
        });
    } catch {}
}

// Sahifa yuklanganda barcha funksiyalarni ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadStats();
    loadBanners();
});