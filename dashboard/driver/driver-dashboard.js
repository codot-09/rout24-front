const token = localStorage.getItem('token');
if (!token) location.href = '/login';

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await res.json();
        if (!result.success || !result.data) throw new Error('Profil ma‘lumotlari topilmadi');

        const { fullName, imageUrl, status } = result.data;

        // Ism
        document.getElementById('fullName').textContent = fullName || 'Haydovchi';

        // Rasm
        const img = document.getElementById('profileImg');
        img.src = imageUrl || '/assets/default.png';
        img.onerror = () => img.src = '/assets/default.png';

        // Status badge matni
        const badgeText = document.getElementById('statusText') || document.getElementById('statusBadge');
        const ring = document.getElementById('statusRing');

        // Card rangi (faqat profile sahifasida bo‘lsa)
        const card = document.querySelector('.profile-card');
        if (card) {
            card.classList.remove('not-confirmed', 'waiting', 'confirmed');
        }

        // Umumiy classlarni tozalash
        ring.className = 'status-ring';
        if (badgeText) badgeText.className = 'status-badge'; // agar alohida text bo‘lsa

        // Status bo‘yicha o‘zgarishlar
        if (status === 'NOT_CONFIRMED') {
            ring.classList.add('red');
            if (card) card.classList.add('not-confirmed');
            badgeText.textContent = 'To‘ldirish kerak';
        } 
        else if (status === 'WAITING' || status === 'PENDING') {
            ring.classList.add('yellow');
            if (card) card.classList.add('waiting');
            badgeText.textContent = 'Tekshiruvda';
        } 
        else if (status === 'CONFIRMED') {
            ring.classList.add('green');
            if (card) card.classList.add('confirmed');
            badgeText.textContent = 'Faol';
        }
        else {
            badgeText.textContent = 'Noma‘lum';
        }

    } catch (err) {
        console.error('Profil yuklashda xato:', err);
        alert('Profil ma‘lumotlari yuklanmadi. Internetni tekshiring');
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