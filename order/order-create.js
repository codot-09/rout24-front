document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(location.search);
  const routeId = urlParams.get('id');

  if (!routeId) {
    alert('Reys topilmadi');
    history.back();
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    location.href = '/login';
    return;
  }

  const els = {
    fromCity: document.getElementById('fromCity'),
    toCity: document.getElementById('toCity'),
    date: document.getElementById('date'),
    time: document.getElementById('time'),
    price: document.getElementById('price'),
    seatsAvailable: document.getElementById('seatsAvailable'),
    seatsCount: document.getElementById('seatsCount'),
    totalPrice: document.getElementById('totalPrice'),
    submitBtn: document.getElementById('submitBtn'),
    backBtn: document.getElementById('backBtn'),
    minusBtn: document.getElementById('minusBtn'),
    plusBtn: document.getElementById('plusBtn'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalMessage: document.getElementById('modalMessage'),
    modalOk: document.getElementById('modalOk'),
    paymentOptions: document.querySelectorAll('.payment-option')
  };

  let seatsCount = 1;
  let pricePerSeat = 0;
  let maxSeats = 1;

  els.backBtn.addEventListener('click', () => history.back());

  const updateSeatsCount = (delta) => {
    const newCount = seatsCount + delta;
    if (newCount < 1 || newCount > maxSeats) return;
    seatsCount = newCount;
    els.seatsCount.textContent = seatsCount;
    updateTotalPrice();
  };

  els.minusBtn.addEventListener('click', () => updateSeatsCount(-1));
  els.plusBtn.addEventListener('click', () => updateSeatsCount(1));

  const updateTotalPrice = () => {
    const total = seatsCount * pricePerSeat;
    els.totalPrice.textContent = total.toLocaleString('uz-UZ');
  };

  els.paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      els.paymentOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
    });
  });

  const showSuccessModal = (message) => {
    els.modalMessage.textContent = message;
    els.modalOverlay.classList.add('show');
  };

  const hideModal = () => {
    els.modalOverlay.classList.remove('show');
  };

  els.modalOk.addEventListener('click', () => {
    hideModal();
    history.back();
  });

  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) hideModal();
  });

  const loadRouteDetails = async () => {
    try {
      const res = await fetch(`https://api.rout24.online/routes/${routeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Server javobi xato');

      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Maʼlumot topilmadi');

      const d = json.data;

      pricePerSeat = Number(d.price) || 0;
      maxSeats = Number(d.seatsCount) || 1;

      els.fromCity.textContent = d.from || '-';
      els.toCity.textContent = d.to || '-';

      const departureDate = new Date(d.departureDate);
      els.date.textContent = departureDate.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });
      els.time.textContent = departureDate.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

      els.price.textContent = pricePerSeat.toLocaleString('uz-UZ');
      els.seatsAvailable.textContent = maxSeats;

      seatsCount = 1;
      if (seatsCount > maxSeats) seatsCount = maxSeats;
      els.seatsCount.textContent = seatsCount;
      updateTotalPrice();

    } catch (err) {
      alert('Reys maʼlumotlarini yuklab bo‘lmadi');
      history.back();
    }
  };

  const handleBooking = async () => {
    if (seatsCount > maxSeats) {
      alert(`Faqat ${maxSeats} ta joy qoldi!`);
      return;
    }

    const activePayment = document.querySelector('.payment-option.active');
    const paymentType = activePayment?.dataset.type || 'CARD';

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'Kuting...';

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

      if (res.status === 400) {
        alert('Siz allaqachon ushbu reys uchun bron qilgansiz!');
        return;
      }

      if (result.success) {
        showSuccessModal(result.message || 'Chipta muvaffaqiyatli bron qilindi!');
      } else {
        alert(result.errors?.join('\n') || result.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = 'Bron qilish';
    }
  };

  els.submitBtn.addEventListener('click', handleBooking);

  loadRouteDetails();
});