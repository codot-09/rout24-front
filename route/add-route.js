const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const regions = ["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];

const fromSelect = document.getElementById('from');
const toSelect   = document.getElementById('to');

regions.forEach(r => {
    const text = r.charAt(0) + r.slice(1).toLowerCase();
    fromSelect.add(new Option(text, r));
    toSelect.add(new Option(text, r));
});

document.getElementById('routeForm').addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Yuborilmoqda...';

    const payload = {
        from: fromSelect.value,
        to: toSelect.value,
        fromAddress: document.getElementById('fromAddress').value.trim(),
        toAddress: document.getElementById('toAddress').value.trim(),
        seatsCount: parseInt(document.getElementById('seats').value),
        price: parseInt(document.getElementById('price').value),
        departureDate: new Date(document.getElementById('departure').value).toISOString()
    };

    try {
        const res = await fetch('https://api.rout24.online/routes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.success) {
            alert('Reys muvaffaqiyatli yaratildi!');
            location.href = '/routes';
        } else {
            throw new Error(json.message || 'Xato yuz berdi');
        }
    } catch (err) {
        alert('Xatolik: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reys yaratish';
    }
});