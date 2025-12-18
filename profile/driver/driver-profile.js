const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

const API_BASE = 'https://api.rout24.online';

const content      = document.getElementById('content');
const fullNameEl   = document.getElementById('fullName');
const profileImg   = document.getElementById('profileImg');
const statusBadge  = document.getElementById('statusBadge');
const statusText   = document.getElementById('statusText');
const statusRing   = document.getElementById('statusRing');
const profileCard  = document.querySelector('.profile-card');

let licenseUrl = '';
let passportUrl = '';

async function loadProfile() {
    try {
        const result = await authFetch('/drivers/profile');
        if (!result.success || !result.data) throw new Error('Data empty');

        const data = result.data;
        fullNameEl.textContent = data.fullName || 'Haydovchi';

        const defaultAvatar = '/assets/default.png';
        profileImg.src = data.imageUrl || defaultAvatar;
        profileImg.onerror = () => { profileImg.src = defaultAvatar; };

        updateStatusUI(data.status);
        renderContentByStatus(data.status);
    } catch (error) {
        console.error('Profile error:', error);
    }
}

async function authFetch(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return response.json();
}

function updateStatusUI(status) {
    profileCard.classList.remove('confirmed', 'waiting', 'pending', 'not-confirmed');
    statusRing.classList.remove('visible', 'green', 'yellow', 'red');

    let config = { card: 'not-confirmed', ring: 'red', text: 'Noma‘lum' };

    switch (status) {
        case 'CONFIRMED':
            config = { card: 'confirmed', ring: 'green', text: 'Faol' };
            break;
        case 'WAITING':
        case 'PENDING':
            config = { card: 'waiting', ring: 'yellow', text: 'Tekshiruvda' };
            break;
        case 'NOT_CONFIRMED':
            config = { card: 'not-confirmed', ring: 'red', text: 'To‘ldirish kerak' };
            break;
    }

    profileCard.classList.add(config.card);
    statusRing.classList.add('visible', config.ring);
    if (statusBadge) statusBadge.textContent = config.text;
    if (statusText) statusText.textContent = config.text;
}

function renderContentByStatus(status) {
    if (status === 'NOT_CONFIRMED') {
        renderVerificationForm();
    } else if (['WAITING', 'PENDING'].includes(status)) {
        content.innerHTML = `<p class="status-msg">Ma'lumotlaringiz tekshirilmoqda. Tez orada javob beramiz.</p>`;
    } else if (status === 'CONFIRMED') {
        content.innerHTML = `<div id="vehicle"></div><div class="action-list" id="actions"></div>`;
        loadVehicle();
        renderActions();
    }
}

function renderVerificationForm() {
    content.innerHTML = `
        <div class="form">
            <div class="form-group">
                <label>Telefon raqami</label>
                <input type="tel" id="phoneNumber" placeholder="+998 90 123 45 67" maxlength="13">
            </div>
            <div class="form-group">
                <label>Haydovchilik guvohnomasi</label>
                <div class="upload-box" id="licenseBox">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <p>Yuklash</p>
                    <img id="licensePrev" style="display:none;">
                    <input type="file" id="licenseInput" accept="image/*" hidden>
                </div>
            </div>
            <div class="form-group">
                <label>Passport / ID karta</label>
                <div class="upload-box" id="passportBox">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <p>Yuklash</p>
                    <img id="passportPrev" style="display:none;">
                    <input type="file" id="passportInput" accept="image/*" hidden>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tug‘ilgan kun</label>
                    <input type="date" id="birthDate">
                </div>
                <div class="form-group">
                    <label>Jins</label>
                    <select id="gender">
                        <option value="" disabled selected>Tanlang</option>
                        <option value="MALE">Erkak</option>
                        <option value="FEMALE">Ayol</option>
                    </select>
                </div>
            </div>
            <button class="btn" id="submitBtn" disabled>Yuborish</button>
        </div>
    `;

    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', (e) => {
        if (!e.target.value.startsWith('+998')) e.target.value = '+998';
        checkSubmitButton();
    });

    document.getElementById('licenseBox').onclick = () => document.getElementById('licenseInput').click();
    document.getElementById('passportBox').onclick = () => document.getElementById('passportInput').click();
    
    document.getElementById('licenseInput').onchange = e => handleImageUpload(e, 'license');
    document.getElementById('passportInput').onchange = e => handleImageUpload(e, 'passport');
    
    ['birthDate', 'gender'].forEach(id => {
        document.getElementById(id).onchange = checkSubmitButton;
    });

    document.getElementById('submitBtn').onclick = submitVerification;
}

async function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById(`${type}Prev`);
    const box = document.getElementById(`${type}Box`);
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    box.querySelectorAll('svg, p').forEach(el => el.style.display = 'none');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/api/upload/image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const url = await response.text();
        if (type === 'license') licenseUrl = url;
        if (type === 'passport') passportUrl = url;
        checkSubmitButton();
    } catch (err) {
        alert('Rasm yuklashda xatolik');
    }
}

function checkSubmitButton() {
    const phone = document.getElementById('phoneNumber')?.value;
    const birthDate = document.getElementById('birthDate')?.value;
    const gender = document.getElementById('gender')?.value;
    const uzPhoneRegex = /^\+998\d{9}$/;

    const isValid = licenseUrl && passportUrl && birthDate && gender && uzPhoneRegex.test(phone);
    document.getElementById('submitBtn').disabled = !isValid;
}

async function submitVerification() {
    const btn = document.getElementById('submitBtn');
    const payload = {
        phone: document.getElementById('phoneNumber').value,
        driverLicense: licenseUrl,
        passportId: passportUrl,
        birthDate: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value
    };

    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    try {
        const result = await authFetch('/drivers/finish-account', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (result.success) {
            window.location.reload();
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        alert(err.message || 'Xatolik yuz berdi');
        btn.disabled = false;
        btn.textContent = 'Yuborish';
    }
}

async function loadVehicle() {
    try {
        const result = await authFetch('/vehicles/my');
        if (!result.success || !result.data) throw new Error();
        const v = result.data;
        document.getElementById('vehicle').innerHTML = `
            <div class="vehicle-card">
                <img src="${v.images?.[0] || '/assets/default-car.jpg'}">
                <div class="vehicle-info">
                    <h3>${v.name}</h3>
                    <p>${v.plateNumber}</p>
                </div>
            </div>`;
    } catch {
        document.getElementById('vehicle').innerHTML = `<button class="btn" onclick="location.href='/add-car'">Mashina qo‘shish</button>`;
    }
}

function renderActions() {
    const actions = [
        { text: "Shartlar", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", href: "/terms" },
        { text: "Yordam", icon: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", href: "/support" },
        { text: "Chiqish", icon: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z", onclick: "handleLogout()" }
    ];
    document.getElementById('actions').innerHTML = actions.map(a => `
        <div class="action-item" onclick="${a.onclick || `location.href='${a.href}'`}">
            <span>${a.text}</span>
            <svg viewBox="0 0 24 24"><path d="${a.icon}"/></svg>
        </div>`).join('');
}

function handleLogout() {
    if (confirm('Chiqishni tasdiqlaysizmi?')) {
        localStorage.clear();
        window.location.href = '/login';
    }
}

document.addEventListener('DOMContentLoaded', loadProfile);