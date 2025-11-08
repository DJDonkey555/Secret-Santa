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
const lobbyScreen = document.getElementById('lobbyScreen');
const resultScreen = document.getElementById('resultScreen');
const playerModal = document.getElementById('playerModal');

const btnCreate = document.getElementById('btnCreate');
const btnJoin = document.getElementById('btnJoin');
const btnBack = document.getElementById('btnBack');
const btnUser = document.getElementById('btnUser');
const btnSaveWishlist = document.getElementById('btnSaveWishlist');
const btnStartDraw = document.getElementById('btnStartDraw');
const btnEditSettings = document.getElementById('btnEditSettings');
const btnBackToLobby = document.getElementById('btnBackToLobby');
const btnCloseModal = document.getElementById('btnCloseModal');

const playersList = document.getElementById('playersList');
const playerModalTitle = document.getElementById('playerModalTitle');
const playerModalWishes = document.getElementById('playerModalWishes');
const assignedName = document.getElementById('assignedName');
const assignedWishes = document.getElementById('assignedWishes');
const adminControls = document.getElementById('adminControls');

const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Local state
let local = {
  role: null,
  room: null,
  name: null,
  myUid: null,
  isOwner: false,
  wishes: []
};

// Initialize the app
function init() {
  setupEventListeners();
  checkLocalStorage();
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  btnCreate.addEventListener('click', showCreateModal);
  btnJoin.addEventListener('click', showJoinModal);
  btnBack.addEventListener('click', () => showScreen(homeScreen));
  btnBackToLobby.addEventListener('click', () => showScreen(lobbyScreen));
  btnUser.addEventListener('click', () => switchTab('myCard'));
  
  // Wishlist
  btnSaveWishlist.addEventListener('click', saveWishlist);
  
  // Admin
  btnStartDraw.addEventListener('click', startDraw);
  btnEditSettings.addEventListener('click', showEditSettingsModal);
  
  // Modal
  btnCloseModal.addEventListener('click', () => playerModal.classList.remove('active'));
  
  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === playerModal) {
      playerModal.classList.remove('active');
    }
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

// Switch tabs
function switchTab(tabName) {
  tabs.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Show create modal
function showCreateModal() {
  const name = prompt("Enter your name:");
  if (!name) return;
  
  const wish1 = prompt("Enter your most desired gift:");
  const wish2 = prompt("Enter your second choice:");
  const wish3 = prompt("Enter your third choice:");
  
  if (!wish1 || !wish2 || !wish3) {
    alert("Please enter all three wishes");
    return;
  }
  
  createLobby(name, [wish1, wish2, wish3]);
}

// Show join modal
function showJoinModal() {
  const code = prompt("Enter lobby code:").toUpperCase();
  if (!code) return;
  
  const name = prompt("Enter your name:");
  if (!name) return;
  
  const wish1 = prompt("Enter your most desired gift:");
  const wish2 = prompt("Enter your second choice:");
  const wish3 = prompt("Enter your third choice:");
  
  if (!wish1 || !wish2 || !wish3) {
    alert("Please enter all three wishes");
    return;
  }
  
  joinLobby(code, name, [wish1, wish2, wish3]);
}

// Create lobby
async function createLobby(name, wishes) {
  const code = makeCode(5);
  const roomRef = db.ref('rooms/' + code);
  const snapshot = await roomRef.get();
  
  if (snapshot.exists()) return createLobby(name, wishes);
  
  await roomRef.set({
    owner: name,
    minSpend: 50,
    maxPlayers: 10,
    giftDeadline: '2023-12-24',
    createdAt: Date.now(),
    drawStarted: false
  });
  
  local.role = 'owner';
  local.room = code;
  local.name = name;
  local.myUid = 'owner_' + Date.now();
  local.isOwner = true;
  local.wishes = wishes;
  
  await joinRoom(code, true, { name, wishes });
  showToast('Lobby created!');
}

// Join lobby
async function joinLobby(code, name, wishes) {
  const roomRef = db.ref('rooms/' + code);
  const snap = await roomRef.get();
  
  if (!snap.exists()) {
    alert('Room not found');
    return;
  }
  
  const roomData = snap.val();
  if (roomData.drawStarted) {
    alert('Draw already started');
    return;
  }
  
  local.role = 'member';
  local.room = code;
  local.name = name;
  local.myUid = 'member_' + Date.now();
  local.isOwner = false;
  local.wishes = wishes;
  
  await joinRoom(code, false, { name, wishes });
  showToast('Joined lobby!');
}

// Join room
async function joinRoom(room, asOwner, payload) {
  const memberRef = db.ref(`rooms/${room}/members/${local.myUid}`);
  
  await memberRef.set({
    name: payload.name,
    wishes: payload.wishes,
    joinedAt: Date.now()
  });
  
  saveToLocalStorage();
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${room}`;
  document.getElementById('playerName').value = payload.name;
  document.getElementById('wish1').value = payload.wishes[0] || '';
  document.getElementById('wish2').value = payload.wishes[1] || '';
  document.getElementById('wish3').value = payload.wishes[2] || '';
  
  if (asOwner) {
    adminControls.classList.remove('hidden');
  }
  
  listenRoom(room);
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
  
  const memberRef = db.ref(`rooms/${local.room}/members/${local.myUid}`);
  const memberSnap = await memberRef.get();
  
  if (!memberSnap.exists()) {
    showToast('You were removed from the room');
    clearLocalStorage();
    showScreen(homeScreen);
    return;
  }
  
  const memberData = memberSnap.val();
  local.wishes = memberData.wishes || [];
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${local.room}`;
  document.getElementById('playerName').value = local.name;
  document.getElementById('wish1').value = local.wishes[0] || '';
  document.getElementById('wish2').value = local.wishes[1] || '';
  document.getElementById('wish3').value = local.wishes[2] || '';
  
  if (local.isOwner) {
    adminControls.classList.remove('hidden');
  }
  
  const roomData = snap.val();
  document.getElementById('minSpendValue').textContent = roomData.minSpend || 50;
  document.getElementById('maxPlayersValue').textContent = roomData.maxPlayers || 10;
  
  if (roomData.giftDeadline) {
    document.getElementById('giftDeadlineValue').textContent = 
      new Date(roomData.giftDeadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
  }
  
  listenRoom(local.room);
  
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
    
    if (!members[local.myUid]) {
      showToast('You were removed from the lobby');
      clearLocalStorage();
      showScreen(homeScreen);
      return;
    }
    
    if (members[local.myUid].wishes) {
      local.wishes = members[local.myUid].wishes;
    }
  });
  
  roomRef.on('value', snap => {
    const roomData = snap.val();
    if (!roomData) {
      showToast('Lobby terminated');
      clearLocalStorage();
      showScreen(homeScreen);
      return;
    }
    
    document.getElementById('minSpendValue').textContent = roomData.minSpend || 50;
    document.getElementById('maxPlayersValue').textContent = roomData.maxPlayers || 10;
    
    if (roomData.giftDeadline) {
      document.getElementById('giftDeadlineValue').textContent = 
        new Date(roomData.giftDeadline).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
    }
    
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
      ${local.isOwner && player.uid !== local.myUid ? `
        <button class="kick-btn" data-uid="${player.uid}">
          <i class="fas fa-times"></i>
        </button>
      ` : ''}
    `;
    
    playerCard.addEventListener('click', (e) => {
      if (!e.target.closest('.kick-btn')) {
        showPlayerDetails(player);
      }
    });
    
    const kickBtn = playerCard.querySelector('.kick-btn');
    if (kickBtn) {
      kickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        kickPlayer(player.uid);
      });
    }
    
    playersList.appendChild(playerCard);
  });
}

// Show player details
function showPlayerDetails(player) {
  playerModalTitle.textContent = player.name;
  playerModalWishes.innerHTML = '';
  
  if (player.wishes && player.wishes.length > 0) {
    player.wishes.forEach(wish => {
      const li = document.createElement('li');
      li.textContent = wish;
      playerModalWishes.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No wishes listed';
    playerModalWishes.appendChild(li);
  }
  
  playerModal.classList.add('active');
}

// Kick player
async function kickPlayer(uid) {
  if (!local.isOwner) return;
  
  if (confirm('Kick this player?')) {
    await db.ref(`rooms/${local.room}/members/${uid}`).remove();
    showToast('Player kicked');
  }
}

// Save wishlist
async function saveWishlist() {
  const name = document.getElementById('playerName').value.trim();
  if (!name) {
    alert('Enter your name');
    return;
  }
  
  const wishes = [
    document.getElementById('wish1').value.trim(),
    document.getElementById('wish2').value.trim(),
    document.getElementById('wish3').value.trim()
  ].filter(wish => wish);
  
  if (wishes.length < 3) {
    alert('Enter at least 3 wishes');
    return;
  }
  
  await db.ref(`rooms/${local.room}/members/${local.myUid}`).update({
    name: name,
    wishes: wishes
  });
  
  local.name = name;
  local.wishes = wishes;
  showToast('Wishlist saved!');
}

// Show edit settings modal
function showEditSettingsModal() {
  const minSpend = prompt('Minimum spend (R):', document.getElementById('minSpendValue').textContent);
  if (!minSpend) return;
  
  const maxPlayers = prompt('Max players:', document.getElementById('maxPlayersValue').textContent);
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

// Start draw
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
    
    assignedName.textContent = assignment.name;
    assignedWishes.innerHTML = '';
    
    if (assignment.wishes && assignment.wishes.length > 0) {
      assignment.wishes.forEach(wish => {
        const li = document.createElement('li');
        li.textContent = wish;
        assignedWishes.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No wishes listed';
      assignedWishes.appendChild(li);
    }
  }
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
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    z-index: 1000;
    box-shadow: var(--shadow);
    font-weight: 500;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
}

// Initialize the app
init();
