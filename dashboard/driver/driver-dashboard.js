const token = localStorage.getItem('token');
if (!token) location.href = '/login';

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await res.json();
        if (!result.success || !result.data) {
            throw new Error('Profil ma‘lumotlari topilmadi');
        }

        const { fullName, imageUrl, status } = result.data;

        // 1. Ism
        document.getElementById('fullName').textContent = fullName || 'Haydovchi';

        // 2. Profil rasm
        const img = document.getElementById('profileImg');
        img.src = imageUrl || '/assets/default.png';
        img.onerror = () => img.src = '/assets/default.png';

        // 3. Elementlar (agar sahifada bo‘lsa)
        const card       = document.querySelector('.profile-card');
        const ring       = document.getElementById('statusRing');
        const badgeText  = document.getElementById('statusText') || document.getElementById('statusBadge');

        // Tozalash
        if (card) card.className = 'profile-card';
        if (ring) ring.className = 'status-ring';

        // 4. Status bo‘yicha o‘zgarishlar
        let cardClass = '';
        let ringClass = '';
        let badgeContent = '';

        switch (status) {
            case 'NOT_CONFIRMED':
                cardClass = 'not-confirmed';
                ringClass = 'red';
                badgeContent = 'To‘ldirish kerak';
                break;

            case 'WAITING':
            case 'PENDING':
                cardClass = 'waiting';
                ringClass = 'yellow';
                badgeContent = 'Tekshiruvda';
                break;

            case 'CONFIRMED':
                cardClass = 'confirmed';
                ringClass = 'green';
                badgeContent = 'Faol';
                break;

            default:
                badgeContent = 'Noma‘lum';
        }

        // Qo‘shish
        if (card && cardClass) card.classList.add(cardClass);
        if (ring && ringClass) ring.classList.add(ringClass);
        if (badgeText) badgeText.textContent = badgeContent;

    } catch (err) {
        console.error('loadProfile xatosi:', err);
        alert('Profil yuklanmadi. Internetni tekshiring');
    }
}

async function loadStats() {
    try {
        const res = await fetch('https://api.rout24.online/statistics/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const s = data.data;
            document.getElementById('routesCount').textContent = s.routesCount;
            document.getElementById('ordersCount').textContent = s.ordersCount;
            document.getElementById('monthlyIncome').textContent = s.monthlyIncome.toLocaleString() + ' so‘m';
        }
    } catch {}
}

async function loadBanners() {
    try {
        const res = await fetch('https://api.rout24.online/banners', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.data.length) return;

        const wrapper = document.getElementById('bannerWrapper');
        wrapper.innerHTML = data.data.map(b => `
            <div class="swiper-slide">
                <img src="${b.coverImage}" alt="Banner">
            </div>
        `).join('');

        new Swiper('#bannerSwiper', {
            loop: true,
            autoplay: { delay: 4000 },
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    } catch {}
}

// Init
loadProfile();
loadStats();
loadBanners();