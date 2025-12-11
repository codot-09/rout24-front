const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const regions = ["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];

const fromFilter = document.getElementById('fromFilter');
const toFilter   = document.getElementById('toFilter');

regions.forEach(r => {
    const txt = r[0] + r.slice(1).toLowerCase();
    fromFilter.add(new Option(txt, r));
    toFilter.add(new Option(txt, r));
});

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        if (success && data) {
            document.getElementById('heroName').textContent = data.fullName || 'Foydalanuvchi';
            const src = data.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName||'U')}&background=800000&color=fff&size=100&bold=true`;
            document.getElementById('heroAvatar').src = src;
            document.getElementById('profileAvatar').src = src;
        }
    } catch {}
}

async function loadRoutes() {
    const params = new URLSearchParams();
    if (fromFilter.value) params.append('from', fromFilter.value);
    if (toFilter.value) params.append('to', toFilter.value);
    if (minPrice.value) params.append('minprice', minPrice.value);
    if (maxPrice.value) params.append('maxprice', maxPrice.value);
    params.append('page', '0');
    params.append('size', '20');

    try {
        const res = await fetch(`https://api.rout24.online/routes/search?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        const list = document.getElementById('routesList');
        const empty = document.getElementById('emptyState');

        if (!success || !data?.content?.length) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = data.content.map(r => `
            <div class="route-card" onclick="location.href='route-credentials.html?id=${r.id}'">
                <div class="route-card-header">
                    <h3>${r.from} → ${r.to}</h3>
                    <p>${new Date(r.departureDate).toLocaleString('uz-UZ',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <div class="route-card-body">
                    <div class="route-info">
                        <div><strong>Narx:</strong> ${r.price.toLocaleString()} so‘m</div>
                        <div><strong>O‘rin:</strong> ${r.seatsCount} ta</div>
                    </div>
                    <div class="route-footer">
                        <div class="price">${r.price.toLocaleString()} so‘m</div>
                        <div class="seats-badge">${r.seatsCount} joy</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch {
        document.getElementById('emptyState').textContent = 'Xatolik yuz berdi';
        document.getElementById('emptyState').style.display = 'block';
    }
}

async function loadBanners() {
    try {
        const res = await fetch('https://api.rout24.online/banners', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        if (success && data.length) {
            document.getElementById('banners').innerHTML = data.map(b => `
                <div class="banner"><img src="${b.coverImage}" alt="Banner"></div>
            `).join('');
        }
    } catch {}
}

document.getElementById('profileBtn').onclick = () => location.href = 'client-profile.html';
document.getElementById('searchBtn').onclick = loadRoutes;

loadProfile();
loadRoutes();
loadBanners();