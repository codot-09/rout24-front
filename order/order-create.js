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

    // Seats initial display
    document.getElementById('seatsCount').textContent = seatsCount;
    updateTotal();
  } catch (e) {
    alert('Reys maʼlumotlarini yuklab bo‘lmadi');
    history.back();
  }

  // Payment options
  const paymentOptions = document.querySelectorAll('.payment-option');
  if(paymentOptions.length) paymentOptions[0].classList.add('active'); // Default first option
  paymentOptions.forEach(el => {
    el.addEventListener('click', () => {
      paymentOptions.forEach(x => x.classList.remove('active'));
      el.classList.add('active');
    });
  });

  // Seats change buttons
  document.getElementById('increaseSeats').onclick = () => changeSeats(1);
  document.getElementById('decreaseSeats').onclick = () => changeSeats(-1);

  // Order submit
  document.getElementById('submitBtn').onclick = async () => {
    if (seatsCount > maxSeats) return alert(`Faqat ${maxSeats} ta joy qoldi!`);

    const activePayment = document.querySelector('.payment-option.active');
    if(!activePayment) return alert('Iltimos, to‘lov turini tanlang');
    const paymentType = activePayment.dataset.type;

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Jarayon davom etmoqda...';

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
        // Open modal with message
        document.getElementById('modalMessage').textContent = result.message || 'Chipta muvaffaqiyatli bron qilindi!';
        document.getElementById('modalOverlay').classList.add('show');
      } else {
        alert(result.errors?.join('\n') || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    } finally {
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('submitBtn').textContent = 'Bron qilish';
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

// Modal functions
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}
