const token=localStorage.getItem('token');if(!token)location.href='login.html';
const regions=["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];
const from=document.getElementById('fromFilter'),to=document.getElementById('toFilter');
regions.forEach(r=>{const t=r[0]+r.slice(1).toLowerCase();from.add(new Option(t,r));to.add(new Option(t,r));});
const searchCard=document.getElementById('searchCard'),toggle=document.getElementById('filterToggle');
toggle.onclick=()=>{searchCard.classList.toggle('show');toggle.innerHTML=`<svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg> ${searchCard.classList.contains('show')?'Yopish':'Filtrlar'}`;};
async function loadRoutes(){const p=new URLSearchParams();from.value&&p.append('from',from.value);to.value&&p.append('to',to.value);document.getElementById('minPrice').value&&p.append('minprice',document.getElementById('minPrice').value);document.getElementById('maxPrice').value&&p.append('maxprice',document.getElementById('maxPrice').value);p.append('page',0);p.append('size',30);
try{const r=await fetch(`https://api.rout24.online/routes/search?${p}`,{headers:{Authorization:`Bearer ${token}`}});
const {success,data}=await r.json();const list=document.getElementById('routesList'),empty=document.getElementById('emptyState');
if(!success||!data?.content?.length){list.innerHTML='';empty.style.display='block';return}
empty.style.display='none';
list.innerHTML=data.content.map(r=>`
<div class="route" onclick="location.href='route-credentials.html?id=${r.id}'">
    <div class="route-header"><h3>${r.from} to ${r.to}</h3><p>${new Date(r.departureDate).toLocaleString('uz-UZ',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div>
    <div class="route-body">
        <div class="route-info"><div><strong>Narx:</strong> ${r.price.toLocaleString()} so‘m</div><div><strong>O‘rin:</strong> ${r.seatsCount} ta</div></div>
        <div class="route-footer"><div class="price">${r.price.toLocaleString()} so‘m</div><div class="seats">${r.seatsCount} joy</div></div>
    </div>
</div>`).join('');}catch{empty.textContent='Xatolik';empty.style.display='block';}}
async function loadBanners(){try{const r=await fetch('https://api.rout24.online/banners',{headers:{Authorization:`Bearer ${token}`}});
const {success,data}=await r.json();if(success&&data.length){document.getElementById('banners').innerHTML=data.map(b=>`<div class="banners"><img src="${b.coverImage}" alt=""></div>`).join('');}}catch{}}
document.getElementById('searchBtn').onclick=loadRoutes;
loadRoutes();loadBanners();