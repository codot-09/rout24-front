const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const regions = ["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];

const fromInput = document.getElementById('fromInput');
const toInput =   document.getElementById('toInput');
const fromAddr=  document.getElementById('fromAddress');
const toAddr  =  document.getElementById('toAddress');
const mapHint =  document.getElementById('mapHint');
const submitBtn= document.getElementById('submitBtn');

regions.forEach(r => {
    const text = r.charAt(0) + r.slice(1).toLowerCase();
    fromInput.add(new Option(text, r));
    toInput.add(new Option(text, r));
});

let map, fromMarker, toMarker;
let clickCount = 0; // 0 = hech, 1 = from, 2 = to

function initMap() {
    map = L.map('map').setView([41.311081, 69.240562], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', e => {
        if (clickCount === 0) {
            setPoint(e.latlng, 'from');
        } else if (clickCount === 1) {
            setPoint(e.latlng, 'to');
        }
    });
}

function setPoint(latlng, type) {
    const isFrom = type === 'from';
    const marker = isFrom ? fromMarker : toMarker;
    if (marker) marker.remove();

    const color = isFrom ? '#2e7d32' : '#c62828';
    const letter = isFrom ? 'F' : 'T';

    const icon = L.divIcon({
        html: `<div style="background:${color};color:white;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;border:4px solid white;box-shadow:0 4px 15px rgba(0,0,0,0.4);">${letter}</div>`,
        iconSize: [44,44], iconAnchor: [22,44]
    });

    const newMarker = L.marker(latlng, {icon}).addTo(map);
    if (isFrom) fromMarker = newMarker; else toMarker = newMarker;

    reverseGeocode(latlng, type);
}

async function reverseGeocode(latlng, type) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        const addr = data.display_name || "Manzil topilmadi";

        if (type === 'from') {
            document.getElementById('fromLat').value = latlng.lat.toFixed(6);
            document.getElementById('fromLng').value = latlng.lng.toFixed(6);
            fromAddr.textContent = addr;
            mapHint.innerHTML = '<strong style="color:#c62828">Yetib borish joyi</strong>ni bosing (qizil nuqta)';
            clickCount = 1;
        } else {
            document.getElementById('toLat').value = latlng.lat.toFixed(6);
            document.getElementById('toLng').value = latlng.lng.toFixed(6);
            toAddr.textContent = addr;
            mapHint.innerHTML = 'Ikkala joy tanlandi! Ma’lumotlarni to‘ldiring';
            mapHint.style.background = '#e8f5e9';
            mapHint.style.color = '#2e7d32';
            clickCount = 2;
        }
        checkForm();
    } catch (err) {
        alert("Internet aloqasi yo‘q yoki manzil topilmadi");
    }
}

function checkForm() {
    const ready = fromInput.value && toInput.value &&
                  document.getElementById('fromLat').value &&
                  document.getElementById('toLat').value &&
                  document.getElementById('seats').value >= 1 &&
                  document.getElementById('price').value >= 10000 &&
                  document.getElementById('departure').value;

    submitBtn.disabled = !ready;
}

// Inputlarni kuzatish
[fromInput, toInput, document.getElementById('seats'), document.getElementById('price'), document.getElementById('departure')].forEach(el => {
    el.addEventListener('input', checkForm);
    el.addEventListener('change', checkForm);
});

submitBtn.onclick = async () => {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilmoqda...";

    const payload = {
        from: fromInput.value,
        to: toInput.value,
        fromLat: parseFloat(document.getElementById('fromLat').value),
        fromLng: parseFloat(document.getElementById('fromLng').value),
        fromAddress: fromAddr.textContent,
        toLat: parseFloat(document.getElementById('toLat').value),
        toLng: parseFloat(document.getElementById('toLng').value),
        toAddress: toAddr.textContent,
        seatsCount: +document.getElementById('seats').value,
        price: +document.getElementById('price').value,
        departureDate: new Date(document.getElementById('departure').value).toISOString()
    };

    try {
        const res = await fetch("https://api.rout24.online/routes", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            alert("Reys muvaffaqiyatli yaratildi!");
            location.href = "my-routes.html";
        } else throw new Error(json.message || "Xato");
    } catch (err) {
        alert("Xatolik: " + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Reys yaratish";
    }
};

// Start
initMap();
checkForm();