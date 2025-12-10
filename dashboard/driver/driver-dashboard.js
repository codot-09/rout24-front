const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error();

        const { fullName, imageUrl, status } = data.data;
        document.getElementById('fullName').textContent = fullName || 'Noma‘lum';
        document.getElementById('profileImg').src = imageUrl || 'https://via.placeholder.com/72';

        const badge = document.getElementById('statusBadge');
        const text = document.getElementById('statusText');
        badge.className = 'status';
        if (status === 'NOT_CONFIRMED') {
            badge.classList.add('not-confirmed');
            text.textContent = 'Tasdiqlanmagan';
            badge.innerHTML += ' To‘ldirish kerak';
        } else if (status === 'WAITING') {
            badge.classList.add('waiting');
            text.textContent = 'Kutilyapti';
        } else if (status === 'CONFIRMED') {
            badge.classList.add('confirmed');
            text.textContent = 'Tasdiqlangan';
        }
    } catch {
        alert('Profil ma‘lumotlari yuklanmadi');
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