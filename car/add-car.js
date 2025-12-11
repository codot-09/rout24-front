const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const plateInput = document.getElementById('plate');
const nameInput = document.getElementById('name');
const typeSelect = document.getElementById('type');
const photoInput = document.getElementById('photoInput');
const imagesGrid = document.getElementById('imagesGrid');
const submitBtn = document.getElementById('submitBtn');
const plateError = document.getElementById('plateError');
const photoError = document.getElementById('photoError');

let imageUrls = [];

// O‘zbekiston davlat raqami validatsiyasi
function validatePlate(plate) {
    plate = plate.toUpperCase().replace(/\s/g, '');
    const patterns = [
        /^\d{2}[A-Z]{1}\d{3}[A-Z]{2}$/,   // 01A234BC
        /^\d{2}[A-Z]{3}\d{3}$/,           // 01ABC234
        /^\d{3}[A-Z]{2}\d{3}$/,           // 123AB456
        /^\d{2}[A-Z]{1}\d{5}$/            // 01A23456 (yangi format)
    ];
    return patterns.some(p => p.test(plate));
}

// Raqamni formatlash
plateInput.addEventListener('input', () => {
    let val = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 9) val = val.slice(0, 9);
    plateInput.value = val;

    if (val && !validatePlate(val)) {
        plateError.textContent = 'Noto‘g‘ri raqam formati';
        submitBtn.disabled = true;
    } else {
        plateError.textContent = '';
        checkForm();
    }
});

// Rasm qo‘shish
document.getElementById('addPhoto').onclick = () => photoInput.click();
photoInput.onchange = async () => {
    const files = Array.from(photoInput.files);
    if (files.length + imageUrls.length > 6) {
        alert('Maksimum 6 ta rasm');
        return;
    }

    for (const file of files) {
        const div = document.createElement('div');
        div.className = 'image-item';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        const remove = document.createElement('button');
        remove.textContent = '×';
        remove.className = 'remove-photo';
        remove.onclick = () => {
            div.remove();
            imageUrls = imageUrls.filter(u => u !== div.dataset.url);
            checkForm();
        };
        div.append(img, remove);
        imagesGrid.appendChild(div);

        // Yuklash
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
                div.dataset.url = url;
                imageUrls.push(url);
                checkForm();
            } else throw new Error();
        } catch {
            div.remove();
            alert('Rasm yuklanmadi');
        }
    }
    photoInput.value = '';
};

// Form tekshiruvi
function checkForm() {
    const valid = validatePlate(plateInput.value) &&
                  nameInput.value.trim() &&
                  imageUrls.length > 0;
    submitBtn.disabled = !valid;
}
[nameInput, typeSelect].forEach(el => el.oninput = checkForm);

// Yuborish
submitBtn.onclick = async () => {
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Yuborilmoqda...';

    const payload = {
        plateNumber: plateInput.value.toUpperCase().replace(/\s/g, ''),
        name: nameInput.value.trim(),
        type: typeSelect.value,
        images: imageUrls
    };

    try {
        const res = await fetch('https://api.rout24.online/vehicles', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
            alert('Mashina muvaffaqiyatli qo‘shildi!');
            history.back();
        } else {
            throw new Error(json.message || 'Xatolik');
        }
    } catch (err) {
        alert('Xatolik: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Qo‘shish';
    }
};