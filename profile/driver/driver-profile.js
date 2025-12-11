const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const content = document.getElementById('content');
const fullNameEl = document.getElementById('fullName');
const profileImg = document.getElementById('profileImg');
const statusBadge = document.getElementById('statusBadge');
const statusRing = document.getElementById('statusRing');
const card = document.querySelector('.profile-card');

let licenseUrl = '', passportUrl = '';

async function init() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        if (!success || !data) throw new Error();

        fullNameEl.textContent = data.fullName || 'Haydovchi';
        profileImg.src = data.imageUrl || '/assets/default.png';
        profileImg.onerror = () => profileImg.src = '/assets/default.png';

        const status = data.status;

        // Card rangi
        card.className = 'profile-card';
        if (status === 'NOT_CONFIRMED') card.classList.add('not-confirmed');
        else if (status === 'WAITING' || status === 'PENDING') card.classList.add('waiting');
        else if (status === 'CONFIRMED') card.classList.add('confirmed');

        // Badge va ring
        statusBadge.textContent = status === 'NOT_CONFIRMED' ? 'To‘ldirish kerak' :
                                  status === 'WAITING' || status === 'PENDING' ? 'Tekshiruvda' : 'Faol';

        statusRing.className = 'status-ring ' +
            (status === 'NOT_CONFIRMED' ? 'red' :
             status === 'WAITING' || status === 'PENDING' ? 'yellow' : 'green');

        renderContent(status);
    } catch {
        alert('Profil yuklanmadi');
    }
}

function renderContent(status) {
    if (status === 'NOT_CONFIRMED') {
        content.innerHTML = `
            <div class="form">
                <div class="form-group">
                    <label>Haydovchilik guvohnomasi</label>
                    <div class="upload-box" id="licenseBox">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <p>Yuklash</p>
                        <img id="licensePrev" style="display:none">
                        <input type="file" id="licenseInput" accept="image/*" hidden>
                    </div>
                </div>
                <div class="form-group">
                    <label>Passport/ID karta</label>
                    <div class="upload-box" id="passportBox">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <p>Yuklash</p>
                        <img id="passportPrev" style="display:none">
                        <input type="file" id="passportInput" accept="image/*" hidden>
                    </div>
                </div>
                <div class="form-group"><label>Tug‘ilgan kun</label><input type="date" id="birthDate"></div>
                <div class="form-group">
                    <label>Jins</label>
                    <select id="gender">
                        <option value="" disabled selected>Tanlang</option>
                        <option value="MALE">Erkak</option>
                        <option value="FEMALE">Ayol</option>
                    </select>
                </div>
                <button class="btn" id="submitBtn" disabled>Yuborish</button>
            </div>
        `;

        document.getElementById('licenseBox').onclick = () => document.getElementById('licenseInput').click();
        document.getElementById('passportBox').onclick = () => document.getElementById('passportInput').click();
        document.getElementById('licenseInput').onchange = e => uploadImage(e, 'license');
        document.getElementById('passportInput').onchange = e => uploadImage(e, 'passport');
        document.getElementById('submitBtn').onclick = submitVerification;
    }
    else if (status === 'WAITING' || status === 'PENDING') {
        content.innerHTML = `<p style="font-size:19px;opacity:0.9;line-height:1.6;margin-top:20px">Ma'lumotlaringiz tekshirilmoqda.<br>Tez orada javob beramiz</p>`;
    }
    else if (status === 'CONFIRMED') {
        content.innerHTML = `<div id="vehicle"></div><div class="action-list" id="actions"></div>`;
        loadVehicle();
        loadActions();
    }
}

async function uploadImage(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    const prev = document.getElementById(type + 'Prev');
    prev.src = URL.createObjectURL(file);
    prev.style.display = 'block';
    document.querySelector(`#${type}Box svg, #${type}Box p`).style.display = 'none';

    const form = new FormData();
    form.append('file', file);

    try {
        const res = await fetch('https://api.rout24.online/api/upload/image', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        });
        const url = await res.text();
        if (res.ok && url.startsWith('http')) {
            if (type === 'license') licenseUrl = url;
            if (type === 'passport') passportUrl = url;
            if (licenseUrl && passportUrl && document.getElementById('birthDate')?.value && document.getElementById('gender')?.value) {
                document.getElementById('submitBtn').disabled = false;
            }
        } else throw new Error();
    } catch {
        alert('Rasm yuklashda xatolik');
    }
}

window.submitVerification = async function () {
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;
    if (!licenseUrl || !passportUrl || !birthDate || !gender) return alert('Barcha maydonlarni to‘ldiring');

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    try {
        const res = await fetch('https://api.rout24.online/drivers/finish-account', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverLicense: licenseUrl, passportId: passportUrl, birthDate, gender })
        });
        const result = await res.json();
        if (result.success) {
            alert('Ma‘lumotlar yuborildi! Tekshiruvga yuborildi');
            location.reload();
        } else throw new Error(result.message || 'Xatolik');
    } catch (err) {
        alert('Yuborishda xatolik');
        btn.disabled = false;
        btn.textContent = 'Yuborish';
    }
};

function loadActions() {
    const actions = [
        { text: "Mashina qo‘shish", icon: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9h14v2H7V9z", onclick: "location.href='/add-car.html'" },
        { text: "Shartlar", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
        { text: "Xavfsizlik", icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" },
        { text: "Yordam", icon: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" },
        { text: "Chiqish", icon: "M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14", onclick: "localStorage.removeItem('token');localStorage.removeItem('role');location.href='login.html'" }
    ];

    document.getElementById('actions').innerHTML = actions
        .filter(a => document.getElementById('vehicle').innerHTML || a.text !== "Mashina qo‘shish")
        .map(a => `<div class="action-item" ${a.onclick?`onclick="${a.onclick}"`:''}>
            <span>${a.text}</span>
            <svg viewBox="0 0 24 24"><path d="${a.icon}"/></svg>
        </div>`).join('');
}

async function loadVehicle() {
    try {
        const res = await fetch('https://api.rout24.online/vehicles/my', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 404) throw 404;
        const json = await res.json();
        if (!json.success || !json.data) throw new Error();

        const v = json.data;
        document.getElementById('vehicle').innerHTML = `
            <div class="vehicle-card">
                <img src="${v.images?.[0]||'/assets/default-car.jpg'}" alt="Mashina">
                <div class="vehicle-info">
                    <h3>${v.name||'Noma‘lum'}</h3>
                    <p>${v.plateNumber}</p>
                    <p>${v.type}</p>
                </div>
            </div>
        `;
    } catch (e) {
        if (e === 404) {
            document.getElementById('vehicle').innerHTML = `
                <button class="btn" onclick="location.href='/add-car'" style="margin-top:20px">
                    Mashina qo‘shish
                </button>
            `;
        }
    }
}

init();