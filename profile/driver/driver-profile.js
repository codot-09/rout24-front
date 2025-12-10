const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const contentArea = document.getElementById('contentArea');
const fullNameEl = document.getElementById('fullName');
const profileImgEl = document.getElementById('profileImg');
const statusBadgeEl = document.getElementById('statusBadge');

let licenseUrl = '';
let passportUrl = '';

async function loadProfile() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error();

        const { fullName, imageUrl, status } = json.data;

        fullNameEl.textContent = fullName || 'Haydovchi';
        profileImgEl.src = imageUrl || '/assets/default.png';

        statusBadgeEl.className = 'status-badge';
        statusBadgeEl.textContent = status === 'NOT_CONFIRMED' ? 'To‘ldirish kerak' :
                                   status === 'WAITING' ? 'Tekshiruvda' : 'Faol';
        statusBadgeEl.classList.add(
            status === 'NOT_CONFIRMED' ? 'status-not-confirmed' :
            status === 'WAITING' ? 'status-waiting' : 'status-confirmed'
        );

        renderContent(status);
    } catch {
        alert('Profil yuklanmadi');
    }
}

function renderContent(status) {
    if (status === 'NOT_CONFIRMED') {
        contentArea.innerHTML = `
            <div class="form-group">
                <label>Haydovchilik guvohnomasi (rasm)</label>
                <div class="upload-box" id="licenseBox" onclick="document.getElementById('licenseInput').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#800000" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <p>Yuklash</p>
                    <img id="licensePreview" style="display:none">
                    <input type="file" id="licenseInput" accept="image/*" hidden>
                </div>
            </div>

            <div class="form-group">
                <label>Passport/ID karta (rasm)</label>
                <div class="upload-box" id="passportBox" onclick="document.getElementById('passportInput').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#800000" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <p>Yuklash</p>
                    <img id="passportPreview" style="display:none">
                    <input type="file" id="passportInput" accept="image/*" hidden>
                </div>
            </div>

            <div class="form-group">
                <label>Tug‘ilgan kun</label>
                <input type="date" id="birthDate" required>
            </div>

            <div class="form-group">
                <label>Jins</label>
                <select id="gender" required>
                    <option value="" disabled selected>Tanlang</option>
                    <option value="MALE">Erkak</option>
                    <option value="FEMALE">Ayol</option>
                </select>
            </div>

            <button class="btn-primary" id="submitBtn" onclick="submitVerification()" disabled>
                Ma'lumotlarni yuborish
            </button>
        `;

        // File yuklash hodisalari
        document.getElementById('licenseInput').addEventListener('change', e => handleFile(e, 'license'));
        document.getElementById('passportInput').addEventListener('change', e => handleFile(e, 'passport'));
    }
    else if (status === 'WAITING') {
        contentArea.innerHTML = `<p style="font-size:19px;opacity:0.88;line-height:1.6">Ma'lumotlaringiz admin tomonidan tekshirilmoqda.<br>Tez orada javob beramiz</p>`;
    }
    else if (status === 'CONFIRMED') {
        contentArea.innerHTML = `<div class="action-list" id="actions"></div><div id="vehicleContainer"></div>`;
        loadActions();
        loadVehicle();
    }
}

async function handleFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById(type + 'Preview');
    const box = document.getElementById(type + 'Box');
    const reader = new FileReader();

    reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = 'block';
        box.querySelector('svg, p').style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Yuklash
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('https://api.rout24.online/api/upload/image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const json = await res.json();
        if (json.success && json.data) {
            if (type === 'license') licenseUrl = json.data;
            if (type === 'passport') passportUrl = json.data;

            if (licenseUrl && passportUrl) {
                document.getElementById('submitBtn').disabled = false;
            }
        } else {
            alert('Rasm yuklashda xatolik');
        }
    } catch {
        alert('Internet aloqasi yo‘q');
    }
}

async function submitVerification() {
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;

    if (!licenseUrl || !passportUrl || !birthDate || !gender) {
        alert('Barcha maydonlarni to‘ldiring');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    try {
        const res = await fetch('https://api.rout24.online/drivers/finish-account', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                driverLicense: licenseUrl,
                passportId: passportUrl,
                birthDate: birthDate,
                gender: gender
            })
        });

        const json = await res.json();
        if (json.success) {
            alert('Ma‘lumotlar muvaffaqiyatli yuborildi! Tekshiruvga yuborildi');
            location.reload();
        } else {
            alert('Xatolik: ' + (json.message || 'Qayta urinib ko‘ring'));
            btn.disabled = false;
            btn.textContent = 'Malumotlarni yuborish';
        }
    } catch {
        alert('Internet aloqasi yo‘q');
        btn.disabled = false;
        btn.textContent = 'Malumotlarni yuborish';
    }
}

function loadActions() {
    const actions = [
        { text: "Mashina qo‘shish", icon: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9h14v2H7V9z" },
        { text: "Ilova shartlari", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
        { text: "Xavfsizlik", icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" },
        { text: "Yordam", icon: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" },
        { text: "Chiqish", icon: "M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14", onclick: "logout()" }
    ];
    document.getElementById('actions').innerHTML = actions.map(a => `
        <div class="action-item" ${a.onclick?`onclick="${a.onclick}"`:''}>
            <span>${a.text}</span>
            <svg viewBox="0 0 24 24"><path d="${a.icon}"/></svg>
        </div>
    `).join('');
}

async function loadVehicle() {
    try {
        const res = await fetch('https://api.rout24.online/vehicles/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 404) throw 404;
        const json = await res.json();
        if (!json.success || !json.data) throw new Error();

        const v = json.data;
        document.getElementById('vehicleContainer').innerHTML = `
            <div class="vehicle-card">
                <div class="vehicle-img"><img src="${v.images?.[0] || '/assets/default-car.jpg'}" alt="Mashina"></div>
                <div class="vehicle-info">
                    <h3>${v.name || 'Noma‘lum'}</h3>
                    <p>${v.plateNumber}</p>
                    <p>${v.type}</p>
                </div>
            </div>
        `;
    } catch (e) {
        if (e === 404) {
            document.getElementById('vehicleContainer').innerHTML = `
                <p style="margin:30px 0;font-size:18px;opacity:0.8">Mashina hali qo‘shilmagan</p>
                <button class="btn-primary" onclick="alert('Tez orada mavjud bo‘ladi')">Mashina qo‘shish</button>
            `;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    location.href = 'login.html';
}

loadProfile();