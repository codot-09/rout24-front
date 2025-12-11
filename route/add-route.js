const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

let map, fromMarker, toMarker;
let fromSelected = false, toSelected = false;

function initMap() {
    map = L.map('map', {
        center: [41.311081, 69.240562],
        zoom: 12,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');

    fromInput.addEventListener('change', () => geocode(fromInput.value, true));
    toInput.addEventListener('change', () => geocode(toInput.value, false));

    map.on('click', e => {
        if (!fromSelected) setMarker(e.latlng, true);
        else if (!toSelected) setMarker(e.latlng, false);
    });
}

async function geocode(query, isFrom) {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.length) return;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    setMarker({ lat, lng }, isFrom);
    document.getElementById(isFrom ? 'fromInput' : 'toInput').value = data[0].display_name.split(',')[0];
}

function setMarker(latLng, isFrom) {
    const m = isFrom ? fromMarker : toMarker;
    if (m) map.removeLayer(m);

    const newMarker = L.marker([latLng.lat, latLng.lng], {
        icon: L.icon({
            iconUrl: isFrom
                ? 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png'
                : 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(map);

    if (isFrom) {
        fromMarker = newMarker;
        document.getElementById('fromLat').value = latLng.lat;
        document.getElementById('fromLng').value = latLng.lng;
        document.getElementById('fromAddress').value = document.getElementById('fromInput').value;
        fromSelected = true;
    } else {
        toMarker = newMarker;
        document.getElementById('toLat').value = latLng.lat;
        document.getElementById('toLng').value = latLng.lng;
        document.getElementById('toAddress').value = document.getElementById('toInput').value;
        toSelected = true;
    }

    map.panTo([latLng.lat, latLng.lng]);
    checkForm();
}

function checkForm() {
    const ready = fromSelected && toSelected &&
        document.getElementById('seats').value > 0 &&
        document.getElementById('price').value > 0 &&
        document.getElementById('departure').value;

    document.getElementById('submitBtn').disabled = !ready;
}

document.getElementById('submitBtn').onclick = async () => {
    if (document.getElementById('submitBtn').disabled) return;

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    const payload = {
        from: document.getElementById('fromInput').value || "Belgilandi",
        to: document.getElementById('toInput').value || "Belgilandi",
        fromLat: parseFloat(document.getElementById('fromLat').value),
        fromLng: parseFloat(document.getElementById('fromLng').value),
        fromAddress: document.getElementById('fromAddress').value,
        toLat: parseFloat(document.getElementById('toLat').value),
        toLng: parseFloat(document.getElementById('toLng').value),
        toAddress: document.getElementById('toAddress').value,
        seatsCount: parseInt(document.getElementById('seats').value),
        price: parseInt(document.getElementById('price').value),
        departureDate: new Date(document.getElementById('departure').value).toISOString()
    };

    try {
        const res = await fetch('https://api.rout24.online/routes', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            alert('Reys muvaffaqiyatli yaratildi!');
            history.back();
        } else throw new Error(json.message || 'Xatolik');
    } catch (err) {
        alert('Xatolik: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Reys yaratish';
    }
};

document.querySelectorAll('#seats, #price, #departure').forEach(el => el.oninput = checkForm);

window.onload = () => {
    setTimeout(initMap, 300);
};
