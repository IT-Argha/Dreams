// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVrvWYByR5V7MD2j2dL3H1_s6r9LbKRbM",
  authDomain: "dreams-website-220c8.firebaseapp.com",
  projectId: "dreams-website-220c8",
  storageBucket: "dreams-website-220c8.firebasestorage.app",
  messagingSenderId: "598468804789",
  appId: "1:598468804789:web:21d157c47ee01542733efc",
  measurementId: "G-8GWP578FQE"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// DOM Elements
const floatingAddBtn = document.getElementById('floatingAddBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const dreamForm = document.getElementById('dreamForm');
const dreamsContainer = document.getElementById('dreamsContainer');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortBy = document.getElementById('sortBy');
const clearFilters = document.getElementById('clearFilters');
const filterToggle = document.querySelector('.filter-toggle');
const filtersSection = document.getElementById('filtersSection');
let isNightMode = false;
let dreams = [];
document.addEventListener('DOMContentLoaded', init);
function init() {
  loadThemePreference();
  setupEventListeners();
  fetchDreams();
}
function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  floatingAddBtn.addEventListener('click', openModal);
  closeModal.addEventListener('click', closeModalHandler);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModalHandler();
  });
  dreamForm.addEventListener('submit', submitDream);
  searchBtn.addEventListener('click', () => {
    displayDreams(dreams, searchInput.value.trim());
  });
  searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      displayDreams(dreams, searchInput.value.trim());
    }
  });
  sortBy.addEventListener('change', () => {
    displayDreams(dreams, searchInput.value.trim());
  });
  clearFilters.addEventListener('click', () => {
    searchInput.value = '';
    sortBy.value = 'newest';
    displayDreams(dreams);
  });
  filterToggle.addEventListener('click', toggleFilters);
}
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'night') enableNightMode();
}
function toggleTheme() {
  isNightMode ? disableNightMode() : enableNightMode();
}
function enableNightMode() {
  document.body.classList.add('night-mode');
  themeIcon.classList.replace('fa-moon', 'fa-sun');
  isNightMode = true;
  localStorage.setItem('theme', 'night');
}
function disableNightMode() {
  document.body.classList.remove('night-mode');
  themeIcon.classList.replace('fa-sun', 'fa-moon');
  isNightMode = false;
  localStorage.setItem('theme', 'day');
}
function openModal() {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModalHandler() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
  dreamForm.reset();
}
function submitDream(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const targetDate = document.getElementById('targetDate').value;
  const dream = {
    name,
    title,
    description,
    targetDate,
    createdAt: new Date().toISOString()
  };
  saveDream(dream);
}
function saveDream(dream) {
  db.collection('dreams').add(dream)
    .then(() => {
      showToast('Dream shared successfully!', 'success');
      closeModalHandler();
      fetchDreams();
    })
    .catch(err => {
      console.error('Error adding dream:', err);
      showToast('Failed to share dream', 'error');
    });
}
function fetchDreams() {
  dreamsContainer.innerHTML = getPlaceholders();
  db.collection('dreams').orderBy('createdAt', 'desc').get()
    .then(snapshot => {
      dreams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      displayDreams(dreams);
    })
    .catch(err => {
      console.error('Error getting dreams:', err);
      dreamsContainer.innerHTML = '<div class="no-dreams">Error loading dreams. Please try again later.</div>';
    });
}
function getPlaceholders() {
  return Array(3).fill(`
    <div class="dream-card placeholder-card">
      <div class="placeholder-content">
        <div class="placeholder-line"></div>
        <div class="placeholder-line"></div>
        <div class="placeholder-line"></div>
      </div>
    </div>
  `).join('');
}
function displayDreams(dreamsToDisplay, searchTerm = '') {
  dreamsContainer.innerHTML = '';
  const filteredDreams = searchTerm
    ? dreamsToDisplay.filter(dream =>
        dream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dream.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dream.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : dreamsToDisplay;
  if (filteredDreams.length === 0) {
    dreamsContainer.innerHTML = '<div class="no-dreams">No dreams found matching your search.</div>';
    return;
  }
  switch (sortBy.value) {
    case 'oldest':
      filteredDreams.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'target-asc':
      filteredDreams.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
      break;
    case 'target-desc':
      filteredDreams.sort((a, b) => new Date(b.targetDate) - new Date(a.targetDate));
      break;
    default:
      filteredDreams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  filteredDreams.forEach(dream => {
    dreamsContainer.appendChild(createDreamCard(dream));
  });
}
function createDreamCard(dream) {
  const dreamCard = document.createElement('div');
  dreamCard.className = 'dream-card';
  const createdAt = new Date(dream.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedDate = new Date(dream.targetDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const remainingTime = formatRemainingTime(dream.targetDate);
  dreamCard.innerHTML = `
    <div class="pin"></div>
    <h3>${dream.title}</h3>
    <p class="dream-author"><i class="fas fa-user"></i> ${dream.name}</p>
    <p class="dream-description">${dream.description}</p>
    <div class="dream-dates">
      <p class="dream-date"><i class="fas fa-calendar-plus"></i> Created: ${createdAt}</p>
      <p class="dream-date"><i class="fas fa-bullseye"></i> Target: ${formattedDate}</p>
      <p class="dream-date"><i class="fas fa-clock"></i> ${remainingTime}</p>
    </div>
  `;
  return dreamCard;
}
function formatRemainingTime(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  if (diff <= 0) return 'Target date reached!';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Time remaining: ${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleFilters() {
  filtersSection.classList.toggle('active');
}