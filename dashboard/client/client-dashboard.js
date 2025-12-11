const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const regions = ["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];

const fromFilter = document.getElementById('fromFilter');
const toFilter = document.getElementById('toFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const routesList = document.getElementById('routesList');
const emptyState = document.getElementById('emptyState');
const toggleBtn = document.getElementById('toggleBtn');
const searchSection = document.getElementById('searchSection');

regions.forEach(r => {
    const txt = r[0] + r.slice(1).toLowerCase();
    fromFilter.add(new Option(txt, r));
    toFilter.add(new Option(txt, r));
});

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
        if (!success || !data?.content?.length) {
            routesList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';
        routesList.innerHTML = data.content.map(r => `
            <div class="route-card" onclick="location.href='route-credentials.html?id=${r.id}'">
                <div class="route-header">
                    <h3>${r.from} → ${r.to}</h3>
                    <p>${new Date(r.departureDate).toLocaleString('uz-UZ',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <div class="route-body">
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
        emptyState.textContent = 'Xatolik yuz berdi';
        emptyState.style.display = 'block';
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

toggleBtn.onclick = () => {
    searchSection.classList.toggle('open');
    const isOpen = searchSection.classList.contains('open');
    toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        ${isOpen ? 'Filtrlarni yashirish' : 'Qidirish filtrlari'}
    `;
};

document.getElementById('searchBtn').onclick = loadRoutes;

// boshida yashirin bo'lsin
searchSection.classList.remove('open');

document.getElementById('searchBtn').onclick = loadRoutes;

loadRoutes();
loadBanners();