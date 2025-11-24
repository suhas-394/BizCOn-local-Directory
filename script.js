/* script.js - Glassmorphism Edition */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, where, serverTimestamp, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. PASTE YOUR FIREBASE KEYS HERE 👇
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCuwA35q46s_XC_Pv5NZtYiiTsZpeVBxIU",
  authDomain: "bizcon-d615d.firebaseapp.com",
  projectId: "bizcon-d615d",
  storageBucket: "bizcon-d615d.firebasestorage.app",
  messagingSenderId: "308691062490",
  appId: "1:308691062490:web:3f0dde87202c1ae94a5fe3"
};

// Initialize
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.error("Firebase Error:", e); }

const BIZ_COLLECTION = "businesses";
const REVIEW_COLLECTION = "reviews";

// --- GLOBAL FUNCTIONS ---
window.handleCustomerLogin = (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    if(name) localStorage.setItem('bizcon_user', name);
    window.location.href = "listings.html";
};

window.handleAdminLogin = (e) => {
    e.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if(pass === "1234") {
        localStorage.setItem('bizcon_role', 'admin');
        window.location.href = "admin.html";
    } else { alert("Incorrect PIN."); }
};

window.deleteBusiness = async (id) => {
    if(!confirm("Delete this listing?")) return;
    try {
        await deleteDoc(doc(db, BIZ_COLLECTION, id));
        alert("Deleted.");
        location.reload();
    } catch(e) { alert(e.message); }
};

// --- MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    // Mobile Menu
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // HOME
    if (path.includes('index.html') || path.endsWith('/')) {
        const container = document.getElementById('featured-container');
        if(container) {
            try {
                const snap = await getDocs(query(collection(db, BIZ_COLLECTION)));
                container.innerHTML = '';
                let count = 0;
                snap.forEach(d => { if(count < 3) { renderCard(container, d.id, d.data()); count++; } });
                if(count === 0) container.innerHTML = '<div class="col-span-3 text-center text-gray-400">No businesses yet.</div>';
            } catch(e) { console.error(e); }
        }
    }

    // LISTINGS
    const listContainer = document.getElementById('listings-container');
    if(listContainer) {
        let allData = [];
        try {
            const snap = await getDocs(query(collection(db, BIZ_COLLECTION), orderBy("createdAt", "desc")));
            snap.forEach(d => allData.push({id: d.id, ...d.data()}));
            renderListings(listContainer, allData);
            
            // Search & Filter
            const search = document.getElementById('filter-search');
            const cat = document.getElementById('filter-category');
            const btn = document.getElementById('filter-btn');
            const reset = document.getElementById('filter-reset');

            const apply = () => {
                const term = search.value.toLowerCase();
                const cVal = cat.value;
                const filtered = allData.filter(x => x.name.toLowerCase().includes(term) && (cVal === 'All' || x.category === cVal));
                renderListings(listContainer, filtered);
            };
            btn?.addEventListener('click', apply);
            reset?.addEventListener('click', () => { search.value=''; cat.value='All'; renderListings(listContainer, allData); });

        } catch(e) { console.error(e); }
    }

    // ADMIN
    if(document.getElementById('admin-table-body')) loadAdminDashboard();

    // ADD BUSINESS
    const addForm = document.getElementById('add-business-form');
    if(addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = addForm.querySelector('button');
            btn.innerText = "Publishing..."; btn.disabled = true;
            try {
                await addDoc(collection(db, BIZ_COLLECTION), {
                    name: document.getElementById('b-name').value,
                    category: document.getElementById('b-cat').value,
                    address: document.getElementById('b-addr').value,
                    desc: document.getElementById('b-desc').value,
                    image: document.getElementById('b-img').value || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                    rating: 0, reviews: 0, views: 0, createdAt: serverTimestamp()
                });
                window.location.href = 'listings.html';
            } catch(e) { console.error(e); btn.innerText="Error"; }
        });
    }

    // REVIEW PAGE
    if (path.includes('review.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const bizId = urlParams.get('id');
        if(bizId) await loadReviewPage(bizId);
    }
});

// --- HELPER: RENDER CARD (GLASS STYLE) ---
function renderListings(container, data) {
    container.innerHTML = '';
    if(!data.length) { container.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-10">No results found.</div>'; return; }
    data.forEach(d => renderCard(container, d.id, d));
}

function renderCard(container, id, data) {
    // Updated HTML for Glassmorphism Cards
    container.innerHTML += `
    <div class="glass overflow-hidden hover:bg-white/5 transition duration-300 flex flex-col h-full animate-fade-in group border border-white/10">
        <div class="h-48 relative shrink-0 overflow-hidden">
            <img src="${data.image}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" onerror="this.src='https://via.placeholder.com/400'">
            <span class="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-lg">${data.category}</span>
        </div>
        <div class="p-5 flex flex-col flex-grow">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-xl text-white">${data.name}</h3>
                <div class="flex items-center bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <i class="fa-solid fa-star text-yellow-400 text-xs mr-1"></i>
                    <span class="text-white text-xs font-bold">${data.rating || 0}</span>
                </div>
            </div>
            <p class="text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">${data.desc}</p>
            <div class="mt-auto pt-4 border-t border-white/10">
                <a href="review.html?id=${id}" class="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-bold transition shadow-lg shadow-orange-500/20">View & Rate</a>
            </div>
        </div>
    </div>`;
}

// --- REVIEW PAGE LOGIC (DOUBLE TAP) ---
async function loadReviewPage(bizId) {
    const bizRef = doc(db, BIZ_COLLECTION, bizId);
    try { await updateDoc(bizRef, { views: increment(1) }); } catch(e){}

    const bizSnap = await getDoc(bizRef);
    if(bizSnap.exists()) {
        const d = bizSnap.data();
        document.getElementById('r-name').innerText = d.name;
        document.getElementById('r-cat').innerText = d.category;
        document.getElementById('r-addr').innerText = d.address;
        document.getElementById('r-img').src = d.image;
        document.getElementById('r-desc').innerText = d.desc;
        document.getElementById('r-score').innerText = d.rating || 0;
        document.getElementById('r-count').innerText = `${d.reviews || 0} Reviews`;
    }

    const reviewsList = document.getElementById('reviews-list');
    const q = query(collection(db, REVIEW_COLLECTION), where("bizId", "==", bizId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    reviewsList.innerHTML = '';
    if(snap.empty) reviewsList.innerHTML = '<div class="text-center py-4 text-gray-400">No reviews yet.</div>';
    
    snap.forEach(docSnap => {
        const r = docSnap.data();
        let stars = '';
        for(let i=1; i<=5; i++) stars += i <= r.rating ? '<i class="fa-solid fa-star text-yellow-400 text-sm"></i>' : '<i class="fa-regular fa-star text-gray-500 text-sm"></i>';
        reviewsList.innerHTML += `
        <div class="border-b border-white/10 pb-4 mb-4">
            <div class="flex justify-between items-center">
                <span class="font-bold text-white">${r.userName}</span>
                <span class="text-xs text-gray-400">${r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString() : ''}</span>
            </div>
            <div class="flex gap-1 my-1">${stars}</div>
            <p class="text-gray-300 text-sm">"${r.comment}"</p>
        </div>`;
    });

    // DOUBLE TAP STAR LOGIC
    let selectedRating = 0;
    const starContainer = document.getElementById('star-input');
    const label = document.getElementById('rating-label');
    const ratingWords = ["Select Rating", "Poor", "Fair", "Good", "Very Good", "Excellent"];

    if (starContainer) {
        const stars = starContainer.querySelectorAll('i');
        stars.forEach(star => {
            star.onclick = function() {
                if(selectedRating === 0) {
                    label.innerText = "Double tap to select!";
                    label.className = "text-lg font-bold text-gray-400 mt-2 animate-bounce";
                }
            };
            star.ondblclick = function() {
                const val = parseInt(this.getAttribute('data-value'));
                selectedRating = val;
                if(label) {
                    label.innerText = ratingWords[val];
                    label.className = "text-xl font-bold text-orange-500 mt-2 animate-bounce";
                }
                stars.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    s.className = "text-4xl transition transform hover:scale-110 cursor-pointer p-1"; // Reset
                    if (sVal <= val) {
                        s.classList.add("fa-solid", "fa-star", "text-yellow-400");
                    } else {
                        s.classList.add("fa-regular", "fa-star", "text-gray-500");
                    }
                });
            };
        });
    }

    const stored = localStorage.getItem('bizcon_user');
    if(stored) document.getElementById('user-name').value = stored;

    document.getElementById('review-form').onsubmit = async (e) => {
        e.preventDefault();
        if(selectedRating === 0) return alert("Please double-tap the stars to rate.");
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.innerText = "Posting...";
        try {
            await addDoc(collection(db, REVIEW_COLLECTION), {
                bizId, 
                userName: document.getElementById('user-name').value, 
                comment: document.getElementById('user-comment').value, 
                rating: selectedRating, 
                createdAt: serverTimestamp()
            });
            const current = bizSnap.data();
            const oldR = parseFloat(current.rating) || 0;
            const oldC = parseInt(current.reviews) || 0;
            const newC = oldC + 1;
            const newR = ((oldR * oldC) + selectedRating) / newC;
            await updateDoc(bizRef, { rating: newR.toFixed(1), reviews: newC });
            alert("Review Posted!");
            location.reload();
        } catch(err) { console.error(err); btn.disabled = false; btn.innerText = "Post Review"; }
    };
}

// --- ADMIN DASHBOARD ---
async function loadAdminDashboard() {
    const table = document.getElementById('admin-table-body');
    const snap = await getDocs(collection(db, BIZ_COLLECTION));
    let allData = [];
    let stats = { total: 0, views: 0, reviews: 0, ratingSum: 0 };

    snap.forEach(d => {
        const data = d.data();
        allData.push({ id: d.id, ...data });
        stats.total++;
        stats.views += (data.views || 0);
        stats.reviews += (data.reviews || 0);
        stats.ratingSum += (parseFloat(data.rating) || 0);
    });

    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-views').innerText = stats.views;
    document.getElementById('stat-reviews').innerText = stats.reviews;
    document.getElementById('stat-rating').innerText = stats.total ? (stats.ratingSum / stats.total).toFixed(1) : "0.0";
    
    const renderTable = (arr) => {
        table.innerHTML = '';
        if(!arr.length) return table.innerHTML='<tr><td colspan="6" class="p-8 text-center text-gray-400">No data.</td></tr>';
        arr.forEach(item => {
            table.innerHTML += `
            <tr class="border-b border-white/10 hover:bg-white/5 transition">
                <td class="p-4 font-bold text-white">${item.name}</td>
                <td class="p-4"><span class="bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded font-bold border border-blue-500/30">${item.category}</span></td>
                <td class="p-4 text-center text-yellow-400 font-bold">★ ${item.rating || 0}</td>
                <td class="p-4 text-center text-gray-300 font-mono">${item.views || 0}</td>
                <td class="p-4 text-center text-gray-300">${item.reviews || 0}</td>
                <td class="p-4 text-right">
                    <button onclick="deleteBusiness('${item.id}')" class="text-red-400 hover:text-red-300 text-sm font-bold bg-red-500/10 px-3 py-1 rounded hover:bg-red-500/20">Delete</button>
                </td>
            </tr>`;
        });
    };
    renderTable(allData);

    const sortSelect = document.getElementById('admin-sort');
    const filterSelect = document.getElementById('admin-filter');
    const applyFilters = () => {
        let res = [...allData];
        if(filterSelect.value === '4star') res = res.filter(x => x.rating >= 4);
        if(filterSelect.value === 'popular') res = res.filter(x => (x.views || 0) > 100);
        if(sortSelect.value === 'views') res.sort((a,b) => (b.views||0) - (a.views||0));
        else if(sortSelect.value === 'rating_high') res.sort((a,b) => b.rating - a.rating);
        else res.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
        renderTable(res);
    };
    sortSelect?.addEventListener('change', applyFilters);
    filterSelect?.addEventListener('change', applyFilters);
}