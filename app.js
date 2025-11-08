/*******************************
 * Secret Santa - Firebase version (CDN)
 *******************************/

// ✅ Your Firebase configuration
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

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- Helper DOM --------- */
const $ = id => document.getElementById(id);
const home = $('home');
const createScreen = $('createScreen');
const joinScreen = $('joinScreen');
const memberScreen = $('memberScreen');
const resultScreen = $('resultScreen');

const btnCreate = $('btnCreate');
const btnJoin = $('btnJoin');
const btnStart = $('btnStart');
const btnLeave = $('btnLeave');
const roomCodeEl = $('roomCode');
const memberList = $('memberList');
const memberList2 = $('memberList2');

const joinCode = $('joinCode');
const joinName = $('joinName');
const wish1 = $('wish1');
const wish2 = $('wish2');
const wish3 = $('wish3');
const btnSubmitJoin = $('btnSubmitJoin');
const btnBackHome = $('btnBackHome');

const memberRoom = $('memberRoom');
const btnLeave2 = $('btnLeave2');

const assignedNameEl = $('assignedName');
const assignedWishes = $('assignedWishes');
const assignedNote = $('assignedNote');
const btnDone = $('btnDone');

let local = {
  role: null,
  room: null,
  name: null,
  myUid: null
};

function show(...els){
  [home, createScreen, joinScreen, memberScreen, resultScreen].forEach(e => e.classList.add('hidden'));
  els.forEach(e => e.classList.remove('hidden'));
}

/* ---------- Room code helper ---------- */
function makeCode(len=5){
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

/* ---------- Create a room ---------- */
btnCreate.addEventListener('click', async () => {
  const code = makeCode(5);
  const roomRef = db.ref('rooms/' + code);
  const snapshot = await roomRef.get();
  if (snapshot.exists()) return btnCreate.click();

  await roomRef.set({
    owner: "owner",
    createdAt: Date.now(),
    drawStarted: false
  });

  local.role = 'owner';
  local.room = code;
  joinAs(local.room, true);
});

/* ---------- Join flow ---------- */
btnJoin.addEventListener('click', () => {
  show(joinScreen);
});

btnBackHome.addEventListener('click', () => {
  show(home);
});

function randomUid(){
  return 'u' + Math.random().toString(36).slice(2,10);
}

btnSubmitJoin.addEventListener('click', async () => {
  const code = joinCode.value.trim().toUpperCase();
  const name = joinName.value.trim();
  const w1 = wish1.value.trim();
  const w2 = wish2.value.trim();
  const w3 = wish3.value.trim();

  if (!code || !name || !w1 || !w2 || !w3)
    return alert('Please fill room code, name and three wishes.');

  const roomRef = db.ref('rooms/' + code);
  const snap = await roomRef.get();
  if (!snap.exists()) return alert('Room not found. Check the code.');

  local.role = 'member';
  local.room = code;
  local.name = name;
  joinAs(code, false, { name, wishes: [w1,w2,w3] });
});

function joinAs(room, asOwner=false, payload=null){
  const uid = randomUid();
  local.myUid = uid;
  const memberRef = db.ref(`rooms/${room}/members/${uid}`);

  if (!payload) {
    let name = prompt("Your display name?");
    if (!name) name = "Guest";
    let wishes = [];
    for (let i=1;i<=3;i++){
      let w = prompt(`Enter wish #${i}`);
      if (!w) w = `Wish ${i}`;
      wishes.push(w);
    }
    payload = { name, wishes };
  }

  memberRef.set({
    name: payload.name,
    wishes: payload.wishes,
    joinedAt: Date.now()
  });

  if (asOwner)
    db.ref(`rooms/${room}/owner`).set(payload.name || "Owner");

  listenRoom(room);

  if (asOwner) {
    show(createScreen);
    roomCodeEl.textContent = room;
  } else {
    show(memberScreen);
    memberRoom.textContent = room;
  }
}

/* ---------- Listen for updates ---------- */
let membersRef = null;
let roomRef = null;

function listenRoom(room) {
  if (roomRef) roomRef.off();
  if (membersRef) membersRef.off();

  roomRef = db.ref('rooms/' + room);
  membersRef = db.ref(`rooms/${room}/members`);

  membersRef.on('value', snap => {
    const val = snap.val() || {};
    const membersArr = Object.entries(val).map(([uid,info]) => ({ uid, ...info }));
    renderMemberList(membersArr);
  });

  roomRef.child('drawStarted').on('value', snap => {
    const started = snap.exists() && snap.val() === true;
    if (local.role === 'owner') {
      btnStart.disabled = started;
      btnStart.textContent = started ? 'Draw done' : 'Start Draw';
    }
  });
}

function renderMemberList(arr){
  memberList.innerHTML = '';
  memberList2.innerHTML = '';
  arr.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.name;
    memberList.appendChild(li);
    memberList2.appendChild(li.cloneNode(true));
  });
  if (local.role === 'owner') {
    show(createScreen);
    roomCodeEl.textContent = local.room;
    btnStart.disabled = !(arr.length >= 3);
  }
}

/* ---------- Draw logic ---------- */
btnStart.addEventListener('click', async () => {
  if (local.role !== 'owner') return alert('Only owner can start draw.');
  const room = local.room;
  const membersSnap = await db.ref(`rooms/${room}/members`).get();
  const members = membersSnap.val();
  if (!members) return alert('No members found.');
  const entries = Object.entries(members).map(([uid,info]) => ({ uid, name: info.name, wishes: info.wishes || [] }));
  if (entries.length < 3) return alert('Need at least 3 members.');

  const uids = entries.map(e => e.uid);
  const assigned = derangement(uids);
  if (!assigned) return alert('Try again.');

  const updates = {};
  for (let i=0;i<uids.length;i++){
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
  alert('Draw completed!');
});

function derangement(uids){
  function shuffle(a){
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
  }
  for (let t=0;t<200;t++){
    const copy = uids.slice();
    shuffle(copy);
    if (uids.every((u,i) => u !== copy[i])) return copy;
  }
  return null;
}
