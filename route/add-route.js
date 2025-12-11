const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

let map, marker;
let selectedType = null;

// ELEMENTLAR
const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");

const fromLat = document.getElementById("fromLat");
const fromLng = document.getElementById("fromLng");
const fromAddress = document.getElementById("fromAddress");

const toLat = document.getElementById("toLat");
const toLng = document.getElementById("toLng");
const toAddress = document.getElementById("toAddress");

const seats = document.getElementById("seats");
const price = document.getElementById("price");
const departure = document.getElementById("departure");
const submitBtn = document.getElementById("submitBtn");


// MAP INIT
function initMap() {
    map = L.map("map").setView([41.311081, 69.240562], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    map.on("click", (e) => {
        if (!selectedType) {
            alert("Avval qayerdan/qayerga tanlang!");
            return;
        }
        setMarker(e.latlng);
        reverseGeocode(e.latlng);
    });
}


// MARKER
function setMarker(latlng) {
    if (marker) marker.remove();
    marker = L.marker(latlng).addTo(map);
    map.panTo(latlng);
}


// REVERSE GEOCODING
async function reverseGeocode(latlng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`;
        const res = await fetch(url);
        const data = await res.json();

        const addr = data.display_name || "Manzil topilmadi";

        if (selectedType === "from") {
            fromLat.value = latlng.lat;
            fromLng.value = latlng.lng;
            fromAddress.value = addr;
        } else {
            toLat.value = latlng.lat;
            toLng.value = latlng.lng;
            toAddress.value = addr;
        }

        checkForm();
    } catch (e) {
        alert("Manzil aniqlanmadi");
    }
}


// QAYSI TURI TANLANGANINI BELGILASH
fromInput.onchange = () => {
    selectedType = "from";
    checkForm();
};

toInput.onchange = () => {
    selectedType = "to";
    checkForm();
};


// VALIDATSIYA
function checkForm() {
    const ready =
        fromInput.value &&
        toInput.value &&
        fromAddress.value &&
        toAddress.value &&
        seats.value > 0 &&
        price.value > 0 &&
        departure.value;

    submitBtn.disabled = !ready;
}

seats.oninput = checkForm;
price.oninput = checkForm;
departure.oninput = checkForm;


// SUBMIT
submitBtn.onclick = async () => {
    if (submitBtn.disabled) return;

    submitBtn.textContent = "Yuborilmoqda...";
    submitBtn.disabled = true;

    const payload = {
        from: fromInput.value,
        to: toInput.value,
        fromLat: parseFloat(fromLat.value),
        fromLng: parseFloat(fromLng.value),
        fromAddress: fromAddress.value,
        toLat: parseFloat(toLat.value),
        toLng: parseFloat(toLng.value),
        toAddress: toAddress.value,
        seatsCount: parseInt(seats.value),
        price: parseInt(price.value),
        departureDate: new Date(departure.value).toISOString()
    };

    try {
        const res = await fetch("https://api.rout24.online/routes", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
            alert("Reys yaratildi!");
            history.back();
        } else {
            throw new Error(json.message);
        }
    } catch (err) {
        alert("Xatolik: " + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Reys yaratish";
    }
};


// START
window.onload = initMap;
