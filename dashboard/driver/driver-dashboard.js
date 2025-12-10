const token = localStorage.getItem('token');
if (!token) location.href = '/login';

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error();

        const { fullName, imageUrl, status } = data.data;

        const img = document.getElementById('profileImg');
        img.src = imageUrl || '/assets/default.png';

        img.onerror = () => {
            img.src = '/assets/default.png';
        };

        document.getElementById('fullName').textContent = fullName || 'Haydovchi';

        const ring = document.getElementById('statusRing');
        const badge = document.getElementById('statusBadge');
        const text = document.getElementById('statusText');

        ring.className = 'status-ring';
        badge.className = 'status-badge';

        if (status === 'NOT_CONFIRMED') {
            ring.classList.add('not-confirmed');
            text.textContent = 'Tasdiqlanmagan';
        } else if (status === 'WAITING') {
            ring.classList.add('waiting');
            text.textContent = 'Tekshiruvda';
        } else if (status === 'CONFIRMED') {
            ring.classList.add('confirmed');
            text.textContent = 'Faol';
        }

    } catch {
        alert('Profil yuklanmadi');
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