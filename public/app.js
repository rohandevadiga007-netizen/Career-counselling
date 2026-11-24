const $ = id => document.getElementById(id);
let careers = [], questions = [], user = null, signup = false, saved = [];
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(url, options = {}) { const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options }); const data = await r.json(); if (!r.ok)
    throw Error(data.error || 'Request failed'); return data; }
const post = (url, data) => api(url, { method: 'POST', body: JSON.stringify(data) });
function renderCareers() { const q = $('search').value.toLowerCase(), cat = $('category').value; $('careerGrid').innerHTML = careers.filter(c => (c.name + ' ' + c.skills + ' ' + c.description).toLowerCase().includes(q) && (!cat || c.category === cat)).map(c => `<article class="career"><span class="tag">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.description)}</p><b>Skills:</b> ${escapeHTML(c.skills)}<div><button data-career="${c.id}">View roadmap →</button></div></article>`).join('') || '<p>No matching careers found.</p>'; }
function showCareer(id) { const c = careers.find(x => x.id === id); if (!c)
    return; $('careerDetail').innerHTML = `<span class="tag">${escapeHTML(c.category)}</span><h2>${escapeHTML(c.name)}</h2><p>${escapeHTML(c.description)}</p><p><b>Skills:</b> ${escapeHTML(c.skills)}</p><p><b>Education:</b> ${escapeHTML(c.education)}</p><h3>Learning roadmap</h3><ol>${c.roadmap.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ol><button id="saveCareer">${saved.includes(id) ? 'Remove saved career' : 'Save career'}</button>`; $('saveCareer').onclick = async () => { if (!user) {
    $('careerModal').close();
    openAuth();
    return;
} try {
    await post(saved.includes(id) ? '/api/unsave' : '/api/save', { careerId: id });
    await dashboard();
    showCareer(id);
}
catch (e) {
    alert(e.message);
} }; $('careerModal').showModal(); }
$('careerGrid').onclick = e => { const b = e.target.closest('[data-career]'); if (b)
    showCareer(Number(b.dataset.career)); };
$('search').oninput = renderCareers;
$('category').onchange = renderCareers;
$('closeCareer').onclick = () => $('careerModal').close();
$('startQuiz').onclick = () => { $('quizResults').innerHTML = ''; $('quizBox').innerHTML = `<form id="quizForm">${questions.map((q, i) => `<div class="question"><b>${i + 1}. ${escapeHTML(q.text)}</b><div>${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="q${i}" value="${n}" required> ${n}</label>`).join('')}</div></div>`).join('')}<button>See my results →</button></form>`; $('quizForm').onsubmit = async (e) => { e.preventDefault(); const data = new FormData(e.target), answers = questions.map((_, i) => Number(data.get('q' + i))); try {
    const result = await post('/api/quiz', { answers });
    $('quizResults').innerHTML = `<div class="panel"><h3>Your top interest categories</h3>${result.ranked.map(x => `<div class="result"><b>${escapeHTML(x.category)}</b> — ${x.score}/${x.max}<meter min="0" max="15" value="${x.score}"></meter></div>`).join('')}<h3>Careers to explore</h3>${result.recommended.map(c => `<p>${escapeHTML(c.name)} — ${escapeHTML(c.description)}</p>`).join('')}<small>These are exploratory suggestions, not a professional assessment.</small></div>`;
    await dashboard();
    $('quizResults').scrollIntoView({ behavior: 'smooth' });
}
catch (err) {
    alert(err.message);
} }; };
function openAuth() { signup = false; authMode(); $('modal').showModal(); }
function authMode() { $('authTitle').textContent = signup ? 'Create your account' : 'Welcome back'; $('signupName').hidden = !signup; $('signupName').required = signup; $('authSubmit').textContent = signup ? 'Sign up' : 'Login'; $('switchAuth').textContent = signup ? 'Already have an account? Login' : 'Create an account'; $('authError').textContent = ''; }
$('authButton').onclick = async () => { if (user) {
    await post('/api/logout', {});
    user = null;
    await refresh();
    return;
} openAuth(); };
$('switchAuth').onclick = () => { signup = !signup; authMode(); };
$('closeModal').onclick = () => $('modal').close();
$('authForm').onsubmit = async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); try {
    user = await post(signup ? '/api/signup' : '/api/login', d);
    $('modal').close();
    e.target.reset();
    await refresh();
}
catch (err) {
    $('authError').textContent = err.message;
} };
async function dashboard() { if (!user) {
    saved = [];
    $('dashBox').textContent = 'Log in to see your saved careers and assessment history.';
    return;
} try {
    const d = await api('/api/dashboard');
    saved = d.saved;
    $('dashBox').innerHTML = `<h3>Hello, ${escapeHTML(user.name)}!</h3><h4>Saved careers</h4>${saved.length ? saved.map(id => `<p>★ ${escapeHTML(careers.find(c => c.id === id)?.name || 'Career')}</p>`).join('') : '<p>No saved careers yet.</p>'}<h4>Recent quiz results</h4>${d.results.length ? d.results.map(r => `<p>${escapeHTML(r.category)} · ${escapeHTML(r.created_at)}</p>`).join('') : '<p>Take the quiz to see your results here.</p>'}`;
}
catch (err) {
    $('dashBox').textContent = err.message;
} }
async function refresh() { $('who').textContent = user ? 'Hi, ' + user.name : ''; $('authButton').textContent = user ? 'Logout' : 'Login / Sign up'; await dashboard(); }
$('contactForm').onsubmit = async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); try {
    await post('/api/contact', d);
    $('contactStatus').textContent = 'Your message was submitted successfully.';
    e.target.reset();
}
catch (err) {
    $('contactStatus').textContent = err.message;
} };
$('theme').onclick = () => { document.body.classList.toggle('dark'); $('theme').textContent = document.body.classList.contains('dark') ? '☀' : '☾'; };
(async () => { try {
    [careers, questions, user] = await Promise.all([api('/api/careers'), api('/api/questions'), api('/api/me')]);
    renderCareers();
    await refresh();
}
catch (e) {
    $('careerGrid').textContent = 'Unable to load data: ' + e.message;
} })();

