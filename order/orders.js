let currentPage = 0;
const pageSize = 10;
let totalPages = 1;
let allOrders = [];
let currentFilter = 'ALL';
let token = '';

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  if (!token) {
    alert('Iltimos, tizimga qayta kiring');
    return location.href = 'login.html';
  }

  loadOrders();

  document.getElementById('statusFilter').onchange = e => {
    currentFilter = e.target.value;
    currentPage = 0;
    renderOrders();
  };

  document.getElementById('prevPage').onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      renderOrders();
    }
  };

  document.getElementById('nextPage').onclick = () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderOrders();
    }
  };
});

async function loadOrders() {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';

  try {
    const res = await fetch(`https://api.rout24.online/orders/own?page=0&size=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    });

    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Xatolik');

    allOrders = json.data?.content || [];
    totalPages = Math.ceil(allOrders.length / pageSize);
    currentPage = 0;

    currentPage = 0;

    renderOrders();
    updatePagination();
  } catch (err) {
    alert('Buyurtmalarni yuklashda xatolik: ' + err.message);
  } finally {
    loader.style.display = 'none';
  }
}

function renderOrders() {
  const filtered = currentFilter === 'ALL' 
    ? allOrders 
    : allOrders.filter(o => o.status === currentFilter);

  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageOrders = filtered.slice(start, end);

  totalPages = Math.ceil(filtered.length / pageSize);
  if (currentPage >= totalPages && totalPages > 0) currentPage = totalPages - 1;

  const list = document.getElementById('ordersList');
  list.innerHTML = '';

  if (pageOrders.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Buyurtmalar mavjud emas</div>';
    updatePagination();
    return;
  }

  pageOrders.forEach(order => {
    const statusClass = order.status.toLowerCase();
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-header">
        <h3>Buyurtma #${order.billingNumber}</h3>
        <span class="status-badge ${statusClass}">${getStatusText(order.status)}</span>
      </div>
      <div class="order-details">
        <div><span>Sana:</span> <strong>${new Date(order.orderDate).toLocaleString('uz-UZ')}</strong></div>
        <div><span>Toʻlov turi:</span> <strong>${order.paymentType === 'CARD' ? 'Karta' : 'Naqd'}</strong></div>
        <div><span>Toʻlov holati:</span> <strong>${order.paymentStatus === 'PAID' ? 'Toʻlangan' : 'Toʻlanmagan'}</strong></div>
        <div><span>Narx:</span> <strong>${order.price.toLocaleString('uz-UZ')} soʻm</strong></div>
        <div><span>Joylar:</span> <strong>${order.seatsCount} ta</strong></div>
      </div>
      <div class="order-actions">
        ${order.status === 'WAITING' ? `<button class="btn-cancel" onclick="cancelOrder('${order.billingNumber}')">Bekor qilish</button>` : ''}
        ${order.qrCode ? `<button class="btn-check" onclick="showQrModal('${order.qrCode}', '${order.billingNumber}')">Onlayn chek</button>` : ''}
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

async function cancelOrder(billingNumber) {
  if (!confirm('Buyurtmani bekor qilmoqchimisiz?')) return;

  try {
    const res = await fetch(`https://api.rout24.online/orders/cancel/${billingNumber}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const json = await res.json();
    if (!json.success) throw new Error('Bekor qilishda xato');

    alert('Buyurtma muvaffaqiyatli bekor qilindi');
    loadOrders();
  } catch (err) {
    alert('Xatolik: ' + err.message);
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

function getStatusText(status) {
  const map = { WAITING: 'Kutilmoqda', PAID: 'Toʻlangan', CANCELLED: 'Bekor qilingan' };
  return map[status] || status;
}