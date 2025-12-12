const urlParams = new URLSearchParams(location.search);
const routeId = urlParams.get('id');

let seatsCount = 1;
let pricePerSeat = 0;
let maxSeats = 1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!routeId) return alert('Reys topilmadi');

  const token = localStorage.getItem('token');
  if (!token) return location.href = '/login';

  try {
    const res = await fetch(`https://api.rout24.online/routes/${routeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!json.success) throw 0;

    const d = json.data;
    pricePerSeat = d.price || 0;
    maxSeats = d.seatsCount || 1;

    document.getElementById('fromCity').textContent = d.from;
    document.getElementById('toCity').textContent = d.to;
    document.getElementById('date').textContent = new Date(d.departureDate).toLocaleDateString('uz-UZ', {weekday:'long', day:'numeric', month:'long'});
    document.getElementById('time').textContent = new Date(d.departureDate).toLocaleTimeString('uz-UZ', {hour:'2-digit', minute:'2-digit'});
    document.getElementById('price').textContent = (d.price || 0).toLocaleString('uz-UZ');
    document.getElementById('seatsAvailable').textContent = d.seatsCount;

    updateTotal();
  } catch (e) {
    alert('Reys maʼlumotlarini yuklab bo‘lmadi');
    history.back();
  }

  // To‘lov turi tanlash
  document.querySelectorAll('.payment-option').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('.payment-option').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
    };
  });

  // Bron qilish
  document.getElementById('submitBtn').onclick = async () => {
    if (seatsCount > maxSeats) return alert(`Faqat ${maxSeats} ta joy qoldi!`);

    const paymentType = document.querySelector('.payment-option.active').dataset.type;

    try {
      const res = await fetch('https://api.rout24.online/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          routId: routeId,
          seatsCount: seatsCount,
          paymentType: paymentType
        })
      });

      const result = await res.json();

      if (result.success) {
        document.getElementById('modalMessage').textContent = result.message || 'Chipta muvaffaqiyatli bron qilindi!';
        document.getElementById('modal').style.display = 'flex';
      } else {
        alert(result.errors?.join('\n') || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    }
  };
});

function changeSeats(delta) {
  const newCount = seatsCount + delta;
  if (newCount < 1 || newCount > maxSeats) return;
  seatsCount = newCount;
  document.getElementById('seatsCount').textContent = seatsCount;
  updateTotal();
}

function updateTotal() {
  const total = seatsCount * pricePerSeat;
  document.getElementById('totalPrice').textContent = total.toLocaleString('uz-UZ');
}