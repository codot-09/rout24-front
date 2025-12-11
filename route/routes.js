const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const routesList = document.getElementById('routesList');
const emptyState = document.getElementById('emptyState');
const fromFilter = document.getElementById('fromFilter');
const toFilter = document.getElementById('toFilter');

const regions = [
    "TOSHKENT", "NAVOIY", "SAMARKAND", "BUXORO", "QASHQADARYO",
    "XORAZM", "SURXONDARYO", "JIZZAX", "SIRDARYO", "QORAQALPOGISTON",
    "ANDIJON", "NAMANGAN", "FARGONA"
];

regions.forEach(r => {
    const opt1 = document.createElement('option');
    const opt2 = document.createElement('option');
    opt1.value = opt2.value = r;
    const formatted = r.charAt(0) + r.slice(1).toLowerCase().replace('qalpog‘iston', 'qalpog‘iston');
    opt1.textContent = opt2.textContent = formatted;
    fromFilter.appendChild(opt1);
    toFilter.appendChild(opt2);
});

async function loadRoutes(from = '', to = '') {
    try {
        let url = 'https://api.rout24.online/routes/my-routes';
        if (from || to) {
            url += `?${new URLSearchParams({ from, to }).toString()}`;
        }
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const { success, data } = await res.json();
        if (!success || !Array.isArray(data)) throw new Error('Invalid data');

        if (data.length === 0) {
            routesList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        routesList.style.display = 'grid';
        emptyState.style.display = 'none';
        routesList.innerHTML = data.map(route => `
            <div class="route-card" onclick="viewDetails('${route.id}')">
                <div class="route-header">
                    <h3>${route.from} → ${route.to}</h3>
                    <div class="price">${route.price.toLocaleString('uz-UZ')} so‘m</div>
                </div>
                <div class="route-body">
                    <div class="route-info">
                        <div class="info-item">
                            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>
                            <span>${new Date(route.departureDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div class="info-item">
                            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                            <span>${new Date(route.departureDate).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div class="route-footer">
                        <div class="seats">${route.seatsCount} o‘rin</div>
                        <div class="status ${route.finished ? 'finished' : 'active'}">
                            ${route.finished ? 'Yakunlangan' : 'Faol'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        routesList.innerHTML = '<p style="text-align:center;color:#999;margin-top:40px">Reyslar yuklanmadi. Iltimos, qayta urinib ko‘ring.</p>';
    }
}

function viewDetails(routeId) {
    window.location.href = `/route/credentials?id=${routeId}`;
}

fromFilter.onchange = toFilter.onchange = () => {
    loadRoutes(fromFilter.value, toFilter.value);
};

document.getElementById('clearFilter').onclick = () => {
    fromFilter.value = toFilter.value = '';
    loadRoutes();
};

loadRoutes();
