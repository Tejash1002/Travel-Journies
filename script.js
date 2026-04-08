const MAX_STORAGE = 20;
let memories = JSON.parse(localStorage.getItem('travel_journies_db')) || [];

// Logic to default to Dark Mode if no theme is saved yet
let savedTheme = localStorage.getItem('travel_journies_theme');
let isDark = savedTheme ? savedTheme === 'dark' : true; // DEFAULT TO DARK

const placeholders = [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800"
];

const dom = {
    grid: document.getElementById('grid'),
    empty: document.getElementById('empty'),
    search: document.getElementById('search'),
    modal: document.getElementById('modal'),
    addBtn: document.getElementById('add-btn'),
    saveBtn: document.getElementById('save-btn'),
    themeBtn: document.getElementById('theme-btn'),
    themeIcon: document.getElementById('theme-icon'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    storageBar: document.getElementById('storage-bar'),
    storageText: document.getElementById('storage-text'),
    fileInput: document.getElementById('in-files'),
    uploadLabel: document.getElementById('upload-label'),
    filterFavBtn: document.getElementById('filter-fav'),
    inTitle: document.getElementById('in-title'),
    inLoc: document.getElementById('in-location'),
    inContent: document.getElementById('in-content')
};

function init() {
    applyTheme();
    render();
}

function applyTheme() {
    if (isDark) {
        document.documentElement.classList.add('dark');
        dom.themeIcon.className = 'fas fa-sun';
    } else {
        document.documentElement.classList.remove('dark');
        dom.themeIcon.className = 'fas fa-moon';
    }
}

function showToast(msg) {
    dom.toastMsg.innerText = msg;
    dom.toast.classList.replace('opacity-0', 'opacity-100');
    dom.toast.classList.replace('translate-y-10', 'translate-y-0');
    setTimeout(() => {
        dom.toast.classList.replace('opacity-100', 'opacity-0');
        dom.toast.classList.replace('translate-y-0', 'translate-y-10');
    }, 3000);
}

function render() {
    const query = dom.search.value.toLowerCase();
    const filtered = memories.filter(m => (m.title + m.location).toLowerCase().includes(query) && (filterOnlyFavs ? m.isFavorite : true));

    dom.storageBar.style.width = `${(memories.length / MAX_STORAGE) * 100}%`;
    dom.storageText.innerText = `${memories.length}/${MAX_STORAGE}`;

    dom.grid.innerHTML = '';
    filtered.length === 0 ? dom.empty.classList.remove('hidden') : dom.empty.classList.add('hidden');
    filtered.forEach(m => dom.grid.appendChild(createCard(m)));
}

function createCard(m) {
    const el = document.createElement('div');
    el.className = 'memory-card animate-card group flex flex-col';
    let idx = 0;
    const imgs = m.images?.length ? m.images : [placeholders[Math.floor(Math.random() * placeholders.length)]];

    el.innerHTML = `
        <div class="relative h-60 overflow-hidden">
            <img id="img-${m.id}" src="${imgs[idx]}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            <button onclick="toggleFavorite('${m.id}')" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white"><i class="fas fa-heart ${m.isFavorite ? 'fav-active' : ''}"></i></button>
            ${imgs.length > 1 ? `<div class="absolute inset-x-0 top-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onclick="event.stopPropagation(); changeImg('${m.id}', -1)" class="carousel-btn"><i class="fas fa-chevron-left"></i></button><button onclick="event.stopPropagation(); changeImg('${m.id}', 1)" class="carousel-btn"><i class="fas fa-chevron-right"></i></button></div>` : ''}
            <div class="absolute bottom-4 left-4 location-font text-white text-xl">📍 ${m.location || 'Unknown'}</div>
        </div>
        <div class="p-6 flex-grow flex flex-col">
            <div class="flex justify-between items-start mb-2"><h3 class="font-bold text-lg line-clamp-1">${m.title || 'Trip'}</h3><div class="flex gap-2"><button onclick="openEdit('${m.id}')"><i class="fas fa-edit text-slate-400"></i></button><button onclick="deleteMem('${m.id}')"><i class="fas fa-trash text-slate-400"></i></button></div></div>
            <p class="text-sm text-slate-500 mb-4 line-clamp-2">${m.content}</p>
            <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>${new Date(m.date).toLocaleDateString()}</span><button onclick="window.open('http://googleusercontent.com/maps.google.com/3{encodeURIComponent(m.location)}')">Map</button></div>
        </div>`;

    window.changeImg = (id, s) => { if(id===m.id){ idx=(idx+s+imgs.length)%imgs.length; document.getElementById(`img-${m.id}`).src=imgs[idx]; } };
    return el;
}

dom.addBtn.onclick = () => {
    if (memories.length >= MAX_STORAGE) return showToast("Limit reached!");
    currentId = null; tempImages = [];
    dom.inTitle.value = dom.inLoc.value = dom.inContent.value = '';
    dom.uploadLabel.innerText = "Pick some photos";
    dom.modal.classList.remove('hidden');
};

dom.saveBtn.onclick = () => {
    if(!dom.inContent.value) return showToast("Add a story!");
    let currentTempImages = tempImages;
    const data = { title: dom.inTitle.value, location: dom.inLoc.value, content: dom.inContent.value, images: currentTempImages, date: Date.now(), isFavorite: false };
    if(currentId) memories = memories.map(m => m.id === currentId ? {...m, ...data, images: currentTempImages.length ? currentTempImages : m.images} : m);
    else memories.unshift({id: Date.now().toString(), ...data});
    localStorage.setItem('travel_journies_db', JSON.stringify(memories));
    render(); dom.modal.classList.add('hidden'); showToast("Journey Saved!");
};

dom.fileInput.onchange = async (e) => {
    tempImages = [];
    for(let f of e.target.files) if(f.size < 2000000) tempImages.push(await new Promise(r => { const reader = new FileReader(); reader.readAsDataURL(f); reader.onload = () => r(reader.result); }));
    dom.uploadLabel.innerText = `${tempImages.length} images ready`;
};

window.deleteMem = id => { if(confirm("Delete journey?")){ memories = memories.filter(m => m.id !== id); localStorage.setItem('travel_journies_db', JSON.stringify(memories)); render(); showToast("Deleted."); } };
window.toggleFavorite = id => { memories = memories.map(m => m.id === id ? {...m, isFavorite: !m.isFavorite} : m); localStorage.setItem('travel_journies_db', JSON.stringify(memories)); render(); };
window.openEdit = id => { currentId = id; const m = memories.find(x => x.id === id); dom.inTitle.value = m.title; dom.inLoc.value = m.location; dom.inContent.value = m.content; dom.modal.classList.remove('hidden'); };
dom.search.oninput = render;
dom.filterFavBtn.onclick = () => { filterOnlyFavs = !filterOnlyFavs; dom.filterFavBtn.classList.toggle('text-red-500'); render(); };
dom.themeBtn.onclick = () => { isDark = !isDark; localStorage.setItem('travel_journies_theme', isDark ? 'dark' : 'light'); applyTheme(); };
document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => dom.modal.classList.add('hidden'));

init();