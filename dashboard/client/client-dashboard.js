const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const API_BASE = 'https://api.rout24.online';

const regions = [
    "TOSHKENT","NAVOIY","SAMARKAND","BUXORO","QASHQADARYO",
    "XORAZM","SURXONDARYO","JIZZAX","SIRDARYO","QORAQALPOGISTON",
    "ANDIJON","NAMANGAN","FARGONA"
];

const fromFilter   = document.getElementById('fromFilter');
const toFilter     = document.getElementById('toFilter');
const minPrice     = document.getElementById('minPrice');
const maxPrice     = document.getElementById('maxPrice');
const searchBtn    = document.getElementById('searchBtn');
const filterToggle = document.getElementById('filterToggle');
const searchCard   = document.getElementById('searchCard');
const routesList   = document.getElementById('routesList');
const emptyState   = document.getElementById('emptyState');
const bannersBox   = document.getElementById('banners');

function populateRegions(){
    regions.forEach(r=>{
        const t=r.charAt(0)+r.slice(1).toLowerCase();
        fromFilter.add(new Option(t,r));
        toFilter.add(new Option(t,r));
    });
}
populateRegions();

filterToggle.addEventListener('click',()=>{
    const s=searchCard.classList.toggle('show');
    filterToggle.setAttribute('aria-expanded',s);
});

async function authFetch(url,options={}){
    const res=await fetch(url,{
        ...options,
        headers:{
            Authorization:`Bearer ${token}`,
            'Content-Type':'application/json',
            ...options.headers
        }
    });
    if(!res.ok) throw new Error(res.status);
    return res.json();
}

function showLoading(){
    routesList.innerHTML=`<div style="padding:40px;text-align:center;color:#999">Yuklanmoqda...</div>`;
    emptyState.hidden=true;
}

function renderRouteCard(route){
    const d=new Date(route.departureDate).toLocaleString('uz-UZ',{
        weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'
    }).replace(',','');
    return `
    <article class="route" onclick="openRoute('${route.id}')">
        <header>
            <h3>${route.from} → ${route.to}</h3>
            <p>${d}</p>
        </header>
        <div>
            <strong>${route.price.toLocaleString('uz-UZ')} so‘m</strong>
            <span>${route.seatsCount} joy</span>
        </div>
    </article>`;
}

function openRoute(id){
    location.href=`https://rout24.online/route/credentials?id=${id}`;
}

async function loadRoutes(withFilters=false){
    showLoading();

    const params=new URLSearchParams({page:0,size:30});

    if(withFilters){
        if(fromFilter.value) params.set('from',fromFilter.value);
        if(toFilter.value) params.set('to',toFilter.value);
        if(minPrice.value) params.set('minprice',minPrice.value);
        if(maxPrice.value) params.set('maxprice',maxPrice.value);
    }

    try{
        const res=await authFetch(`${API_BASE}/routes/search?${params}`);
        routesList.innerHTML='';
        if(!res.success||!res.data?.content?.length){
            emptyState.hidden=false;
            return;
        }
        emptyState.hidden=true;
        routesList.innerHTML=res.data.content.map(renderRouteCard).join('');
    }catch{
        routesList.innerHTML='';
        emptyState.hidden=false;
    }
}

async function loadBanners(){
    try{
        const res=await authFetch(`${API_BASE}/banners`);
        if(res.success&&Array.isArray(res.data)){
            bannersBox.innerHTML=res.data.map(b=>`<img src="${b.coverImage||''}" loading="lazy">`).join('');
        }
    }catch{}
}

searchBtn.addEventListener('click',()=>loadRoutes(true));

[minPrice,maxPrice].forEach(i=>{
    i.addEventListener('keydown',e=>{
        if(e.key==='Enter') loadRoutes(true);
    });
});

document.addEventListener('DOMContentLoaded',()=>{
    loadRoutes(false);
    loadBanners();
});
