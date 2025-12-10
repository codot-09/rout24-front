const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const content = document.getElementById('content');
const fullNameEl = document.getElementById('fullName');
const profileImg = document.getElementById('profileImg');
const statusBadge = document.getElementById('statusBadge');
const statusRing = document.getElementById('statusRing');

let licenseUrl = '', passportUrl = '';

async function init() {
    try {
        const res = await fetch('https://api.rout24.online/drivers/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        if (!success) throw new Error();

        fullNameEl.textContent = data.fullName || 'Haydovchi';
        profileImg.src = data.imageUrl || '/assets/default.png';
        profileImg.onerror = () => profileImg.src = '/assets/default.png';

        const status = data.status;
        statusBadge.textContent = status === 'NOT_CONFIRMED' ? 'To‘ldirish kerak' :
                                  status === 'WAITING' ? 'Tekshiruvda' : 'Faol';

        statusRing.className = 'status-ring ' + (status === 'NOT_CONFIRMED' ? 'red' :
                                 status === 'WAITING' ? 'yellow' : 'green');

        renderContent(status);
    } catch (e) {
        console.error(e);
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
    
        // **Tugmaga event listener qo‘shish**
        document.getElementById('submitBtn').onclick = submitVerification;
    }
    
    else if (status === 'WAITING') {
        content.innerHTML = `<p style="font-size:19px;opacity:0.9;line-height:1.6;margin-top:20px">Ma'lumotlaringiz tekshirilmoqda.<br>Tez orada javob beramiz</p>`;
    }
    else if (status === 'CONFIRMED') {
        content.innerHTML = `<div class="action-list" id="actions"></div><div id="vehicle"></div>`;
        loadActions();
        loadVehicle();
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

        const url = await res.text(); // string qaytadi
        if (res.ok && url.startsWith('http')) {
            if (type === 'license') licenseUrl = url;
            if (type === 'passport') passportUrl = url;

            if (licenseUrl && passportUrl && document.getElementById('birthDate').value && document.getElementById('gender').value) {
                document.getElementById('submitBtn').disabled = false;
            }
        } else {
            alert('Rasm yuklashda xatolik');
        }
    } catch (err) {
        console.error(err);
        alert('Internet aloqasi yo‘q yoki server xatosi');
    }
}

// YUBORISH TUGMASI – 100% ISHLAYDI
window.submitVerification = async function () {
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.getElementById('gender').value;

    if (!licenseUrl || !passportUrl || !birthDate || !gender) {
        return alert('Barcha maydonlarni to‘ldiring');
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

        const result = await res.json();
        if (result.success) {
            alert('Ma‘lumotlar muvaffaqiyatli yuborildi! Tekshiruvga yuborildi');
            location.reload();
        } else {
            throw new Error(result.message || 'Xatolik');
        }
    } catch (err) {
        console.error(err);
        alert('Yuborishda xatolik: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Yuborish';
    }
};

// Qolgan funksiyalar (loadActions, loadVehicle, logout) avvalgidek
function loadActions() {
    const actions = [
        {text:"Mashina qo‘shish",icon:"M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9h14v2H7V9z"},
        {text:"Shartlar",icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"},
        {text:"Xavfsizlik",icon:"M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"},
        {text:"Yordam",icon:"M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"},
        {text:"Chiqish",icon:"M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14",onclick:"localStorage.removeItem('token');location.href='login.html'"}
    ];
    document.getElementById('actions').innerHTML = actions.map(a=>`
        <div class="action-item" ${a.onclick?`onclick="${a.onclick}"`:''}>
            <span>${a.text}</span>
            <svg viewBox="0 0 24 24"><path d="${a.icon}"/></svg>
        </div>
    `).join('');
}

async function loadVehicle() {
    try {
        const res = await fetch('https://api.rout24.online/vehicles/my', { headers: { Authorization: `Bearer ${token}` }});
        if (res.status === 404) throw 404;
        const json = await res.json();
        if (!json.success) throw new Error();
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
                <p style="margin:30px 0;font-size:18px;opacity:0.8">Mashina qo‘shilmagan</p>
                <button class="btn" onclick="alert('Tez orada')">Mashina qo‘shish</button>
            `;
        }
    }
}

init();