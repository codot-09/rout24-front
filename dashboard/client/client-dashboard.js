const token=localStorage.getItem('token');if(!token)location.href='login.html';
const regions=["TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO","XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON","ANDIJON","NAMANGAN","FARGONA"];
const fromFilter=document.getElementById('fromFilter'),toFilter=document.getElementById('toFilter'),minPrice=document.getElementById('minPrice'),maxPrice=document.getElementById('maxPrice'),routesList=document.getElementById('routesList'),emptyState=document.getElementById('emptyState');
regions.forEach(r=>{const txt=r[0]+r.slice(1).toLowerCase();fromFilter.add(new Option(txt,r));toFilter.add(new Option(txt,r));});
document.getElementById('filterToggle').onclick=()=>document.getElementById('searchCard').classList.toggle('show');
async function loadRoutes(){const params=new URLSearchParams();if(fromFilter.value)params.append('from',fromFilter.value);if(toFilter.value)params.append('to',toFilter.value);if(minPrice.value)params.append('minprice',minPrice.value);if(maxPrice.value)params.append('maxprice',maxPrice.value);params.append('page',0);params.append('size',30);
try{const res=await fetch(`https://api.rout24.online/routes/search?${params}`,{headers:{Authorization:`Bearer ${token}`}});const {success,data}=await res.json();if(!success||!data?.content?.length){routesList.innerHTML='';emptyState.style.display='block';return}emptyState.style.display='none';routesList.innerHTML=data.content.map(r=>`
<div class="route" onclick="location.href='route-credentials.html?id=${r.id}'">
    <div class="route-header"><h3>${r.from} → ${r.to}</h3><p>${new Date(r.departureDate).toLocaleString('uz-UZ',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div>
    <div class="route-body">
        <div class="route-info"><div><strong>Narx:</strong> ${r.price.toLocaleString()} so‘m</div><div><strong>O‘rin:</strong> ${r.seatsCount} ta</div></div>
        <div class="route-footer"><div class="price">${r.price.toLocaleString()} so‘m</div><div class="seats">${r.seatsCount} joy</div></div>
    </div>
</div>`).join('');}catch{emptyState.textContent='Xatolik';emptyState.style.display='block';}}
async function loadBanners(){try{const res=await fetch('https://api.rout24.online/banners',{headers:{Authorization:`Bearer ${token}`}});const {success,data}=await res.json();if(success&&data.length)document.getElementById('banners').innerHTML=data.map(b=>`<div class="banners"><img src="${b.coverImage}" alt=""></div>`).join('');}catch{}}
document.getElementById('searchBtn').onclick=loadRoutes;loadRoutes();loadBanners();