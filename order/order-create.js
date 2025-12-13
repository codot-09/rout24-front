document.addEventListener('DOMContentLoaded', () => {
  // URL parametri va token tekshiruvi
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

  // DOM elementlar (cache qilish)
  const elements = {
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
    modalCancel: document.getElementById('modalCancel'),
    paymentOptions: document.querySelectorAll('.payment-option')
  };

  // State
  let seatsCount = 1;
  let pricePerSeat = 0;
  let maxSeats = 1;

  // Orqaga qaytish
  elements.backBtn.addEventListener('click', () => history.back());

  // Joylar sonini o'zgartirish
  const updateSeatsCount = (delta) => {
    const newCount = seatsCount + delta;
    if (newCount < 1 || newCount > maxSeats) return;
    seatsCount = newCount;
    elements.seatsCount.textContent = seatsCount;
    updateTotalPrice();
  };

  elements.minusBtn.addEventListener('click', () => updateSeatsCount(-1));
  elements.plusBtn.addEventListener('click', () => updateSeatsCount(1));

  // Umumiy narxni yangilash
  const updateTotalPrice = () => {
    const total = seatsCount * pricePerSeat;
    elements.totalPrice.textContent = total.toLocaleString('uz-UZ');
  };

  // To'lov usulini faollashtirish
  elements.paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      elements.paymentOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
    });
  });

  // Modalni boshqarish
  const showSuccessModal = (message) => {
    elements.modalMessage.textContent = message;
    elements.modalOverlay.style.display = 'flex';
  };

  const hideModal = () => {
    elements.modalOverlay.style.display = 'none';
  };

  elements.modalOk.addEventListener('click', () => {
    hideModal();
    history.back(); // OK bosilganda orqaga qaytish
  });

  elements.modalCancel.addEventListener('click', hideModal);

  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) hideModal();
  });

  // Reys ma'lumotlarini yuklash
  const loadRouteDetails = async () => {
    try {
      const res = await fetch(`https://api.rout24.online/routes/${routeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const json = await res.json();

      if (!json.success) throw new Error('Maʼlumot topilmadi');

      const d = json.data;

      pricePerSeat = d.price || 0;
      maxSeats = d.seatsCount || 1;

      // Ma'lumotlarni UI ga joylashtirish
      elements.fromCity.textContent = d.from;
      elements.toCity.textContent = d.to;

      const departureDate = new Date(d.departureDate);
      elements.date.textContent = departureDate.toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      elements.time.textContent = departureDate.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      });

      elements.price.textContent = pricePerSeat.toLocaleString('uz-UZ');
      elements.seatsAvailable.textContent = maxSeats;

      // Boshlang'ich holatda joylar soni va narxni yangilash
      seatsCount = 1; // maxSeats ga qarab cheklash uchun
      elements.seatsCount.textContent = seatsCount;
      updateTotalPrice();

    } catch (err) {
      alert('Reys maʼlumotlarini yuklab bo‘lmadi');
      history.back();
    }
  };

  // Bron qilish
  const handleBooking = async () => {
    if (seatsCount > maxSeats) {
      alert(`Faqat ${maxSeats} ta joy qoldi!`);
      return;
    }

    const activePayment = document.querySelector('.payment-option.active');
    const paymentType = activePayment ? activePayment.dataset.type : 'CARD';

    // Tugmani vaqtincha o'chirib qo'yish (duplicate submit oldini olish)
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = 'Kuting...';

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
        // Faqat success bo'lganda modal ochiladi
        showSuccessModal(result.message || 'Chipta muvaffaqiyatli bron qilindi!');
      } else {
        alert(result.errors?.join('\n') || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Internet aloqasi yo‘q yoki server xatosi');
    } finally {
      // Tugmani qayta faollashtirish
      elements.submitBtn.disabled = false;
      elements.submitBtn.textContent = 'Bron qilish';
    }
  };

  elements.submitBtn.addEventListener('click', handleBooking);

  // Boshlang'ich yuklash
  loadRouteDetails();
});