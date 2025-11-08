/*******************************
 * Secret Santa - app.js (CDN compat)
 *******************************/

/* ========== Firebase config ==========
   Replace with your Firebase config if different.
   (This is the config you already provided.)
=======================================*/
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

// init firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ========= DOM ========= */
const $ = id => document.getElementById(id);
const home = $('home');
const lobby = $('lobby');
const result = $('result');

const btnCreate = $('btnCreate');
const btnJoin = $('btnJoin');
const btnBackHome = $('btnBackHome');

const roomCodeEl = $('roomCode');
const memberListEl = $('memberList');

const joinName = $('joinName');
const wish1 = $('wish1');
const wish2 = $('wish2');
const wish3 = $('wish3');
const btnSubmitJoin = $('btnSubmitJoin');

const ownerControls = $('ownerControls');
const memberControls = $('memberControls');
const mustJoinForm = $('mustJoinForm');

const btnStart = $('btnStart');
const btnCloseRoom = $('btnCloseRoom');
const btnLeave = $('btnLeave');

const assignedNameEl = $('assignedName');
const assignedWishes = $('assignedWishes');
const assignedNote = $('assignedNote');
const btnDone = $('btnDone');
const btnLeaveResult = $('btnLeaveResult');

/* ========= App state ========= */
let state = {
  role: null,      // 'owner' or 'member'
  room: null,
  uid: null,
  name: null
};

/* ========= Helpers ========= */
function showScreen(screenEl){
  [home, lobby, result].forEach(s => s.classList.add('hidden'));
  screenEl.classList.remove('hidden');
}

function makeCode(len=5){
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function randomUid(){ return 'u'+Math.random().toString(36).slice(2,10); }

/* ========== Persistence (localStorage) ========== */
function saveLocal(){
  if(!state.room || !state.uid) return;
  localStorage.setItem('santa_room', state.room);
  localStorage.setItem('santa_uid', state.uid);
  localStorage.setItem('santa_role', state.role || '');
  if(state.name) localStorage.setItem('santa_name', state.name);
}
function clearLocal(){
  localStorage.removeItem('santa_room');
  localStorage.removeItem('santa_uid');
  localStorage.removeItem('santa_role');
  localStorage.removeItem('santa_name');
}
function loadLocal(){
  const room = localStorage.getItem('santa_room');
  const uid = localStorage.getItem('santa_uid');
  const role = localStorage.getItem('santa_role');
  const name = localStorage.getItem('santa_name');
  if(room && uid){
    state.room = room;
    state.uid = uid;
    state.role = role || null;
    state.name = name || null;
    return true;
  }
  return false;
}

/* ========== Room listeners ========= */
let membersRef = null;
let roomRef = null;

function listenRoom(room){
  // cleanup previous
  if(membersRef) membersRef.off();
  if(roomRef) roomRef.off();

  roomRef = db.ref('rooms/' + room);
  membersRef = db.ref(`rooms/${room}/members`);

  // member list
  membersRef.on('value', snap => {
    const val = snap.val() || {};
    const arr = Object.entries(val).map(([uid,info]) => ({ uid, ...info }));
    renderMembers(arr);
  });

  // assignments: detect drawStarted and assignment for this uid
  roomRef.child('drawStarted').on('value', snap => {
    const started = snap.exists() && snap.val() === true;
    if(started){
      // try to load assignment stored under assignments/<uid>
      db.ref(`rooms/${room}/assignments/${state.uid}`).get().then(asg=>{
        if(asg.exists()){
          showResult(asg.val());
        } else {
          // fallback to assignedToUid on member node
          db.ref(`rooms/${room}/members/${state.uid}/assignedToUid`).get().then(a=>{
            if(a.exists()){
              const toUid = a.val();
              db.ref(`rooms/${room}/members/${toUid}`).get().then(ts=>{
                if(ts.exists()) showResult({ name: ts.val().name, wishes: ts.val().wishes || [] });
              });
            }
          });
        }
      });
    }
    // owner button state controlled in renderMembers
  });
}

/* ========== Rendering ========== */
function renderMembers(list){
  memberListEl.innerHTML = '';
  list.forEach(m=>{
    const li = document.createElement('li');
    li.textContent = m.name + (m.wishes ? ` — ${m.wishes.length} wishes` : '');
    memberListEl.appendChild(li);
  });

  // show owner controls if owner
  if(state.role === 'owner'){
    mustJoinForm.classList.add('hidden');      // owner already has joined
    ownerControls.classList.remove('hidden');
    memberControls.classList.add('hidden');
    // enable start when >=3
    btnStart.disabled = !(list.length >= 3);
  } else {
    // member view
    ownerControls.classList.add('hidden');
    memberControls.classList.remove('hidden');
    // hide join form if already joined
    const joined = list.some(m => m.name === state.name && state.uid);
    if(joined) mustJoinForm.classList.add('hidden');
    else mustJoinForm.classList.remove('hidden');
  }
  // keep room code updated
  roomCodeEl.textContent = state.room || '—';
}

/* ========== Flows ========== */

/* create room -> then owner should fill in their name/wishes and join */
btnCreate.addEventListener('click', async ()=>{
  const code = makeCode(5);
  const roomRefLocal = db.ref('rooms/' + code);
  const s = await roomRefLocal.get();
  if(s.exists()) return btnCreate.click();
  await roomRefLocal.set({ owner: "owner", createdAt: Date.now(), drawStarted: false });
  state.role = 'owner';
  state.room = code;
  state.uid = randomUid();
  // Save then open lobby and let owner fill details
  saveLocal();
  listenRoom(state.room);
  showScreen(lobby);
  roomCodeEl.textContent = state.room;
  // owner needs to still 'join' as a member (but we will hide the join form automatically if owner)
  mustJoinForm.classList.remove('hidden');
});

/* join button from home simply shows lobby with join form */
btnJoin.addEventListener('click', ()=>{
  // show blank join for user to input code first (we'll ask in-place)
  // Prompt for room code quickly with a browser prompt for simplicity
  const code = prompt('Enter room code (from the host):') || '';
  if(!code) return;
  state.room = code.trim().toUpperCase();
  state.uid = randomUid();
  state.role = 'member';
  saveLocal();
  listenRoom(state.room);
  showScreen(lobby);
  roomCodeEl.textContent = state.room;
  mustJoinForm.classList.remove('hidden');
});

/* Back home from lobby: clear local only if not joined */
btnBackHome.addEventListener('click', ()=>{
  // if joined, keep localStorage; simply show home to allow navigation
  showScreen(home);
});

/* Submit join (both owner and member use same form) */
btnSubmitJoin.addEventListener('click', async ()=>{
  const name = joinName.value.trim();
  const w1 = wish1.value.trim();
  const w2 = wish2.value.trim();
  const w3 = wish3.value.trim();
  if(!state.room) return alert('No room selected.');
  if(!name || !w1 || !w2 || !w3) return alert('Please enter name and three wishes.');

  state.name = name;
  saveLocal();

  // write member node
  if(!state.uid) state.uid = randomUid();
  await db.ref(`rooms/${state.room}/members/${state.uid}`).set({
    name,
    wishes: [w1,w2,w3],
    joinedAt: Date.now()
  });

  // if owner, set owner field
  if(state.role === 'owner') {
    await db.ref(`rooms/${state.room}/owner`).set(name);
  }

  // update UI
  mustJoinForm.classList.add('hidden');
  memberControls.classList.remove('hidden');
  ownerControls.classList.remove('hidden');
});

/* Start draw (owner only) */
btnStart.addEventListener('click', async ()=>{
  if(state.role !== 'owner') return alert('Only owner can start.');
  const room = state.room;
  const membersSnap = await db.ref(`rooms/${room}/members`).get();
  const members = membersSnap.val();
  if(!members) return alert('No members.');
  const entries = Object.entries(members).map(([uid,info])=>({ uid, name: info.name, wishes: info.wishes || [] }));
  if(entries.length < 3) return alert('Need at least 3 members.');

  const uids = entries.map(e=>e.uid);
  const assigned = derangement(uids);
  if(!assigned) return alert('Assignment failed, try again.');

  const updates = {};
  for(let i=0;i<uids.length;i++){
    const from = uids[i];
    const to = assigned[i];
    const target = entries.find(x=>x.uid===to);
    updates[`rooms/${room}/members/${from}/assignedToUid`] = to;
    updates[`rooms/${room}/assignments/${from}`] = {
      toUid: to,
      name: target.name,
      wishes: target.wishes || []
    };
  }
  updates[`rooms/${room}/drawStarted`] = true;
  await db.ref().update(updates);
  alert('Draw finished — each person can now see their assigned person.');
});

/* Close room (owner) */
btnCloseRoom.addEventListener('click', async ()=>{
  if(state.role !== 'owner') return;
  if(!state.room) return;
  if(!confirm('Close this room and remove data? This cannot be undone.')) return;
  await db.ref(`rooms/${state.room}`).remove();
  clearLocal();
  state = { role:null, room:null, uid:null, name:null };
  showScreen(home);
});

/* Member leave */
btnLeave.addEventListener('click', async ()=>{
  if(!state.room || !state.uid) return showScreen(home);
  await db.ref(`rooms/${state.room}/members/${state.uid}`).remove();
  clearLocal();
  state = { role:null, room:null, uid:null, name:null };
  showScreen(home);
});

/* Result screen leave/done */
btnDone.addEventListener('click', ()=>{
  showScreen(home);
});
btnLeaveResult.addEventListener('click', async ()=>{
  // same as leave
  if(state.room && state.uid) await db.ref(`rooms/${state.room}/members/${state.uid}`).remove();
  clearLocal();
  state = { role:null, room:null, uid:null, name:null };
  showScreen(home);
});

/* ========== Auto rejoin on load ========== */
window.addEventListener('load', async ()=>{
  // wire up ownerControls element (exists but hidden initial)
  ownerControls.classList.add('hidden');
  memberControls.classList.add('hidden');

  // try load local
  const ok = loadLocal();
  if(ok && state.room && state.uid){
    // check room exists
    const r = await db.ref(`rooms/${state.room}`).get();
    if(r.exists()){
      // ensure listener installed and show lobby
      listenRoom(state.room);
      showScreen(lobby);
      roomCodeEl.textContent = state.room;
      // if user is member and assignments already exist, show result immediately
      const draw = await db.ref(`rooms/${state.room}/drawStarted`).get();
      if(draw.exists() && draw.val() === true){
        // read assignment
        const a = await db.ref(`rooms/${state.room}/assignments/${state.uid}`).get();
        if(a.exists()){
          showResult(a.val());
          return;
        }
        const a2 = await db.ref(`rooms/${state.room}/members/${state.uid}/assignedToUid`).get();
        if(a2.exists()){
          const toUid = a2.val();
          const ts = await db.ref(`rooms/${state.room}/members/${toUid}`).get();
          if(ts.exists()) showResult({ name: ts.val().name, wishes: ts.val().wishes || [] });
          return;
        }
      }
      // else stay in lobby
      return;
    } else {
      // room not found -> clear and go home
      clearLocal();
      state = { role:null, room:null, uid:null, name:null };
    }
  }
  showScreen(home);
});

/* ========== Derangement (no self assignment) ========== */
function derangement(uids){
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
  }
  const max=500;
  for(let t=0;t<max;t++){
    const copy = uids.slice();
    shuffle(copy);
    if(uids.every((u,i)=>u!==copy[i])) return copy;
  }
  return null;
}

/* ========== Show result UI ========== */
function showResult(obj){
  showScreen(result);
  assignedNameEl.textContent = obj.name || '—';
  assignedWishes.innerHTML = '';
  if(Array.isArray(obj.wishes)){
    obj.wishes.forEach(w=>{
      const li = document.createElement('li');
      li.textContent = w;
      assignedWishes.appendChild(li);
    });
  }
  assignedNote.textContent = "Saved to your device — come back anytime to view.";
}
