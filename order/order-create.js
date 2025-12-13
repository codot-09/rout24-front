const urlParams = new URLSearchParams(location.search);
const routeId = urlParams.get('id');

let seatsCount = 1;
let pricePerSeat = 0;
let maxSeats = 1;

const fromCityEl = document.getElementById('fromCity');
const toCityEl = document.getElementById('toCity');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const priceEl = document.getElementById('price');
const seatsAvailableEl = document.getElementById('seatsAvailable');
const seatsCountEl = document.getElementById('seatsCount');
const totalPriceEl = document.getElementById('totalPrice');
const submitBtn = document.getElementById('submitBtn');
const modalOverlay = document.getElementById('modalOverlay');

document.addEventListener('DOMContentLoaded', async () => {
  if (!routeId) {
    alert('Reys topilmadi');
    history.back();
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) return location.href = '/login';

  try {
    const res = await fetch(`https://api.rout24.online/routes/${routeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!json.success) throw new Error('Maʼlumot topilmadi');

    const d = json.data;
    pricePerSeat = d.price || 0;
    maxSeats = d.seatsCount || 1;

    fromCityEl.textContent = d.from;
    toCityEl.textContent = d.to;
    dateEl.textContent = new Date(d.departureDate).toLocaleDateString('uz-UZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    timeEl.textContent = new Date(d.departureDate).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
    priceEl.textContent = pricePerSeat.toLocaleString('uz-UZ');
    seatsAvailableEl.textContent = maxSeats;

    updateTotal();
  } catch (err) {
    alert('Reys maʼlumotlarini yuklab bo‘lmadi');
    history.back();
  }

  // Payment option
  const paymentOptions = document.querySelectorAll('.payment-option');
  paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      paymentOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
    });
  });

  // Booking
  submitBtn.addEventListener('click', async () => {
    if (seatsCount > maxSeats) {
      alert(`Faqat ${maxSeats} ta joy qoldi!`);
      return;
    }

    const activePayment = document.querySelector('.payment-option.active');
    const paymentType = activePayment ? activePayment.dataset.type : 'CARD';

    try {
      const res = await fetch('https://api.rout24.online/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          routId: routeId,
          seatsCount,
          paymentType
        })
      });
      const result = await res.json();

      if (result.success) {
        openModal(result.message || 'Chipta muvaffaqiyatli bron qilindi!');
      } else {
        alert(result.errors?.join('\n') || 'Xatolik yuz berdi');
      }
    } catch {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    }
  });
});

// Seats selector
function changeSeats(delta) {
  const newCount = seatsCount + delta;
  if (newCount < 1 || newCount > maxSeats) return;
  seatsCount = newCount;
  seatsCountEl.textContent = seatsCount;
  updateTotal();
}

// Update total price
function updateTotal() {
  totalPriceEl.textContent = (seatsCount * pricePerSeat).toLocaleString('uz-UZ');
}

// Modal functions
function openModal(message) {
  modalOverlay.querySelector('h2').textContent = 'Muvaffaqiyatli!';
  modalOverlay.querySelector('p').textContent = message;
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
  history.back(); // sahifani avtomatik yopish yoki boshqa sahifaga yo'naltirish
}

// Close modal on overlay click
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
