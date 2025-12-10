function onTelegramAuth(user) {
    const payload = {
        chatId: String(user.id),
        username: user.username || "",
        imageUrl: user.photo_url || ""
    };

    fetch('https://api.rout24.online/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
        if (res.success && res.data?.token) {
            localStorage.setItem('token', res.data.token);
            const role = res.data.role;

            if (!role) {
                location.href = 'set-credentials.html';
            } else if (role === 'DRIVER') {
                location.href = 'driver-dashboard.html';
            } else if (role === 'CLIENT') {
                location.href = 'client-dashboard.html';
            }
        } else {
            alert('Kirishda xatolik yuz berdi');
        }
    })
    .catch(() => alert('Internet aloqasini tekshiring'));
}