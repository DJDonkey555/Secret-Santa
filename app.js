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
const editWishlistScreen = document.getElementById('editWishlistScreen');
const adminSettingsScreen = document.getElementById('adminSettingsScreen');

const homeButtons = document.getElementById('homeButtons');
const playerListContainer = document.getElementById('playerListContainer');
const lobbyControls = document.getElementById('lobbyControls');

const btnCreate = document.getElementById('btnCreate');
const btnJoin = document.getElementById('btnJoin');
const btnCreateMain = document.getElementById('btnCreateMain');
const btnJoinMain = document.getElementById('btnJoinMain');
const btnStartDraw = document.getElementById('btnStartDraw');
const btnLeave = document.getElementById('btnLeave');

const btnConfirmCreate = document.getElementById('btnConfirmCreate');
const btnResetCreate = document.getElementById('btnResetCreate');
const btnConfirmJoin = document.getElementById('btnConfirmJoin');
const btnResetJoin = document.getElementById('btnResetJoin');
const btnDone = document.getElementById('btnDone');

const btnAddWish = document.getElementById('btnAddWish');
const btnAddWishJoin = document.getElementById('btnAddWishJoin');

const btnEditWishlist = document.getElementById('btnEditWishlist');
const btnSettings = document.getElementById('btnSettings');
const btnAddEditWish = document.getElementById('btnAddEditWish');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const btnSaveWishlist = document.getElementById('btnSaveWishlist');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnViewWishlist = document.getElementById('btnViewWishlist');

const playerList = document.getElementById('playerList');
const playerDetails = document.getElementById('playerDetails');
const selectedPlayerName = document.getElementById('selectedPlayerName');
const selectedPlayerWishes = document.getElementById('selectedPlayerWishes');
const editWishInputs = document.getElementById('editWishInputs');

const assignedPerson = document.getElementById('assignedPerson');
const assignedWishes = document.getElementById('assignedWishes');

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

// Wish counter for dynamic wish inputs
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
  // Navigation buttons
  btnCreate.addEventListener('click', showCreateScreen);
  btnJoin.addEventListener('click', showJoinScreen);
  btnCreateMain.addEventListener('click', showCreateScreen);
  btnJoinMain.addEventListener('click', showJoinScreen);
  btnLeave.addEventListener('click', leaveLobby);
  btnDone.addEventListener('click', () => showScreen(lobbyScreen));
  
  // Create lobby
  btnConfirmCreate.addEventListener('click', createLobby);
  btnResetCreate.addEventListener('click', resetCreateForm);
  btnAddWish.addEventListener('click', addWishInput);
  
  // Join lobby
  btnConfirmJoin.addEventListener('click', joinLobby);
  btnResetJoin.addEventListener('click', resetJoinForm);
  btnAddWishJoin.addEventListener('click', addWishInputJoin);
  
  // Start draw
  btnStartDraw.addEventListener('click', startDraw);
  
  // Edit wishlist
  btnEditWishlist.addEventListener('click', showEditWishlist);
  btnAddEditWish.addEventListener('click', addEditWishInput);
  btnCancelEdit.addEventListener('click', () => showScreen(lobbyScreen));
  btnSaveWishlist.addEventListener('click', saveWishlist);
  
  // Settings
  btnSettings.addEventListener('click', showAdminSettings);
  btnCancelSettings.addEventListener('click', () => showScreen(lobbyScreen));
  btnSaveSettings.addEventListener('click', saveAdminSettings);
  
  // View wishlist from result screen
  btnViewWishlist.addEventListener('click', showEditWishlist);
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
    
    // Try to rejoin the room
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
  [homeScreen, createScreen, joinScreen, lobbyScreen, resultScreen, editWishlistScreen, adminSettingsScreen].forEach(s => {
    s.classList.add('hidden');
  });
  screen.classList.remove('hidden');
}

// Show create screen
function showCreateScreen() {
  showScreen(createScreen);
}

// Show join screen
function showJoinScreen() {
  showScreen(joinScreen);
}

// Show edit wishlist screen
function showEditWishlist() {
  // Populate with current wishes
  editWishInputs.innerHTML = '';
  editWishCount = 0;
  
  local.wishes.forEach((wish, index) => {
    editWishCount++;
    const wishItem = document.createElement('div');
    wishItem.className = 'wish-item';
    wishItem.innerHTML = `
      <input type="text" id="editWish${editWishCount}" class="form-control" placeholder="Wish ${editWishCount}" value="${wish}">
      ${editWishCount > 3 ? `<button type="button" class="btn btn-secondary remove-wish" data-wish="${editWishCount}">
        <i class="fas fa-times"></i>
      </button>` : ''}
    `;
    editWishInputs.appendChild(wishItem);
    
    // Add event listener to remove button if it exists
    if (editWishCount > 3) {
      wishItem.querySelector('.remove-wish').addEventListener('click', function() {
        if (editWishCount > 3) {
          this.parentElement.remove();
          editWishCount--;
        }
      });
    }
  });
  
  showScreen(editWishlistScreen);
}

// Show admin settings screen
function showAdminSettings() {
  if (!local.isOwner) return;
  
  // Populate with current settings
  document.getElementById('editMinSpend').value = document.getElementById('minSpendDisplay').textContent;
  document.getElementById('editMaxPlayers').value = document.getElementById('maxPlayersDisplay').textContent;
  document.getElementById('editGiftDeadline').value = document.getElementById('deadlineDisplay').dataset.value || '';
  
  showScreen(adminSettingsScreen);
}

// Add wish input field
function addWishInput() {
  wishCount++;
  const wishInputs = document.querySelector('#createScreen .wish-inputs');
  const newWish = document.createElement('div');
  newWish.className = 'wish-item';
  newWish.innerHTML = `
    <input type="text" id="createWish${wishCount}" class="form-control" placeholder="Wish ${wishCount}">
    <button type="button" class="btn btn-secondary remove-wish" data-wish="${wishCount}">
      <i class="fas fa-times"></i>
    </button>
  `;
  wishInputs.appendChild(newWish);
  
  // Add event listener to remove button
  newWish.querySelector('.remove-wish').addEventListener('click', function() {
    if (wishCount > 3) {
      this.parentElement.remove();
      wishCount--;
    }
  });
}

// Add wish input field for join screen
function addWishInputJoin() {
  wishCountJoin++;
  const wishInputs = document.querySelector('#joinScreen .wish-inputs');
  const newWish = document.createElement('div');
  newWish.className = 'wish-item';
  newWish.innerHTML = `
    <input type="text" id="joinWish${wishCountJoin}" class="form-control" placeholder="Wish ${wishCountJoin}">
    <button type="button" class="btn btn-secondary remove-wish" data-wish="${wishCountJoin}">
      <i class="fas fa-times"></i>
    </button>
  `;
  wishInputs.appendChild(newWish);
  
  // Add event listener to remove button
  newWish.querySelector('.remove-wish').addEventListener('click', function() {
    if (wishCountJoin > 3) {
      this.parentElement.remove();
      wishCountJoin--;
    }
  });
}

// Add wish input field for edit screen
function addEditWishInput() {
  editWishCount++;
  const newWish = document.createElement('div');
  newWish.className = 'wish-item';
  newWish.innerHTML = `
    <input type="text" id="editWish${editWishCount}" class="form-control" placeholder="Wish ${editWishCount}">
    <button type="button" class="btn btn-secondary remove-wish" data-wish="${editWishCount}">
      <i class="fas fa-times"></i>
    </button>
  `;
  editWishInputs.appendChild(newWish);
  
  // Add event listener to remove button
  newWish.querySelector('.remove-wish').addEventListener('click', function() {
    if (editWishCount > 3) {
      this.parentElement.remove();
      editWishCount--;
    }
  });
}

// Reset create form
function resetCreateForm() {
  document.getElementById('createName').value = '';
  document.getElementById('createWish1').value = '';
  document.getElementById('createWish2').value = '';
  document.getElementById('createWish3').value = '';
  document.getElementById('minSpend').value = '50';
  document.getElementById('maxPlayers').value = '10';
  document.getElementById('giftDeadline').value = '';
  
  // Remove additional wish inputs
  const wishInputs = document.querySelector('#createScreen .wish-inputs');
  while (wishInputs.children.length > 3) {
    wishInputs.removeChild(wishInputs.lastChild);
  }
  wishCount = 3;
}

// Reset join form
function resetJoinForm() {
  document.getElementById('joinCode').value = '';
  document.getElementById('joinName').value = '';
  document.getElementById('joinWish1').value = '';
  document.getElementById('joinWish2').value = '';
  document.getElementById('joinWish3').value = '';
  
  // Remove additional wish inputs
  const wishInputs = document.querySelector('#joinScreen .wish-inputs');
  while (wishInputs.children.length > 3) {
    wishInputs.removeChild(wishInputs.lastChild);
  }
  wishCountJoin = 3;
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
    const wish = document.getElementById(`createWish${i}`).value.trim();
    if (wish) wishes.push(wish);
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
    // If room exists, try again
    return createLobby();
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
  
  showToast('Lobby created successfully!');
}

// Join a lobby
async function joinLobby() {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim();
  
  // Collect wishes
  const wishes = [];
  for (let i = 1; i <= wishCountJoin; i++) {
    const wish = document.getElementById(`joinWish${i}`).value.trim();
    if (wish) wishes.push(wish);
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
    showToast('Room not found. Check the code.');
    return;
  }
  
  // Check if draw has already started
  const roomData = snap.val();
  if (roomData.drawStarted) {
    showToast('The draw has already started in this room');
    return;
  }
  
  // Check if room is full
  const membersSnap = await roomRef.child('members').get();
  const members = membersSnap.val() || {};
  if (Object.keys(members).length >= roomData.maxPlayers) {
    showToast('This room is already full');
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
  
  showToast('Joined lobby successfully!');
}

// Join room function
async function joinRoom(room, asOwner = false, payload) {
  const memberRef = db.ref(`rooms/${room}/members/${local.myUid}`);
  
  await memberRef.set({
    name: payload.name,
    wishes: payload.wishes,
    joinedAt: Date.now()
  });
  
  // Save to localStorage
  saveToLocalStorage();
  
  // Update UI
  homeButtons.classList.add('hidden');
  playerListContainer.classList.remove('hidden');
  lobbyControls.classList.remove('hidden');
  
  if (asOwner) {
    btnStartDraw.classList.remove('hidden');
    btnSettings.classList.remove('hidden');
  } else {
    btnStartDraw.classList.add('hidden');
    btnSettings.classList.add('hidden');
  }
  
  // Start listening to room updates
  listenRoom(room);
  
  // Show lobby screen
  showScreen(lobbyScreen);
  document.getElementById('lobbyCodeDisplay').textContent = room;
  
  // Display room settings
  const roomRef = db.ref('rooms/' + room);
  const roomSnap = await roomRef.get();
  if (roomSnap.exists()) {
    const roomData = roomSnap.val();
    document.getElementById('minSpendDisplay').textContent = roomData.minSpend || 50;
    document.getElementById('maxPlayersDisplay').textContent = roomData.maxPlayers || 10;
    
    if (roomData.giftDeadline) {
      document.getElementById('deadlineDisplay').textContent = new Date(roomData.giftDeadline).toLocaleDateString();
      document.getElementById('deadlineDisplay').dataset.value = roomData.giftDeadline;
    } else {
      document.getElementById('deadlineDisplay').textContent = 'Not set';
    }
  }
}

// Rejoin room
async function rejoinRoom() {
  const roomRef = db.ref('rooms/' + local.room);
  const snap = await roomRef.get();
  
  if (!snap.exists()) {
    showToast('The room no longer exists');
    clearLocalStorage();
    showScreen(homeScreen);
    return;
  }
  
  const roomData = snap.val();
  
  // Check if user is still in the room
  const memberRef = db.ref(`rooms/${local.room}/members/${local.myUid}`);
  const memberSnap = await memberRef.get();
  
  if (!memberSnap.exists()) {
    showToast('You are no longer in this room');
    clearLocalStorage();
    showScreen(homeScreen);
    return;
  }
  
  // Get user's wishes
  const memberData = memberSnap.val();
  local.wishes = memberData.wishes || [];
  
  // Update UI
  homeButtons.classList.add('hidden');
  playerListContainer.classList.remove('hidden');
  lobbyControls.classList.remove('hidden');
  
  if (local.isOwner) {
    btnStartDraw.classList.remove('hidden');
    btnSettings.classList.remove('hidden');
    
    // Check if draw has already started
    if (roomData.drawStarted) {
      btnStartDraw.disabled = true;
      btnStartDraw.textContent = 'Draw Completed';
    }
  } else {
    btnStartDraw.classList.add('hidden');
    btnSettings.classList.add('hidden');
    
    // Check if draw has happened and show result
    if (roomData.drawStarted) {
      showDrawResult();
    }
  }
  
  // Start listening to room updates
  listenRoom(local.room);
  
  // Show appropriate screen
  if (roomData.drawStarted) {
    showScreen(resultScreen);
    showDrawResult();
  } else {
    showScreen(lobbyScreen);
    document.getElementById('lobbyCodeDisplay').textContent = local.room;
    document.getElementById('minSpendDisplay').textContent = roomData.minSpend || 50;
    document.getElementById('maxPlayersDisplay').textContent = roomData.maxPlayers || 10;
    
    if (roomData.giftDeadline) {
      document.getElementById('deadlineDisplay').textContent = new Date(roomData.giftDeadline).toLocaleDateString();
      document.getElementById('deadlineDisplay').dataset.value = roomData.giftDeadline;
    } else {
      document.getElementById('deadlineDisplay').textContent = 'Not set';
    }
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
    
    // Check if current user is still in the room
    if (!members[local.myUid]) {
      // User was kicked or removed
      showToast('You have been removed from the lobby');
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
    if (!roomData) return;
    
    // Update settings display
    document.getElementById('minSpendDisplay').textContent = roomData.minSpend || 50;
    document.getElementById('maxPlayersDisplay').textContent = roomData.maxPlayers || 10;
    
    if (roomData.giftDeadline) {
      document.getElementById('deadlineDisplay').textContent = new Date(roomData.giftDeadline).toLocaleDateString();
      document.getElementById('deadlineDisplay').dataset.value = roomData.giftDeadline;
    }
    
    // Check if draw has started
    if (roomData.drawStarted) {
      showDrawResult();
      
      if (local.isOwner) {
        btnStartDraw.disabled = true;
        btnStartDraw.textContent = 'Draw Completed';
      }
    }
  });
}

// Render player list
function renderPlayerList(players) {
  playerList.innerHTML = '';
  
  players.forEach(player => {
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.textContent = player.name;
    
    // Add click event to show player details
    playerItem.addEventListener('click', () => {
      showPlayerDetails(player);
    });
    
    // Add kick button for owner (except themselves)
    if (local.isOwner && player.uid !== local.myUid) {
      const kickBtn = document.createElement('button');
      kickBtn.className = 'kick-button';
      kickBtn.innerHTML = '<i class="fas fa-user-times"></i>';
      kickBtn.title = 'Kick player';
      kickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        kickPlayer(player.uid);
      });
      playerItem.appendChild(kickBtn);
    }
    
    playerList.appendChild(playerItem);
  });
}

// Show player details
function showPlayerDetails(player) {
  selectedPlayerName.textContent = player.name;
  selectedPlayerWishes.innerHTML = '';
  
  if (player.wishes && player.wishes.length > 0) {
    player.wishes.forEach(wish => {
      const li = document.createElement('li');
      li.textContent = wish;
      selectedPlayerWishes.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No wishes listed';
    selectedPlayerWishes.appendChild(li);
  }
  
  playerDetails.classList.remove('hidden');
}

// Kick a player
async function kickPlayer(uid) {
  if (!local.isOwner) return;
  
  if (confirm('Are you sure you want to kick this player?')) {
    await db.ref(`rooms/${local.room}/members/${uid}`).remove();
    showToast('Player kicked');
    
    // Clear player details if the kicked player was being viewed
    const memberSnap = await db.ref(`rooms/${local.room}/members/${uid}`).get();
    if (!memberSnap.exists()) {
      playerDetails.classList.add('hidden');
    }
  }
}

// Save wishlist
async function saveWishlist() {
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
  await db.ref(`rooms/${local.room}/members/${local.myUid}/wishes`).set(wishes);
  
  // Update local state
  local.wishes = wishes;
  
  showToast('Wishlist updated successfully!');
  showScreen(lobbyScreen);
}

// Save admin settings
async function saveAdminSettings() {
  if (!local.isOwner) return;
  
  const minSpend = document.getElementById('editMinSpend').value;
  const maxPlayers = document.getElementById('editMaxPlayers').value;
  const giftDeadline = document.getElementById('editGiftDeadline').value;
  
  const updates = {};
  updates[`rooms/${local.room}/minSpend`] = parseInt(minSpend);
  updates[`rooms/${local.room}/maxPlayers`] = parseInt(maxPlayers);
  updates[`rooms/${local.room}/giftDeadline`] = giftDeadline;
  
  await db.ref().update(updates);
  
  showToast('Settings updated successfully!');
  showScreen(lobbyScreen);
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
    showToast('Need at least 3 players to start the draw');
    return;
  }
  
  const uids = entries.map(e => e.uid);
  const assigned = derangement(uids);
  
  if (!assigned) {
    showToast('Could not create assignments. Try again.');
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
        const li = document.createElement('li');
        li.textContent = wish;
        assignedWishes.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No wishes listed';
      assignedWishes.appendChild(li);
    }
    
    showScreen(resultScreen);
    
    // Highlight the assigned player in the player list
    const playerItems = document.querySelectorAll('.player-item');
    playerItems.forEach(item => {
      if (item.textContent.includes(assignment.name)) {
        item.classList.add('assigned');
      }
    });
    
    // Disable leave button after draw
    btnLeave.disabled = true;
    btnLeave.textContent = 'Cannot leave after draw';
  }
}

// Leave the lobby
async function leaveLobby() {
  // Check if draw has started
  const roomRef = db.ref('rooms/' + local.room);
  const roomSnap = await roomRef.get();
  const roomData = roomSnap.val();
  
  if (roomData.drawStarted && !local.isOwner) {
    showToast('Cannot leave after the draw has started');
    return;
  }
  
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
  
  // Reset UI
  homeButtons.classList.remove('hidden');
  playerListContainer.classList.add('hidden');
  lobbyControls.classList.add('hidden');
  playerDetails.classList.add('hidden');
  btnLeave.disabled = false;
  btnLeave.textContent = 'Leave Lobby';
  
  showScreen(homeScreen);
  showToast('Left the lobby');
}

// Utility function to generate room code
function makeCode(len = 5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

// Derangement algorithm for Secret Santa assignment
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

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize the app
init();
