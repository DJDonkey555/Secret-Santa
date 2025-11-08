// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOlYzXVvUib58tv_hNMHlGSM2TmdLTZdE",
  authDomain: "secret-santa-cad9a.firebaseapp.com",
  databaseURL: "https://secret-santa-cad9a-default-rtdb.firebaseio.com",
  projectId: "secret-santa-cad9a",
  storageBucket: "secret-santa-cad9a.firebasestorage.app",
  messagingSenderId: "134802085752",
  appId: "1:134802085752:web:2c3e7cb244a825f67e9a8d",
  measurementId: "G-4C21F6SRCZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM elements
const homeScreen = document.getElementById('homeScreen');
const createScreen = document.getElementById('createScreen');
const joinScreen = document.getElementById('joinScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const resultScreen = document.getElementById('resultScreen');
const menuModal = document.getElementById('menuModal');

const btnCreate = document.getElementById('btnCreate');
const btnJoin = document.getElementById('btnJoin');
const btnConfirmCreate = document.getElementById('btnConfirmCreate');
const btnConfirmJoin = document.getElementById('btnConfirmJoin');
const btnAddWish = document.getElementById('btnAddWish');
const btnAddWishJoin = document.getElementById('btnAddWishJoin');
const btnAddEditWish = document.getElementById('btnAddEditWish');
const btnSaveWishlist = document.getElementById('btnSaveWishlist');
const btnStartDraw = document.getElementById('btnStartDraw');
const btnEditSettings = document.getElementById('btnEditSettings');
const btnBackToLobby = document.getElementById('btnBackToLobby');
const btnUpdateWishlist = document.getElementById('btnUpdateWishlist');
const btnMenu = document.getElementById('btnMenu');

const playersList = document.getElementById('playersList');
const assignedPerson = document.getElementById('assignedPerson');
const assignedWishes = document.getElementById('assignedWishes');
const adminControls = document.getElementById('adminControls');
const playerCount = document.getElementById('playerCount');

const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

const toast = document.getElementById('toast');

// Local state
let local = {
  role: null,
  room: null,
  name: null,
  myUid: null,
  isOwner: false,
  wishes: []
};

// Wish counters
let wishCount = 3;
let wishCountJoin = 3;
let editWishCount = 3;

// Initialize the app
function init() {
  setupEventListeners();
  checkLocalStorage();
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  btnCreate.addEventListener('click', () => showScreen(createScreen));
  btnJoin.addEventListener('click', () => showScreen(joinScreen));
  btnConfirmCreate.addEventListener('click', createLobby);
  btnConfirmJoin.addEventListener('click', joinLobby);
  btnBackToLobby.addEventListener('click', () => showScreen(lobbyScreen));
  btnUpdateWishlist.addEventListener('click', () => switchTab('myCard'));
  
  // Wishlist management
  btnAddWish.addEventListener('click', () => addWishInput('create'));
  btnAddWishJoin.addEventListener('click', () => addWishInput('join'));
  btnAddEditWish.addEventListener('click', () => addWishInput('edit'));
  btnSaveWishlist.addEventListener('click', saveWishlist);
  
  // Admin functions
  btnStartDraw.addEventListener('click', startDraw);
  btnEditSettings.addEventListener('click', showEditSettingsModal);
  
  // Menu
  btnMenu.addEventListener('click', () => showModal('menuModal'));
  
  // Bottom navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

// Check localStorage for existing session
function checkLocalStorage() {
  const savedRoom = localStorage.getItem('santa_room');
  const savedUid = localStorage.getItem('santa_uid');
  const savedName = localStorage.getItem('santa_name');
  const savedRole = localStorage.getItem('santa_role');
  
  if (savedRoom && savedUid) {
    local.room = savedRoom;
    local.myUid = savedUid;
    local.name = savedName;
    local.role = savedRole;
    local.isOwner = savedRole === 'owner';
    rejoinRoom();
  } else {
    showScreen(homeScreen);
  }
}

// Save to localStorage
function saveToLocalStorage() {
  if (local.room) localStorage.setItem('santa_room', local.room);
  if (local.myUid) localStorage.setItem('santa_uid', local.myUid);
  if (local.name) localStorage.setItem('santa_name', local.name);
  if (local.role) localStorage.setItem('santa_role', local.role);
}

// Clear localStorage
function clearLocalStorage() {
  localStorage.removeItem('santa_room');
  localStorage.removeItem('santa_uid');
  localStorage.removeItem('santa_name');
  localStorage.removeItem('santa_role');
}

// Show a specific screen
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// Switch tabs in lobby
function switchTab(tabName) {
  // Update nav items
  navItems.forEach(item => item.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab contents
  tabContents.forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Show modal
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Add wish input field
function addWishInput(type) {
  let container, prefix;
  
  switch(type) {
    case 'create':
      wishCount++;
      container = document.querySelector('#createScreen .input-group:nth-child(2)');
      prefix = 'createWish';
      break;
    case 'join':
      wishCountJoin++;
      container = document.querySelector('#joinScreen .input-group:nth-child(3)');
      prefix = 'joinWish';
      break;
    case 'edit':
      editWishCount++;
      container = document.getElementById('editWishInputs');
      prefix = 'editWish';
      break;
  }
  
  const newInput = document.createElement('input');
  newInput.type = 'text';
  newInput.id = `${prefix}${type === 'create' ? wishCount : type === 'join' ? wishCountJoin : editWishCount}`;
  newInput.className = 'form-input';
  newInput.placeholder = `🎁 Wish ${type === 'create' ? wishCount : type === 'join' ? wishCountJoin : editWishCount}`;
  
  // Insert before the add button
  const addButton = container.querySelector('.add-more-btn');
  container.insertBefore(newInput, addButton);
}

// Create a lobby
async function createLobby() {
  const name = document.getElementById('createName').value.trim();
  const minSpend = document.getElementById('minSpend').value;
  const maxPlayers = document.getElementById('maxPlayers').value;
  const giftDeadline = document.getElementById('giftDeadline').value;
  
  // Collect wishes
  const wishes = [];
  for (let i = 1; i <= wishCount; i++) {
    const wishInput = document.getElementById(`createWish${i}`);
    if (wishInput) {
      const wish = wishInput.value.trim();
      if (wish) wishes.push(wish);
    }
  }
  
  // Validation
  if (!name) {
    showToast('Please enter your name');
    return;
  }
  
  if (wishes.length < 3) {
    showToast('Please enter at least 3 wishes');
    return;
  }
  
  // Generate room code
  const code = makeCode(5);
  const roomRef = db.ref('rooms/' + code);
  const snapshot = await roomRef.get();
  
  if (snapshot.exists()) {
    return createLobby(); // Try again if room exists
  }
  
  // Create room
  await roomRef.set({
    owner: name,
    minSpend: parseInt(minSpend),
    maxPlayers: parseInt(maxPlayers),
    giftDeadline: giftDeadline,
    createdAt: Date.now(),
    drawStarted: false
  });
  
  // Set local state
  local.role = 'owner';
  local.room = code;
  local.name = name;
  local.myUid = 'owner_' + Date.now();
  local.isOwner = true;
  local.wishes = wishes;
  
  // Join as owner
  await joinRoom(code, true, { name, wishes });
  showToast('Lobby created!');
}

// Join a lobby
async function joinLobby() {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim();
  
  // Collect wishes
  const wishes = [];
  for (let i = 1; i <= wishCountJoin; i++) {
    const wishInput = document.getElementById(`joinWish${i}`);
    if (wishInput) {
      const wish = wishInput.value.trim();
      if (wish) wishes.push(wish);
    }
  }
  
  // Validation
  if (!code) {
    showToast('Please enter a lobby code');
    return;
  }
  
  if (!name) {
    showToast('Please enter your name');
    return;
  }
  
  if (wishes.length < 3) {
    showToast('Please enter at least 3 wishes');
    return;
  }
  
  // Check if room exists
  const roomRef = db.ref('rooms/' + code);
  const snap = await roomRef.get();
  
  if (!snap.exists()) {
    showToast('Room not found');
    return;
  }
  
  const roomData = snap.val();
  if (roomData.drawStarted) {
    showToast('Draw has already started');
    return;
  }
  
  // Set local state
  local.role = 'member';
  local.room = code;
  local.name = name;
  local.myUid = 'member_' + Date.now();
  local.isOwner = false;
  local.wishes = wishes;
  
  // Join room
  await joinRoom(code, false, { name, wishes });
  showToast('Joined lobby!');
}

// Join room function
async function joinRoom(room, asOwner, payload) {
  const memberRef = db.ref(`rooms/${room}/members/${local.myUid}`);
  
  await memberRef.set({
    name: payload.name,
    wishes: payload.wishes,
    joinedAt: Date.now()
  });
  
  // Save to localStorage
  saveToLocalStorage();
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${room}`;
  document.getElementById('settingsLobbyCode').textContent = room;
  
  // Populate user data
  document.getElementById('playerName').value = payload.name;
  document.getElementById('editWish1').value = payload.wishes[0] || '';
  document.getElementById('editWish2').value = payload.wishes[1] || '';
  document.getElementById('editWish3').value = payload.wishes[2] || '';
  
  // Show admin controls if owner
  if (asOwner) {
    adminControls.classList.remove('hidden');
  }
  
  // Start listening to room updates
  listenRoom(room);
  
  // Show lobby screen
  showScreen(lobbyScreen);
}

// Rejoin room
async function rejoinRoom() {
  const roomRef = db.ref('rooms/' + local.room);
  const snap = await roomRef.get();
  
  if (!snap.exists()) {
    showToast('Room no longer exists');
    clearLocalStorage();
    showScreen(homeScreen);
    return;
  }
  
  const roomData = snap.val();
  
  // Check if user is still in the room
  const memberRef = db.ref(`rooms/${local.room}/members/${local.myUid}`);
  const memberSnap = await memberRef.get();
  
  if (!memberSnap.exists()) {
    showToast('You were removed from the room');
    clearLocalStorage();
    showScreen(homeScreen);
    return;
  }
  
  // Get user's wishes
  const memberData = memberSnap.val();
  local.wishes = memberData.wishes || [];
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${local.room}`;
  document.getElementById('settingsLobbyCode').textContent = local.room;
  
  // Populate user data
  document.getElementById('playerName').value = local.name;
  document.getElementById('editWish1').value = local.wishes[0] || '';
  document.getElementById('editWish2').value = local.wishes[1] || '';
  document.getElementById('editWish3').value = local.wishes[2] || '';
  
  // Show admin controls if owner
  if (local.isOwner) {
    adminControls.classList.remove('hidden');
  }
  
  // Update settings display
  document.getElementById('minSpendDisplay').textContent = roomData.minSpend || 50;
  document.getElementById('maxPlayersDisplay').textContent = roomData.maxPlayers || 10;
  document.getElementById('settingsMinSpend').textContent = roomData.minSpend || 50;
  document.getElementById('settingsMaxPlayers').textContent = roomData.maxPlayers || 10;
  
  if (roomData.giftDeadline) {
    const deadline = new Date(roomData.giftDeadline);
    document.getElementById('deadlineDisplay').textContent = deadline.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short'
    });
    document.getElementById('settingsDeadline').textContent = deadline.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
  
  // Start listening to room updates
  listenRoom(local.room);
  
  // Show appropriate screen
  if (roomData.drawStarted) {
    showScreen(resultScreen);
    showDrawResult();
  } else {
    showScreen(lobbyScreen);
  }
}

// Listen for room updates
function listenRoom(room) {
  const membersRef = db.ref(`rooms/${room}/members`);
  const roomRef = db.ref('rooms/' + room);
  
  membersRef.on('value', snap => {
    const members = snap.val() || {};
    const membersArr = Object.entries(members).map(([uid, info]) => ({ uid, ...info }));
    
    renderPlayerList(membersArr);
    playerCount.textContent = `${membersArr.length} player${membersArr.length !== 1 ? 's' : ''}`;
    
    // Check if current user is still in the room
    if (!members[local.myUid]) {
      showToast('You were removed from the lobby');
      clearLocalStorage();
      showScreen(homeScreen);
      return;
    }
    
    // Update local wishes if they changed
    if (members[local.myUid].wishes) {
      local.wishes = members[local.myUid].wishes;
    }
  });
  
  roomRef.on('value', snap => {
    const roomData = snap.val();
    if (!roomData) {
      showToast('Lobby was terminated');
      clearLocalStorage();
      showScreen(homeScreen);
      return;
    }
    
    // Update settings display
    document.getElementById('minSpendDisplay').textContent = roomData.minSpend || 50;
    document.getElementById('maxPlayersDisplay').textContent = roomData.maxPlayers || 10;
    document.getElementById('settingsMinSpend').textContent = roomData.minSpend || 50;
    document.getElementById('settingsMaxPlayers').textContent = roomData.maxPlayers || 10;
    
    if (roomData.giftDeadline) {
      const deadline = new Date(roomData.giftDeadline);
      document.getElementById('deadlineDisplay').textContent = deadline.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short'
      });
      document.getElementById('settingsDeadline').textContent = deadline.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
    
    // Check if draw has started
    if (roomData.drawStarted) {
      showScreen(resultScreen);
      showDrawResult();
    }
  });
}

// Render player list
function renderPlayerList(players) {
  playersList.innerHTML = '';
  
  players.forEach(player => {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    
    // Check if this player is assigned to the current user
    if (player.assignedToUid === local.myUid) {
      playerCard.classList.add('assigned');
    }
    
    playerCard.innerHTML = `
      <div class="player-name">${player.name}</div>
      ${player.wishes && player.wishes.length > 0 ? `
        <div class="player-wish">
          <i class="fas fa-gift"></i>
          ${player.wishes[0]}
        </div>
      ` : ''}
    `;
    
    playersList.appendChild(playerCard);
  });
}

// Save wishlist
async function saveWishlist() {
  const name = document.getElementById('playerName').value.trim();
  if (!name) {
    showToast('Please enter your name');
    return;
  }
  
  // Collect wishes
  const wishes = [];
  for (let i = 1; i <= editWishCount; i++) {
    const wishInput = document.getElementById(`editWish${i}`);
    if (wishInput) {
      const wish = wishInput.value.trim();
      if (wish) wishes.push(wish);
    }
  }
  
  if (wishes.length < 3) {
    showToast('Please enter at least 3 wishes');
    return;
  }
  
  // Update in Firebase
  await db.ref(`rooms/${local.room}/members/${local.myUid}`).update({
    name: name,
    wishes: wishes
  });
  
  // Update local state
  local.name = name;
  local.wishes = wishes;
  
  showToast('Wishlist updated!');
}

// Show edit settings modal
function showEditSettingsModal() {
  // Simple implementation - you can expand this
  const minSpend = prompt('Minimum spend (R):', document.getElementById('settingsMinSpend').textContent);
  if (!minSpend) return;
  
  const maxPlayers = prompt('Max players:', document.getElementById('settingsMaxPlayers').textContent);
  if (!maxPlayers) return;
  
  const giftDeadline = prompt('Gift deadline (YYYY-MM-DD):', '2023-12-24');
  if (!giftDeadline) return;
  
  saveAdminSettings(parseInt(minSpend), parseInt(maxPlayers), giftDeadline);
}

// Save admin settings
async function saveAdminSettings(minSpend, maxPlayers, giftDeadline) {
  if (!local.isOwner) return;
  
  await db.ref(`rooms/${local.room}`).update({
    minSpend: minSpend,
    maxPlayers: maxPlayers,
    giftDeadline: giftDeadline
  });
  
  showToast('Settings updated!');
}

// Start the draw
async function startDraw() {
  if (!local.isOwner) return;
  
  const room = local.room;
  const membersSnap = await db.ref(`rooms/${room}/members`).get();
  const members = membersSnap.val();
  
  if (!members) {
    showToast('No members found');
    return;
  }
  
  const entries = Object.entries(members).map(([uid, info]) => ({ 
    uid, 
    name: info.name, 
    wishes: info.wishes || [] 
  }));
  
  if (entries.length < 3) {
    showToast('Need at least 3 players');
    return;
  }
  
  const uids = entries.map(e => e.uid);
  const assigned = derangement(uids);
  
  if (!assigned) {
    showToast('Try again');
    return;
  }
  
  const updates = {};
  for (let i = 0; i < uids.length; i++) {
    const from = uids[i];
    const to = assigned[i];
    const target = entries.find(e => e.uid === to);
    
    updates[`rooms/${room}/members/${from}/assignedToUid`] = to;
    updates[`rooms/${room}/assignments/${from}`] = {
      toUid: to,
      name: target.name,
      wishes: target.wishes || []
    };
  }
  
  updates[`rooms/${room}/drawStarted`] = true;
  
  await db.ref().update(updates);
  showToast('Draw completed!');
}

// Show draw result
async function showDrawResult() {
  const assignmentRef = db.ref(`rooms/${local.room}/assignments/${local.myUid}`);
  const assignmentSnap = await assignmentRef.get();
  
  if (assignmentSnap.exists()) {
    const assignment = assignmentSnap.val();
    
    assignedPerson.textContent = assignment.name;
    assignedWishes.innerHTML = '';
    
    if (assignment.wishes && assignment.wishes.length > 0) {
      assignment.wishes.forEach(wish => {
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.textContent = wish;
        assignedWishes.appendChild(wishItem);
      });
    } else {
      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';
      wishItem.textContent = 'No wishes listed';
      assignedWishes.appendChild(wishItem);
    }
  }
}

// Leave the lobby
async function leaveLobby() {
  if (local.room && local.myUid) {
    // Remove user from members list
    await db.ref(`rooms/${local.room}/members/${local.myUid}`).remove();
    
    // If owner leaves, delete the room
    if (local.isOwner) {
      await db.ref(`rooms/${local.room}`).remove();
    }
  }
  
  // Clear local state
  local = {
    role: null,
    room: null,
    name: null,
    myUid: null,
    isOwner: false,
    wishes: []
  };
  
  clearLocalStorage();
  showScreen(homeScreen);
  showToast('Left the lobby');
}

// Utility functions
function makeCode(len = 5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function derangement(uids) {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  for (let t = 0; t < 200; t++) {
    const copy = uids.slice();
    shuffle(copy);
    if (uids.every((u, i) => u !== copy[i])) return copy;
  }
  return null;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize the app
init();
