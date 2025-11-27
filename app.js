// app.js
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
const playerModal = document.getElementById('playerModal');

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
  wishes: [],
  assignedToUid: null // NEW: Track who we're assigned to gift
};

// Wish counters and tracking
let wishCount = 3;
let wishCountJoin = 3;
let editWishCount = 3;
let joinInProgress = false;

// Festive profile icons
const festiveIcons = ['🎅', '🤶', '🦌', '🎄', '⭐', '🎁', '🔔', '❄️', '🧦', '🕯️'];

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
  let container, prefix, countRef;
  
  switch(type) {
    case 'create':
      wishCount++;
      container = document.querySelector('#createScreen .input-group:nth-child(2)');
      prefix = 'createWish';
      countRef = wishCount;
      break;
    case 'join':
      wishCountJoin++;
      container = document.querySelector('#joinScreen .input-group:nth-child(3)');
      prefix = 'joinWish';
      countRef = wishCountJoin;
      break;
    case 'edit':
      editWishCount++;
      container = document.getElementById('editWishInputs');
      prefix = 'editWish';
      countRef = editWishCount;
      break;
  }
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'wish-input-group';
  
  const newInput = document.createElement('input');
  newInput.type = 'text';
  newInput.id = `${prefix}${countRef}`;
  newInput.className = 'form-input';
  newInput.placeholder = `🎁 Wish ${countRef}`;
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-wish-btn';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.onclick = () => removeWishInput(type, countRef);
  
  inputGroup.appendChild(newInput);
  inputGroup.appendChild(removeBtn);
  
  // Insert before the add button
  const addButton = container.querySelector('.add-more-btn');
  container.insertBefore(inputGroup, addButton);
}

// Remove wish input field
function removeWishInput(type, index) {
  let container, prefix;
  
  switch(type) {
    case 'create':
      container = document.querySelector('#createScreen .input-group:nth-child(2)');
      prefix = 'createWish';
      wishCount--;
      break;
    case 'join':
      container = document.querySelector('#joinScreen .input-group:nth-child(3)');
      prefix = 'joinWish';
      wishCountJoin--;
      break;
    case 'edit':
      container = document.getElementById('editWishInputs');
      prefix = 'editWish';
      editWishCount--;
      break;
  }
  
  const inputToRemove = document.getElementById(`${prefix}${index}`);
  if (inputToRemove) {
    inputToRemove.parentElement.remove();
  }
}

// Create a lobby
async function createLobby() {
  const name = document.getElementById('createName').value.trim();
  const minSpend = document.getElementById('minSpend').value;
  const maxPlayers = document.getElementById('maxPlayers').value;
  const giftDeadline = document.getElementById('giftDeadline').value;
  
  // Collect wishes
  const wishes = collectWishes('create');
  
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
  showToast('Lobby created! 🎄');
}

// Join a lobby
async function joinLobby() {
  if (joinInProgress) {
    showToast('Please wait...');
    return;
  }
  
  joinInProgress = true;
  btnConfirmJoin.disabled = true;
  btnConfirmJoin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
  
  try {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const name = document.getElementById('joinName').value.trim();
    
    // Collect wishes
    const wishes = collectWishes('join');
    
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
    
    // Check for duplicate names
    const membersRef = db.ref(`rooms/${code}/members`);
    const membersSnap = await membersRef.get();
    const members = membersSnap.val() || {};
    
    const existingNames = Object.values(members).map(member => member.name.toLowerCase());
    if (existingNames.includes(name.toLowerCase())) {
      showToast('Name already taken in this lobby');
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
    showToast('Joined lobby! 🎅');
  } finally {
    joinInProgress = false;
    btnConfirmJoin.disabled = false;
    btnConfirmJoin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Lobby';
  }
}

// Collect wishes from inputs
function collectWishes(type) {
  const wishes = [];
  let count;
  
  switch(type) {
    case 'create':
      count = wishCount;
      break;
    case 'join':
      count = wishCountJoin;
      break;
    case 'edit':
      count = editWishCount;
      break;
  }
  
  for (let i = 1; i <= count; i++) {
    let wishInput;
    switch(type) {
      case 'create':
        wishInput = document.getElementById(`createWish${i}`);
        break;
      case 'join':
        wishInput = document.getElementById(`joinWish${i}`);
        break;
      case 'edit':
        wishInput = document.getElementById(`editWish${i}`);
        break;
    }
    
    if (wishInput) {
      const wish = wishInput.value.trim();
      if (wish) wishes.push(wish);
    }
  }
  
  return wishes;
}

// Join room function
async function joinRoom(room, asOwner, payload) {
  const memberRef = db.ref(`rooms/${room}/members/${local.myUid}`);
  
  // Generate festive icon for user
  const iconIndex = Math.floor(Math.random() * festiveIcons.length);
  const festiveIcon = festiveIcons[iconIndex];
  
  await memberRef.set({
    name: payload.name,
    wishes: payload.wishes,
    joinedAt: Date.now(),
    icon: festiveIcon
  });
  
  // Save to localStorage
  saveToLocalStorage();
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${room}`;
  document.getElementById('settingsLobbyCode').textContent = room;
  
  // Populate user data
  document.getElementById('playerName').value = payload.name;
  
  // Clear existing wish inputs and recreate
  const editWishContainer = document.getElementById('editWishInputs');
  editWishContainer.innerHTML = '';
  
  payload.wishes.forEach((wish, index) => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'wish-input-group';
    
    const wishInput = document.createElement('input');
    wishInput.type = 'text';
    wishInput.id = `editWish${index + 1}`;
    wishInput.className = 'form-input';
    wishInput.placeholder = `🎁 Wish ${index + 1}`;
    wishInput.value = wish;
    
    if (index >= 3) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-wish-btn';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = () => removeWishInput('edit', index + 1);
      inputGroup.appendChild(removeBtn);
    }
    
    inputGroup.appendChild(wishInput);
    editWishContainer.appendChild(inputGroup);
  });
  
  editWishCount = Math.max(3, payload.wishes.length);
  
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
  
  // Get user's wishes and assignment
  const memberData = memberSnap.val();
  local.wishes = memberData.wishes || [];
  local.assignedToUid = memberData.assignedToUid || null; // NEW: Get our assignment
  
  // Update UI
  document.getElementById('lobbyTitle').textContent = `Lobby: ${local.room}`;
  document.getElementById('settingsLobbyCode').textContent = local.room;
  
  // Populate user data
  document.getElementById('playerName').value = local.name;
  
  // Clear and recreate wish inputs
  const editWishContainer = document.getElementById('editWishInputs');
  editWishContainer.innerHTML = '';
  
  local.wishes.forEach((wish, index) => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'wish-input-group';
    
    const wishInput = document.createElement('input');
    wishInput.type = 'text';
    wishInput.id = `editWish${index + 1}`;
    wishInput.className = 'form-input';
    wishInput.placeholder = `🎁 Wish ${index + 1}`;
    wishInput.value = wish;
    
    if (index >= 3) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-wish-btn';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = () => removeWishInput('edit', index + 1);
      inputGroup.appendChild(removeBtn);
    }
    
    inputGroup.appendChild(wishInput);
    editWishContainer.appendChild(inputGroup);
  });
  
  editWishCount = Math.max(3, local.wishes.length);
  
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
    
    // Update our local assignment if it exists
    if (members[local.myUid] && members[local.myUid].assignedToUid) {
      local.assignedToUid = members[local.myUid].assignedToUid;
    }
    
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

// Render player list - FIXED VERSION
function renderPlayerList(players) {
  playersList.innerHTML = '';
  
  players.forEach(player => {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    
    // FIXED: Check if this player is the one WE are assigned to gift
    // (not the one who is assigned to gift to us)
    if (player.uid === local.assignedToUid) {
      playerCard.classList.add('assigned');
    }
    
    // Check if this is the current user
    const isCurrentUser = player.uid === local.myUid;
    const displayName = isCurrentUser ? `${player.name} (you)` : player.name;
    
    playerCard.innerHTML = `
      <div class="player-info">
        <div class="player-icon">${player.icon || '🎅'}</div>
        <div class="player-details">
          <div class="player-name">${displayName}</div>
          ${player.wishes && player.wishes.length > 0 ? `
            <div class="player-wish">
              <i class="fas fa-gift"></i>
              ${player.wishes[0]}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Only add click listener if not current user
    if (!isCurrentUser) {
      playerCard.style.cursor = 'pointer';
      playerCard.addEventListener('click', () => showPlayerDetails(player));
    }
    
    playersList.appendChild(playerCard);
  });
}

// Show player details modal
function showPlayerDetails(player) {
  document.getElementById('playerModalIcon').textContent = player.icon || '🎅';
  document.getElementById('playerModalName').textContent = player.name;
  
  const wishesContainer = document.getElementById('playerModalWishes');
  wishesContainer.innerHTML = '';
  
  if (player.wishes && player.wishes.length > 0) {
    player.wishes.forEach(wish => {
      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';
      wishItem.textContent = wish;
      wishesContainer.appendChild(wishItem);
    });
  } else {
    const wishItem = document.createElement('div');
    wishItem.className = 'wish-item';
    wishItem.textContent = 'No wishes listed';
    wishesContainer.appendChild(wishItem);
  }
  
  showModal('playerModal');
}

// Save wishlist
async function saveWishlist() {
  const name = document.getElementById('playerName').value.trim();
  if (!name) {
    showToast('Please enter your name');
    return;
  }
  
  // Check for duplicate names (if name changed)
  if (name !== local.name) {
    const membersRef = db.ref(`rooms/${local.room}/members`);
    const membersSnap = await membersRef.get();
    const members = membersSnap.val() || {};
    
    const existingNames = Object.values(members)
      .filter(member => member.name !== local.name) // Exclude current name
      .map(member => member.name.toLowerCase());
    
    if (existingNames.includes(name.toLowerCase())) {
      showToast('Name already taken in this lobby');
      return;
    }
  }
  
  // Collect wishes
  const wishes = collectWishes('edit');
  
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
  
  showToast('Wishlist updated! 🎁');
}

// Show edit settings modal
function showEditSettingsModal() {
  const currentMinSpend = document.getElementById('settingsMinSpend').textContent;
  const currentMaxPlayers = document.getElementById('settingsMaxPlayers').textContent;
  
  const minSpend = prompt('Minimum spend (R):', currentMinSpend);
  if (!minSpend) return;
  
  const maxPlayers = prompt('Max players:', currentMaxPlayers);
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
  
  showToast('Settings updated! ⚙️');
}

// IMPROVED: Start the draw with truly random assignment
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
  
  if (entries.length < 2) {
    showToast('Need at least 2 players');
    return;
  }
  
  const uids = entries.map(e => e.uid);
  
  // Use the improved secure derangement algorithm
  const assigned = secureDerangement(uids);
  
  if (!assigned) {
    showToast('Could not create valid assignments. Please try again.');
    return;
  }
  
  // Verify the assignment is valid
  let isValidAssignment = true;
  for (let i = 0; i < uids.length; i++) {
    if (uids[i] === assigned[i]) {
      isValidAssignment = false;
      break;
    }
  }
  
  if (!isValidAssignment) {
    showToast('Invalid assignment detected. Please try again.');
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
  showToast('Draw completed! ✨ Everyone has been randomly assigned!');
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
  if (confirm('Are you sure you want to leave the lobby?')) {
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
      wishes: [],
      assignedToUid: null
    };
    
    clearLocalStorage();
    showScreen(homeScreen);
    showToast('Left the lobby');
  }
}

// IMPROVED: Utility functions with true randomness
function makeCode(len = 5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const crypto = window.crypto || window.msCrypto;
  
  for (let i = 0; i < len; i++) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomIndex = randomBuffer[0] % chars.length;
    s += chars[randomIndex];
  }
  return s;
}

// IMPROVED: Truly random derangement algorithm
function secureDerangement(uids) {
  if (uids.length < 2) return null;
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const crypto = window.crypto || window.msCrypto;
  
  // Fisher-Yates shuffle with crypto randomness
  function cryptoShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Get cryptographically secure random index
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      const j = randomBuffer[0] % (i + 1);
      
      // Swap elements
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Algorithm: Keep shuffling until we get a valid derangement
  // With crypto randomness, this should be very efficient
  let attempts = 0;
  const maxAttempts = 1000; // Increased safety margin
  
  while (attempts < maxAttempts) {
    const shuffled = cryptoShuffle(uids);
    let isValid = true;
    
    // Check if it's a valid derangement (no one gets themselves)
    for (let i = 0; i < uids.length; i++) {
      if (uids[i] === shuffled[i]) {
        isValid = false;
        break;
      }
    }
    
    if (isValid) {
      return shuffled;
    }
    attempts++;
  }
  
  // Fallback: Use Sattolo's algorithm (guaranteed derangement)
  console.log("Using fallback derangement algorithm");
  return sattoloCycle(uids);
}

// Sattolo's algorithm - guaranteed to produce a derangement
function sattoloCycle(array) {
  const arr = [...array];
  const crypto = window.crypto || window.msCrypto;
  
  for (let i = arr.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % i; // j is in [0, i-1]
    
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Keep the old derangement function for compatibility but use the new secure version
function derangement(uids) {
  return secureDerangement(uids);
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
