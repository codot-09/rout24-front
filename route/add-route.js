const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

let map, fromMarker, toMarker;
let fromAddressSelected = false, toAddressSelected = false;

function initMap() {
    map = L.map('map', {
        center: [41.311081, 69.240562],
        zoom: 12,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    map.on('click', e => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        if (!fromAddressSelected) setMarker(lat, lng, true);
        else if (!toAddressSelected) setMarker(lat, lng, false);
    });
}

async function reverseGeocode(lat, lng, isFrom) {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();

    const address = data.display_name.split(',').slice(0, 3).join(', ');

    if (isFrom) {
        document.getElementById('fromAddress').value = address;
        document.getElementById('fromLat').value = lat;
        document.getElementById('fromLng').value = lng;
        fromAddressSelected = true;
    } else {
        document.getElementById('toAddress').value = address;
        document.getElementById('toLat').value = lat;
        document.getElementById('toLng').value = lng;
        toAddressSelected = true;
    }

    checkForm();
}

function setMarker(lat, lng, isFrom) {
    const marker = isFrom ? fromMarker : toMarker;
    if (marker) map.removeLayer(marker);

    const newMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: isFrom
                ? 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png'
                : 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
            iconSize: [28, 28],
            iconAnchor: [14, 28]
        })
    }).addTo(map);

    if (isFrom) fromMarker = newMarker;
    else toMarker = newMarker;

    reverseGeocode(lat, lng, isFrom);
    map.panTo([lat, lng]);
}

function checkForm() {
    const ready =
        fromAddressSelected &&
        toAddressSelected &&
        document.getElementById('fromSelect').value &&
        document.getElementById('toSelect').value &&
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
        from: document.getElementById('fromSelect').value,
        to: document.getElementById('toSelect').value,
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
            alert('Reys yaratildi!');
            history.back();
        } else throw new Error(json.message || 'Xatolik');
    } catch (err) {
        alert('Xatolik: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Reys yaratish';
    }
};

document.querySelectorAll('#fromSelect, #toSelect, #seats, #price, #departure')
    .forEach(el => el.oninput = checkForm);

window.onload = () => setTimeout(initMap, 300);
