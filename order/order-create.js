document.addEventListener('DOMContentLoaded', () => {
  // URL va token tekshiruvi
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

  // DOM elementlarni cache qilish
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
    modalCancel: document.getElementById('modalCancel'),
    paymentOptions: document.querySelectorAll('.payment-option')
  };

  // Holat (state)
  let seatsCount = 1;
  let pricePerSeat = 0;
  let maxSeats = 1;

  // Orqaga qaytish
  els.backBtn.addEventListener('click', () => history.back());

  // Joylar sonini o'zgartirish
  const updateSeatsCount = (delta) => {
    const newCount = seatsCount + delta;
    if (newCount < 1 || newCount > maxSeats) return;
    seatsCount = newCount;
    els.seatsCount.textContent = seatsCount;
    updateTotalPrice();
  };

  els.minusBtn.addEventListener('click', () => updateSeatsCount(-1));
  els.plusBtn.addEventListener('click', () => updateSeatsCount(1));

  // Umumiy narxni yangilash
  const updateTotalPrice = () => {
    const total = seatsCount * pricePerSeat;
    els.totalPrice.textContent = total.toLocaleString('uz-UZ');
  };

  // To'lov usulini tanlash
  els.paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      els.paymentOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
    });
  });

  // Modal boshqaruvi (CSS .show klassidan foydalanamiz – animatsiya uchun)
  const showSuccessModal = (message) => {
    els.modalMessage.textContent = message;
    els.modalOverlay.classList.add('show');
  };

  const hideModal = () => {
    els.modalOverlay.classList.remove('show');
  };

  els.modalOk.addEventListener('click', () => {
    hideModal();
    history.back(); // OK bosilganda orqaga qaytish
  });

  els.modalCancel.addEventListener('click', hideModal);

  // Overlay tashqarisiga bosilganda yopish
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) hideModal();
  });

  // Reys ma'lumotlarini yuklash
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

      // UI ni to'ldirish
      els.fromCity.textContent = d.from || '-';
      els.toCity.textContent = d.to || '-';

      const departureDate = new Date(d.departureDate);
      els.date.textContent = departureDate.toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      els.time.textContent = departureDate.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      });

      els.price.textContent = pricePerSeat.toLocaleString('uz-UZ');
      els.seatsAvailable.textContent = maxSeats;

      // Boshlang'ich qiymatlar
      seatsCount = 1;
      if (seatsCount > maxSeats) seatsCount = maxSeats;
      els.seatsCount.textContent = seatsCount;
      updateTotalPrice();

    } catch (err) {
      alert('Reys maʼlumotlarini yuklab bo‘lmadi');
      console.error(err);
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
    const paymentType = activePayment?.dataset.type || 'CARD';

    // Tugmani bloklash
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

      // 400 – allaqachon bron qilingan
      if (res.status === 400) {
        alert('Siz allaqachon ushbu reys uchun bron qilgansiz!');
        return;
      }

      // Muvaffaqiyatli bron
      if (result.success) {
        showSuccessModal(result.message || 'Chipta muvaffaqiyatli bron qilindi!');
      } else {
        // Xato bo'lsa
        const errorMsg = result.errors?.join('\n') || result.message || 'Xatolik yuz berdi';
        alert(errorMsg);
      }
    } catch (err) {
      alert('Internet aloqasi yo‘q yoki server xatosi. Iltimos, qayta urinib ko‘ring.');
      console.error(err);
    } finally {
      // Har doim tugmani qayta faollashtirish
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = 'Bron qilish';
    }
  };

  els.submitBtn.addEventListener('click', handleBooking);

  // Boshlash
  loadRouteDetails();
});