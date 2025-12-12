let currentPage = 0;
const pageSize = 10;
let totalPages = 1;
let allOrders = []; // Barcha orderlarni saqlash uchun
let currentFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return location.href = 'login.html'; // Agar token bo'lmasa login ga

  loadOrders(token);

  document.getElementById('statusFilter').onchange = (e) => {
    currentFilter = e.target.value;
    filterAndRenderOrders();
  };

  document.getElementById('prevPage').onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      filterAndRenderOrders();
      updatePagination();
    }
  };

  document.getElementById('nextPage').onclick = () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      filterAndRenderOrders();
      updatePagination();
    }
  };
});

async function loadOrders(token) {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';

  try {
    const res = await fetch(`https://api.rout24.online/orders/own?page=0&size=1000`, { // Barchasini birda yuklash uchun size=1000
      headers: { Authorization: `Bearer ${token}`, Accept: '*/*' }
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Xatolik');

    allOrders = json.data.content || [];
    totalPages = Math.ceil(allOrders.length / pageSize);

    filterAndRenderOrders();
    updatePagination();
  } catch (e) {
    alert('Buyurtmalarni yuklab bo‘lmadi: ' + (e.message || 'Internetni tekshiring'));
  } finally {
    loader.style.display = 'none';
  }
}

function filterAndRenderOrders() {
  const filtered = currentFilter === 'ALL' ? allOrders : allOrders.filter(o => o.status === currentFilter);

  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageOrders = filtered.slice(start, end);

  totalPages = Math.ceil(filtered.length / pageSize);
  if (currentPage >= totalPages) currentPage = totalPages - 1;

  const list = document.getElementById('ordersList');
  list.innerHTML = '';

  pageOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const statusClass = order.status.toLowerCase();

    card.innerHTML = `
      <div class="order-header">
        <h3>Buyurtma #${order.billingNumber}</h3>
        <span class="status-badge ${statusClass}">${order.status}</span>
      </div>
      <div class="order-details">
        <div><span>Sana:</span> <strong>${new Date(order.orderDate).toLocaleString('uz-UZ')}</strong></div>
        <div><span>To'lov turi:</span> <strong>${order.paymentType}</strong></div>
        <div><span>To'lov holati:</span> <strong>${order.paymentStatus}</strong></div>
        <div><span>Narx:</span> <strong>${order.price.toLocaleString('uz-UZ')} so‘m</strong></div>
        <div><span>Joylar:</span> <strong>${order.seatsCount} ta</strong></div>
        <div><span>F.I.Sh.:</span> <strong>${order.clientName}</strong></div>
      </div>
      <div class="order-actions">
        <button class="btn-cancel" onclick="cancelOrder('${order.billingNumber}', '${token}')">Bekor qilish</button>
        <button class="btn-check" onclick="showQrModal('${order.qrCode}', '${order.billingNumber}')">Onlayn chek</button>
      </div>
    `;

    list.appendChild(card);
  });

  updatePagination();
}

function updatePagination() {
  document.getElementById('pageInfo').textContent = `${currentPage + 1} / ${totalPages || 1}`;
  document.getElementById('prevPage').disabled = currentPage === 0;
  document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
}

async function cancelOrder(orderId, token) {
  if (!confirm('Buyurtmani bekor qilmoqchimisiz?')) return;

  try {
    const res = await fetch(`https://api.rout24.online/orders/cancel/${orderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Bekor qilishda xato');

    alert('Buyurtma muvaffaqiyatli bekor qilindi!');
    loadOrders(token); // Refresh
  } catch (e) {
    alert('Xatolik: ' + (e.message || 'Qayta urining'));
  }
}

function showQrModal(qrCode, billingNumber) {
  document.getElementById('billingNumber').textContent = billingNumber;
  document.getElementById('qrCodeImg').src = qrCode;
  document.getElementById('qrModal').style.display = 'flex';
}

function closeQrModal() {
  document.getElementById('qrModal').style.display = 'none';
}