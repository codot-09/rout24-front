// Token tekshiruvi
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// API base URL
const API_BASE = 'https://api.rout24.online';

// DOM elementlar
const content      = document.getElementById('content');
const fullNameEl   = document.getElementById('fullName');
const profileImg   = document.getElementById('profileImg');
const statusBadge  = document.getElementById('statusBadge');
const statusText   = document.getElementById('statusText'); // agar alohida span bo‘lsa
const statusRing   = document.getElementById('statusRing');
const profileCard  = document.querySelector('.profile-card');

// Rasm upload uchun o‘zgaruvchilar
let licenseUrl = '';
let passportUrl = '';

// Profil ma'lumotlarini yuklash
async function loadProfile() {
    try {
        const result = await authFetch('/drivers/profile');

        if (!result.success || !result.data) {
            throw new Error('Profil ma‘lumotlari topilmadi');
        }

        const data = result.data;

        // Umumiy ma'lumotlar
        fullNameEl.textContent = data.fullName || 'Haydovchi';

        const defaultAvatar = '/assets/default.png';
        profileImg.src = data.imageUrl || defaultAvatar;
        profileImg.onerror = () => { profileImg.src = defaultAvatar; };

        // Statusni aniqlash va UI ni yangilash
        updateStatusUI(data.status);

        // Statusga qarab kontentni render qilish
        renderContentByStatus(data.status);

    } catch (error) {
        console.error('Profil yuklanmadi:', error);
        alert('Profil yuklanmadi. Internet aloqasini tekshiring.');
    }
}

// Authenticated fetch helper
async function authFetch(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
    }

    return response.json();
}

// Statusga qarab UI ni yangilash
function updateStatusUI(status) {
    // Oldingi classlarni tozalash
    profileCard.classList.remove('confirmed', 'waiting', 'pending', 'not-confirmed', 'rejected');
    statusRing.classList.remove('visible', 'green', 'yellow', 'red');

    let cardClass = '';
    let ringClass = '';
    let badgeText = 'Noma‘lum';

    switch (status) {
        case 'CONFIRMED':
            cardClass = 'confirmed';
            ringClass = 'green';
            badgeText = 'Faol';
            break;
        case 'WAITING':
        case 'PENDING':
            cardClass = 'waiting';
            ringClass = 'yellow';
            badgeText = 'Tekshiruvda';
            break;
        case 'NOT_CONFIRMED':
            cardClass = 'not-confirmed';
            ringClass = 'red';
            badgeText = 'To‘ldirish kerak';
            break;
        default:
            cardClass = 'not-confirmed';
            ringClass = 'red';
            badgeText = 'Noma‘lum';
    }

    profileCard.classList.add(cardClass);
    statusRing.classList.add('visible', ringClass);
    if (statusBadge) statusBadge.textContent = badgeText;
    if (statusText) statusText.textContent = badgeText;
}

// Statusga qarab kontentni render qilish
function renderContentByStatus(status) {
    if (status === 'NOT_CONFIRMED') {
        renderVerificationForm();
    } else if (status === 'WAITING' || status === 'PENDING') {
        content.innerHTML = `
            <p style="text-align:center;font-size:19px;line-height:1.6;margin-top:32px;opacity:0.9;">
                Ma'lumotlaringiz tekshirilmoqda.<br>
                Tez orada javob beramiz.
            </p>
        `;
    } else if (status === 'CONFIRMED') {
        content.innerHTML = `
            <div id="vehicle"></div>
            <div class="action-list" id="actions"></div>
        `;
        loadVehicle();
        renderActions();
    }
}

// Tasdiqlash formasi
function renderVerificationForm() {
    content.innerHTML = `
        <div class="form">
            <div class="form-group">
                <label for="licenseInput">Haydovchilik guvohnomasi</label>
                <div class="upload-box" id="licenseBox">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <p>Yuklash</p>
                    <img id="licensePrev" style="display:none;" alt="Guvohnoma preview">
                    <input type="file" id="licenseInput" accept="image/*" hidden>
                </div>
            </div>

            <div class="form-group">
                <label for="passportInput">Passport/ID karta</label>
                <div class="upload-box" id="passportBox">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <p>Yuklash</p>
                    <img id="passportPrev" style="display:none;" alt="Passport preview">
                    <input type="file" id="passportInput" accept="image/*" hidden>
                </div>
            </div>

            <div class="form-group">
                <label for="birthDate">Tug‘ilgan kun</label>
                <input type="date" id="birthDate">
            </div>

            <div class="form-group">
                <label for="gender">Jins</label>
                <select id="gender">
                    <option value="" disabled selected>Tanlang</option>
                    <option value="MALE">Erkak</option>
                    <option value="FEMALE">Ayol</option>
                </select>
            </div>

            <button class="btn" id="submitBtn" disabled>Yuborish</button>
        </div>
    `;

    // Event listeners
    document.getElementById('licenseBox').addEventListener('click', () => document.getElementById('licenseInput').click());
    document.getElementById('passportBox').addEventListener('click', () => document.getElementById('passportInput').click());
    document.getElementById('licenseInput').addEventListener('change', e => handleImageUpload(e, 'license'));
    document.getElementById('passportInput').addEventListener('change', e => handleImageUpload(e, 'passport'));
    document.getElementById('submitBtn').addEventListener('click', submitVerification);

    // Real-time tugma faollashtirish
    ['birthDate', 'gender'].forEach(id => {
        document.getElementById(id).addEventListener('change', checkSubmitButton);
    });
}

// Rasm yuklash
async function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById(type + 'Prev');
    const box = document.getElementById(type + 'Box');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    box.querySelector('svg').style.display = 'none';
    box.querySelector('p').style.display = 'none';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/api/upload/image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error();

        const url = await response.text();
        if (!url.startsWith('http')) throw new Error();

        if (type === 'license') licenseUrl = url;
        if (type === 'passport') passportUrl = url;

        checkSubmitButton();
    } catch (err) {
        alert('Rasm yuklashda xatolik yuz berdi');
        console.error(err);
    }
}

// Tugma faolligini tekshirish
function checkSubmitButton() {
    const birthDate = document.getElementById('birthDate')?.value;
    const gender = document.getElementById('gender')?.value;

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn && licenseUrl && passportUrl && birthDate && gender) {
        submitBtn.disabled = false;
    }
}

// Tasdiqlash yuborish
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
        const result = await authFetch('/drivers/finish-account', {
            method: 'PUT',
            body: JSON.stringify({
                driverLicense: licenseUrl,
                passportId: passportUrl,
                birthDate,
                gender
            })
        });

        if (result.success) {
            alert('Ma‘lumotlar muvaffaqiyatli yuborildi! Tekshiruvga yuborildi.');
            window.location.reload();
        } else {
            throw new Error(result.message || 'Xatolik');
        }
    } catch (err) {
        console.error(err);
        alert('Yuborishda xatolik yuz berdi');
        btn.disabled = false;
        btn.textContent = 'Yuborish';
    }
}

// Mashina ma'lumotlarini yuklash
async function loadVehicle() {
    try {
        const result = await authFetch('/vehicles/my');

        if (!result.success || !result.data) throw new Error();

        const v = result.data;

        document.getElementById('vehicle').innerHTML = `
            <div class="vehicle-card">
                <img src="${v.images?.[0] || '/assets/default-car.jpg'}" alt="${v.name || 'Mashina'}">
                <div class="vehicle-info">
                    <h3>${v.name || 'Noma‘lum model'}</h3>
                    <p>${v.plateNumber || ''}</p>
                    <p>${v.type || ''}</p>
                </div>
            </div>
        `;
    } catch (error) {
        if (error.message.includes('404')) {
            document.getElementById('vehicle').innerHTML = `
                <button class="btn" onclick="window.location.href='/driver/add-car'" style="margin-top:20px">
                    Mashina qo‘shish
                </button>
            `;
        } else {
            console.error('Mashina yuklanmadi:', error);
        }
    }
}

// Action list (CONFIRMED holatida)
function renderActions() {
    const actions = [
        { text: "Mashina qo‘shish", icon: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9h14v2H7V9z", href: "/driver/add-car" },
        { text: "Shartlar", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", href: "/terms" },
        { text: "Xavfsizlik", icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z", href: "/security" },
        { text: "Yordam", icon: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z", href: "/support" },
        { text: "Chiqish", icon: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z", onclick: "handleLogout()" }
    ];

    // Agar mashina bo‘lsa "Mashina qo‘shish" ni o‘chirish
    const hasVehicle = !!document.getElementById('vehicle').innerHTML.includes('vehicle-card');
    const filteredActions = hasVehicle ? actions.filter(a => a.text !== "Mashina qo‘shish") : actions;

    document.getElementById('actions').innerHTML = filteredActions.map(action => `
        <div class="action-item" ${action.href ? `onclick="window.location.href='${action.href}'"` : action.onclick ? `onclick="${action.onclick}"` : ''} role="button">
            <span>${action.text}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${action.icon}"/></svg>
        </div>
    `).join('');
}

// Chiqish funksiyasi
function handleLogout() {
    if (confirm('Hisobdan chiqishni xohlaysizmi?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    }
}

// Sahifa yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});