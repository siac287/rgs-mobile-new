/* RGS Staff Portal - phone app. Talks to the RGS School Management System on the school computer (/m/api). */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var store = {
  get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var P = {
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  map: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  ring: '<circle cx="9" cy="14" r="5"/><circle cx="16" cy="14" r="5"/><path d="M12 4l1 2 2-1"/>',
  mosque: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  badge: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 18c1-3 9-3 10 0"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.2"/><path d="M14 10h4M14 14h4M6 17c.5-2 5.5-2 6 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  face: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="9" cy="10.5" r=".7"/><circle cx="15" cy="10.5" r=".7"/><path d="M12 10.5v3M9 15.5c1.2 1 4.8 1 6 0"/>',
  facecheck: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path class="y" d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  calcheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path class="y" d="M8.5 15.5l2.5 2.5 4.5-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/><path class="y" d="M17 4l1 1 2-2"/>'
};
var ic = function (n) { return '<svg viewBox="0 0 24 24">' + (P[n] || '') + '</svg>'; };
var S = { me: null, view: '', tab: 'Personal', month: '', photo: '', stream: null, busy: false };
var view = $('#view');

function toast(m) { var t = $('#toast'); t.textContent = m; t.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 2600); }
function title(a, b) { $('#t1').textContent = a; $('#t2').textContent = b || ''; $('#title').className = b ? 'two' : ''; }
function dmy(s) { return /^\d{4}-\d{2}-\d{2}/.test(s || '') ? s.slice(8, 10) + '-' + s.slice(5, 7) + '-' + s.slice(0, 4) : (s || ''); }
function stamp() {
  var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }, h = d.getHours() % 12 || 12;
  $('#sync').textContent = 'Last Sync: ' + p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(h) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + (d.getHours() < 12 ? ' am' : ' pm');
}

/* ---------------------------------------------------------------- server calls */
function api(path, o) {
  o = o || {};
  var base = store.get('base');
  if (!base) return Promise.reject(new Error('Please enter the school server address first.'));
  var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, o.timeout || 20000);
  var h = { 'Content-Type': 'application/json' };
  if (store.get('token') && !o.anon) h.Authorization = 'Bearer ' + store.get('token');
  return fetch(base + '/m/api' + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined, signal: ctl.signal })
    .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { r: r, j: j }; }); })
    .then(function (x) {
      clearTimeout(tm);
      if (!x.j) throw new Error('The school computer gave an unexpected answer. Check the server address.');
      stamp();
      if (!x.j.ok) { var e = new Error(x.j.error || 'Something went wrong.'); e.status = x.r.status; e.data = x.j; if (x.r.status === 401 && !o.anon) { dropLogin(); } throw e; }
      return x.j;
    }, function (e) {
      clearTimeout(tm);
      if (e && e.name === 'AbortError') throw new Error('The school computer did not answer in time. Connect to the school Wi-Fi and try again.');
      if (e instanceof TypeError) throw new Error('Cannot reach the school computer. Connect to the school Wi-Fi and check the server address.');
      throw e;
    });
}
function dropLogin() { store.del('token'); S.me = null; if (S.photo) { URL.revokeObjectURL(S.photo); S.photo = ''; } stopCam(); $('#drawer').innerHTML = ''; go('login'); }
function loadMe() {
  return api('/me').then(function (j) {
    S.me = j;
    if (j.has_photo) {
      fetch(store.get('base') + '/m/api/photo', { headers: { Authorization: 'Bearer ' + store.get('token') } })
        .then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { if (b) { S.photo = URL.createObjectURL(b); var a = document.querySelector('.avatar'); if (a) { a.style.backgroundImage = 'url(' + S.photo + ')'; a.textContent = ''; } } }).catch(function () {});
    }
    return j;
  });
}

/* ---------------------------------------------------------------- camera */
function stopCam() { if (S.stream) { S.stream.getTracks().forEach(function (t) { t.stop(); }); S.stream = null; } }
function startCam(v) {
  stopCam();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('This phone cannot open the camera here.'));
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (s) {
    S.stream = s; v.srcObject = s; return v.play();
  }).catch(function (e) {
    throw new Error(e && e.name === 'NotAllowedError' ? 'Camera permission is needed. Allow the camera for this app in the phone settings.' : 'The camera could not be opened.');
  });
}
function snap(v) {
  var w = 640, h = Math.round((v.videoHeight || 480) * w / (v.videoWidth || 640)), c = document.createElement('canvas');
  c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.85);
}
var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

/* ---------------------------------------------------------------- navigation */
function go(v, arg) {
  stopCam(); S.view = v; closeDrawer();
  var f = { setup: vSetup, login: vLogin, home: vHome, profile: vProfile, mark: vMark, reg: vReg, att: vAtt }[v] || vHome;
  window.scrollTo(0, 0); f(arg);
}
function openDrawer() { $('#scrim').className = 'on'; $('#drawer').className = 'on'; }
function closeDrawer() { $('#scrim').className = ''; $('#drawer').className = ''; }
function buildDrawer() {
  var m = S.me;
  $('#drawer').innerHTML = '<div class="dh">' + esc(m.name) + '<small>' + esc(m.designation) + '</small></div>' +
    '<a data-go="home">Home</a><a data-go="profile">My Profile</a><a data-go="mark">Mark Attendance</a><a data-go="att">My Attendance</a><a data-go="reg">Register Face</a><a data-go="setup">Server Address</a><a class="out" id="logout">Log out</a>';
}
window.rgsBack = function () {
  if ($('#drawer').className === 'on') { closeDrawer(); return true; }
  if (S.me && S.view !== 'home') { go('home'); return true; }
  if (!S.me && S.view === 'setup' && store.get('base')) { go('login'); return true; }
  return false;
};

/* ---------------------------------------------------------------- screens */
function head(strip) {
  var m = S.me, av = S.photo ? 'style="background-image:url(' + S.photo + ')"' : '';
  return '<div class="card"><div class="avatar" ' + av + '>' + (S.photo ? '' : esc((m.name || '?').replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, '').charAt(0))) + '</div>' +
    '<div class="trio"><div>Contact<b class="v">' + esc(m.mobile || '-') + '</b></div><div class="w">WELCOME!<b>' + esc(m.name) + '</b></div><div>CNIC<b class="v">' + esc(m.cnic || '-') + '</b></div></div>' +
    (strip ? '<div class="strip"><div>School<b>' + esc(m.school) + '</b></div><div>Designation<b>' + esc(m.designation || '-') + '</b></div><div>Role<b>' + esc(m.category || '-') + '</b></div></div>' : '') + '</div>';
}

function vSetup() {
  title('RGS Staff Portal', 'School Server');
  view.innerHTML = '<div class="lead"><img src="logo.png" alt=""><h3>Connect to the school</h3><p>Connect your phone to the school Wi-Fi, then enter the address of the school computer (ask the school office).</p></div>' +
    '<div class="form"><label>School computer address</label><input id="srv" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="192.168.1.20:8080" value="' + esc(store.get('base').replace(/^http:\/\//, '')) + '">' +
    '<button class="btn" id="conn">Connect</button><div id="res"></div></div>';
  $('#conn').onclick = function () {
    var v = $('#srv').value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (!/^[A-Za-z0-9.\-]+(:\d{2,5})?$/.test(v)) { $('#res').innerHTML = '<div class="msg bad">Enter the address like 192.168.1.20:8080</div>'; return; }
    var old = store.get('base'); store.set('base', 'http://' + v);
    $('#conn').disabled = true; $('#res').innerHTML = '<div class="msg info">Connecting...</div>';
    api('/ping', { anon: true, timeout: 8000 }).then(function (j) {
      toast('Connected to ' + j.school); go(S.me ? 'home' : 'login');
    }, function (e) { store.set('base', old); $('#conn').disabled = false; $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; });
  };
}

function vLogin() {
  title('RGS Staff Portal', 'Login');
  view.innerHTML = '<div class="lead"><img src="logo.png" alt=""><h3>Staff login</h3><p>Use the user name and password that the school office gave you.</p></div>' +
    '<div class="form"><label>User name</label><input id="un" autocapitalize="off" autocomplete="username"><label>Password</label><input id="pw" type="password" autocomplete="current-password">' +
    '<button class="btn" id="li">Login</button><div id="res"></div><button class="btn l" id="chg">Change school address</button></div>';
  $('#chg').onclick = function () { go('setup'); };
  var submit = function () {
    var u = $('#un').value.trim(), p = $('#pw').value; if (!u || !p) { $('#res').innerHTML = '<div class="msg bad">Enter your user name and password.</div>'; return; }
    $('#li').disabled = true; $('#res').innerHTML = '<div class="msg info">Please wait...</div>';
    api('/login', { method: 'POST', anon: true, body: { username: u, password: p, device: (navigator.userAgent.match(/\(([^)]+)\)/) || [])[1] || 'phone' } })
      .then(function (j) { store.set('token', j.token); return loadMe(); })
      .then(function () { buildDrawer(); go('home'); })
      .catch(function (e) { $('#li').disabled = false; $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; });
  };
  $('#li').onclick = submit; $('#pw').onkeydown = function (e) { if (e.key === 'Enter') submit(); };
}

function vHome() {
  title('RGS Staff Portal', '');
  view.innerHTML = head(false) + '<div class="tiles">' +
    '<a class="tile" data-go="profile">' + ic('user') + 'My Profile</a><a class="tile" data-go="mark">' + ic('facecheck') + 'Mark Attendance</a><a class="tile" data-go="att">' + ic('calcheck') + 'My Attendance</a>' +
    '<a class="tile" data-go="reg">' + ic('face') + (S.me.face.enrolled ? 'Update Face' : 'Register Face') + '</a></div>' +
    (S.me.face.enrolled ? '' : '<div class="msg info">Register your face once to mark attendance with the camera.</div>');
}

function info(k, v, icon, wide) { return '<div class="info' + (wide ? ' wide' : '') + (v ? '' : ' dim') + '">' + ic(icon) + '<span class="k">' + esc(k) + '</span><span class="val">' + esc(v || 'N/A') + '</span></div>'; }
function vProfile(tab) {
  if (typeof tab === 'string') S.tab = tab;
  var m = S.me, tabs = ['Personal', 'Official', 'Education', 'Attendance'];
  title('RGS Staff', 'My Profile');
  view.innerHTML = head(true) + '<div class="tabs"><button class="ar" id="tl">&#8249;</button><div class="row" id="trow">' + tabs.map(function (t) { return '<button class="tab' + (t === S.tab ? ' on' : '') + '" data-tab="' + t + '">' + t + '</button>'; }).join('') +
    '</div><button class="ar" id="tr">&#8250;</button></div><div id="tb"></div>';
  $('#tl').onclick = function () { $('#trow').scrollBy({ left: -140, behavior: 'smooth' }); }; $('#tr').onclick = function () { $('#trow').scrollBy({ left: 140, behavior: 'smooth' }); };
  var tb = $('#tb');
  if (S.tab === 'Personal') tb.innerHTML = '<div class="pill"><span>Personal Profile</span></div><div class="grid3">' + m.personal.map(function (x) { return info(x[0], x[1], x[2], /Address/.test(x[0])); }).join('') + '</div>';
  else if (S.tab === 'Official') tb.innerHTML = '<div class="pill"><span>Official Profile</span></div><div class="grid3">' + m.official.map(function (x) { return info(x[0], x[1], x[2], x[0] === 'Email'); }).join('') + '</div>';
  else if (S.tab === 'Education') tb.innerHTML = '<div class="pill"><span>Educational Profile</span></div>' + (m.education.length ? m.education.map(function (e) {
    return '<div class="res"><b>' + esc(e.level) + '</b>' + (e.title ? ' - ' + esc(e.title) : '') + '<br>' + (e.grp ? 'Group: ' + esc(e.grp) + '<br>' : '') + (e.board ? 'Board / University: ' + esc(e.board) + '<br>' : '') + (e.year ? 'Passing year: ' + esc(e.year) : '') + (e.marks ? ' &middot; Marks: ' + esc(e.marks) : '') + '</div>'; }).join('') : '<div class="empty">No data found!!!</div>');
  else { tb.innerHTML = '<div class="pill"><span>Attendance</span></div><div id="attbox"><div class="spin"></div></div>'; loadAtt($('#attbox')); }
}

function loadAtt(box) {
  if (!S.month) S.month = '';
  api('/attendance' + (S.month ? '?month=' + S.month : '')).then(function (j) {
    S.month = j.month;
    var nm = new Date(j.month + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), t = j.today_rec;
    box.innerHTML = '<div class="mon"><button id="pm">&#8249;</button><span>' + esc(nm) + '</span><button id="nm">&#8250;</button></div>' +
      (j.month === j.today.slice(0, 7) ? '<div class="res"><div class="row2"><b>Today</b><span class="chip ' + (t ? t.status : '') + '">' + (t ? esc(t.status) : 'Not marked yet') + '</span></div>' + (t && t.time_in ? 'Time in: <b>' + esc(t.time_in) + '</b>' : '') + (t && t.time_out ? ' &nbsp; Time out: <b>' + esc(t.time_out) + '</b>' : '') + '</div>' : '') +
      '<div class="sum"><div><b>' + j.counts.Present + '</b>Present</div><div><b>' + j.counts.Absent + '</b>Absent</div><div><b>' + j.counts.Leave + '</b>Leave</div></div>' +
      (j.rows.length ? j.rows.map(function (r) {
        var wd = new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
        return '<div class="res"><div class="row2"><b>' + esc(dmy(r.date)) + ' <span style="font-weight:400;color:#7a6a66">' + wd + '</span></b><span class="chip ' + esc(r.status) + '">' + esc(r.status) + '</span></div>' + (r.time_in ? 'In: ' + esc(r.time_in) : '') + (r.time_out ? ' &nbsp; Out: ' + esc(r.time_out) : '') + '</div>'; }).join('') : '<div class="empty">No data found!!!</div>');
    var shift = function (d) { var p = j.month.split('-'), x = new Date(+p[0], +p[1] - 1 + d, 1); S.month = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2); box.innerHTML = '<div class="spin"></div>'; loadAtt(box); };
    $('#pm').onclick = function () { shift(-1); }; $('#nm').onclick = function () { shift(1); };
  }, function (e) { box.innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; });
}
function vAtt() { title('RGS Staff', 'My Attendance'); S.tab = 'Attendance'; S.month = ''; vProfile('Attendance'); title('RGS Staff', 'My Attendance'); }

/* ---- face: mark attendance */
function camBox() { return '<div class="cam" id="cam"><video id="v" playsinline muted autoplay></video><div class="ph" id="ph">Starting camera...</div></div>'; }
function vMark() {
  title('RGS Staff', 'Mark Attendance');
  view.innerHTML = '<div class="panel">' + camBox() + '<div class="prompt" id="pr">Look straight at the camera</div><button class="btn" id="go" disabled>Mark Attendance</button><div id="res"></div></div>';
  if (!S.me.face.enrolled) { $('#cam').style.display = 'none'; $('#pr').textContent = ''; $('#go').style.display = 'none'; $('#res').innerHTML = '<div class="msg info">Please register your face first.</div><button class="btn" id="rg">Register Face</button>'; $('#rg').onclick = function () { go('reg'); }; return; }
  var v = $('#v');
  startCam(v).then(function () { $('#ph').style.display = 'none'; $('#go').disabled = false; }, function (e) { $('#ph').textContent = ''; $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; });
  $('#go').onclick = function () {
    var btn = $('#go'), cam = $('#cam'), pr = $('#pr'), frames = [], steps = ['Look at the camera', 'Blink now', 'Look at the camera', 'Blink again'], i = 0;
    btn.disabled = true; cam.className = 'cam'; $('#res').innerHTML = '';
    (function next() {
      if (i < steps.length) { pr.textContent = steps[i]; return wait(i ? 500 : 700).then(function () { frames.push(snap(v)); i++; next(); }); }
      pr.textContent = 'Checking your face...';
      api('/face/mark', { method: 'POST', body: { frames: frames }, timeout: 60000 }).then(function (j) {
        cam.className = 'cam ok'; btn.style.display = 'none'; pr.textContent = j.name; $('#res').innerHTML = '<div class="msg ok">' + esc(j.message) + '</div><button class="btn g" id="hm">Done</button>';
        $('#hm').onclick = function () { go('home'); }; stopCam();
      }, function (e) {
        cam.className = 'cam bad'; pr.textContent = 'Look straight at the camera';
        $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>' + (e.data && e.data.need_enroll ? '<button class="btn" id="rg">Register Face</button>' : '');
        if ($('#rg')) $('#rg').onclick = function () { go('reg'); };
        btn.disabled = false;
      });
    })();
  };
}

/* ---- face: registration */
function vReg() {
  title('RGS Staff', 'Register Face');
  view.innerHTML = '<div class="panel">' + camBox() + '<div class="prompt" id="pr">Your face is registered once and then used to mark your attendance. Stand in good light, alone, without a cap or sunglasses.</div><div class="dots" id="dots"></div><button class="btn" id="go" disabled>' + (S.me.face.enrolled ? 'Register Again' : 'Start Registration') + '</button><div id="res"></div></div>';
  var v = $('#v');
  startCam(v).then(function () { $('#ph').style.display = 'none'; $('#go').disabled = false; }, function (e) { $('#ph').textContent = ''; $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; });
  var steps = ['Look straight at the camera', 'Look straight and smile', 'Turn your head a little to the left', 'Turn your head a little to the right', 'Look straight again', 'Look straight, eyes wide open'];
  $('#dots').innerHTML = steps.map(function () { return '<i></i>'; }).join('');
  $('#go').onclick = function () {
    var btn = $('#go'), cam = $('#cam'), pr = $('#pr'), frames = [], i = 0, dots = document.querySelectorAll('#dots i');
    btn.disabled = true; cam.className = 'cam'; $('#res').innerHTML = '';
    (function next() {
      if (i >= steps.length) {
        pr.textContent = 'Saving your face...';
        return api('/face/enroll', { method: 'POST', body: { frames: frames }, timeout: 90000 }).then(function (j) {
          cam.className = 'cam ok'; btn.style.display = 'none'; S.me.face.enrolled = true; pr.textContent = ''; stopCam();
          $('#res').innerHTML = '<div class="msg ok">' + esc(j.message) + '</div><button class="btn g" id="mk">Mark Attendance</button><button class="btn l" id="hm">Home</button>';
          $('#mk').onclick = function () { go('mark'); }; $('#hm').onclick = function () { go('home'); };
        }, function (e) { cam.className = 'cam bad'; pr.textContent = 'Try again'; dots.forEach(function (d) { d.className = ''; }); $('#res').innerHTML = '<div class="msg bad">' + esc(e.message) + '</div>'; btn.disabled = false; });
      }
      var n = 3; pr.textContent = steps[i];
      (function tick() {
        if (n > 0) { btn.textContent = n + '...'; n--; return wait(900).then(tick); }
        frames.push(snap(v)); dots[i].className = 'on'; i++; btn.textContent = 'Please wait...'; wait(250).then(next);
      })();
    })();
  };
}

/* ---------------------------------------------------------------- events + start */
document.addEventListener('click', function (e) {
  var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
  var t = e.target.closest('[data-tab]'); if (t) { S.tab = t.getAttribute('data-tab'); vProfile(S.tab); return; }
  if (e.target.id === 'logout' || e.target.closest('#logout')) {
    api('/logout', { method: 'POST' }).catch(function () {}).then(function () { dropLogin(); });
  }
});
$('#menuBtn').onclick = function () { if (S.me) openDrawer(); else toast('Please log in first.'); };
$('#scrim').onclick = closeDrawer;

(function start() {
  if (!store.get('base')) return go('setup');
  if (!store.get('token')) return go('login');
  title('RGS Staff Portal', ''); view.innerHTML = '<div class="spin"></div>';
  loadMe().then(function () { buildDrawer(); go('home'); }, function (e) {
    if (e.status === 401) return; // dropLogin already shows the login screen
    view.innerHTML = '<div class="form"><div class="msg bad">' + esc(e.message) + '</div><button class="btn" id="rt">Try again</button><button class="btn l" id="chg">Change school address</button></div>';
    $('#rt').onclick = start; $('#chg').onclick = function () { go('setup'); };
  });
})();
})();
