document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(location.search);
  const routeId = urlParams.get('id');

  if (!routeId) {
    alert('Reys topilmadi');
    history.back();
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) return location.href = '/login';

  // DOM elementlar
  const fromCityEl = document.getElementById('fromCity');
  const toCityEl = document.getElementById('toCity');
  const dateEl = document.getElementById('date');
  const timeEl = document.getElementById('time');
  const priceEl = document.getElementById('price');
  const seatsAvailableEl = document.getElementById('seatsAvailable');
  const seatsCountEl = document.getElementById('seatsCount');
  const totalPriceEl = document.getElementById('totalPrice');
  const submitBtn = document.getElementById('submitBtn');
  const minusBtn = document.querySelector('.minus');
  const plusBtn = document.querySelector('.plus');
  const paymentOptions = document.querySelectorAll('.payment-option');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalMessage = document.getElementById('modalMessage');
  const modalOk = document.getElementById('modalOk');
  const modalCancel = document.getElementById('modalCancel');

  let seatsCount = 1;
  let pricePerSeat = 0;
  let maxSeats = 1;

  // Fetch route details
  fetch(`https://api.rout24.online/routes/${routeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(json => {
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
    })
    .catch(() => {
      alert('Reys maʼlumotlarini yuklab bo‘lmadi');
      history.back();
    });

  // Seats selector
  minusBtn.addEventListener('click', () => changeSeats(-1));
  plusBtn.addEventListener('click', () => changeSeats(1));

  function changeSeats(delta) {
    const newCount = seatsCount + delta;
    if (newCount < 1 || newCount > maxSeats) return;
    seatsCount = newCount;
    seatsCountEl.textContent = seatsCount;
    updateTotal();
  }

  function updateTotal() {
    totalPriceEl.textContent = (seatsCount * pricePerSeat).toLocaleString('uz-UZ');
  }

  // Payment option
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

      if (res.status === 400) {
        alert('Siz allaqachon ushbu reys uchun bron qilgansiz!');
        return;
      }

      const result = await res.json();

      if (result.success) {
        // Modalni ochish
        modalMessage.textContent = result.message || 'Chipta muvaffaqiyatli bron qilindi!';
        modalOverlay.style.display = 'flex';
      } else {
        alert(result.errors?.join('\n') || 'Xatolik yuz berdi');
      }
    } catch {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    }
  });

  // Modalni yopish
  modalOk.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
    history.back();
  });
  modalCancel.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
  });
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
  });
});
