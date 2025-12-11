const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

let map, fromMarker, toMarker;
let fromSelected = false, toSelected = false;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 41.311081, lng: 69.240562 },
        zoom: 11,
        disableDefaultUI: true,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
    });

    const fromSearch = new google.maps.places.Autocomplete(document.getElementById('fromInput'));
    const toSearch = new google.maps.places.Autocomplete(document.getElementById('toInput'));

    fromSearch.addListener('place_changed', () => setLocation(fromSearch, true));
    toSearch.addListener('place_changed', () => setLocation(toSearch, false));

    map.addListener('click', e => {
        if (!fromSelected) setMarker(e.latLng, true);
        else if (!toSelected) setMarker(e.latLng, false);
    });
}

function setLocation(searchBox, isFrom) {
    const place = searchBox.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setMarker(new google.maps.LatLng(lat, lng), isFrom);
    document.getElementById(isFrom ? 'fromInput' : 'toInput').value = place.formatted_address.split(',')[0];
}

function setMarker(latLng, isFrom) {
    const marker = isFrom ? fromMarker : toMarker;
    if (marker) marker.setMap(null);

    const newMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: { url: isFrom ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
    });

    if (isFrom) {
        fromMarker = newMarker;
        document.getElementById('fromLat').value = latLng.lat();
        document.getElementById('fromLng').value = latLng.lng();
        document.getElementById('fromAddress').value = document.getElementById('fromInput').value;
        fromSelected = true;
    } else {
        toMarker = newMarker;
        document.getElementById('toLat').value = latLng.lat();
        document.getElementById('toLng').value = latLng.lng();
        document.getElementById('toAddress').value = document.getElementById('toInput').value;
        toSelected = true;
    }

    map.panTo(latLng);
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

// Avto to‘ldirish va validatsiya
document.querySelectorAll('#seats, #price, #departure').forEach(el => el.oninput = checkForm);

// Google Maps API yuklanishi
window.onload = () => {
    setTimeout(initMap, 500);
};