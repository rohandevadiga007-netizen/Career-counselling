const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();
const db = new Database(path.join(__dirname, 'careerpath.db'));
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);CREATE TABLE IF NOT EXISTS results(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,category TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE IF NOT EXISTS saved(user_id INTEGER NOT NULL,career_id INTEGER NOT NULL,PRIMARY KEY(user_id,career_id));CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,name TEXT,email TEXT,message TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'local-development-change-this-secret', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax' } }));
app.use(express.static(path.join(__dirname, 'public')));
const careers = [
    { id: 1, name: 'Software Developer', category: 'Technology', description: 'Build websites, apps and software.', skills: 'Programming, problem solving, Git', education: 'BTech, BCA or equivalent skills', roadmap: ['Learn Python or JavaScript', 'Study DSA', 'Build three projects', 'Learn Git and databases', 'Apply for internships'] },
    { id: 2, name: 'Data Scientist', category: 'Technology', description: 'Analyze data to find insights.', skills: 'Python, SQL, statistics', education: 'Degree and data skills', roadmap: ['Learn Python', 'Learn SQL', 'Study statistics', 'Build data projects', 'Create a portfolio'] },
    { id: 3, name: 'Cybersecurity Analyst', category: 'Technology', description: 'Protect systems and networks.', skills: 'Networking, Linux, security', education: 'Computing degree or relevant certifications', roadmap: ['Learn networking', 'Learn Linux', 'Study security basics', 'Practice in legal labs', 'Apply for internships'] },
    { id: 4, name: 'Graphic Designer', category: 'Creative', description: 'Create visual designs and branding.', skills: 'Typography, layout, design tools', education: 'Design degree or strong portfolio', roadmap: ['Learn design principles', 'Practice Figma', 'Create sample designs', 'Build a portfolio', 'Seek freelance projects'] },
    { id: 5, name: 'UX Designer', category: 'Creative', description: 'Design easy-to-use digital experiences.', skills: 'Research, wireframing, prototyping', education: 'Design training and portfolio', roadmap: ['Learn UX fundamentals', 'Interview users', 'Practice Figma', 'Create case studies', 'Apply for internships'] },
    { id: 6, name: 'Digital Marketer', category: 'Business', description: 'Promote products using digital channels.', skills: 'Content, SEO, analytics', education: 'Any relevant degree and practical skills', roadmap: ['Learn marketing basics', 'Study SEO', 'Create a campaign', 'Track analytics', 'Build case studies'] },
    { id: 7, name: 'Entrepreneur', category: 'Business', description: 'Start and operate a business.', skills: 'Planning, communication, finance', education: 'No single required degree', roadmap: ['Find a problem', 'Research customers', 'Build an MVP', 'Test pricing', 'Improve from feedback'] },
    { id: 8, name: 'Doctor', category: 'Science', description: 'Diagnose and treat patients.', skills: 'Biology, empathy, clinical reasoning', education: 'Required medical qualification and licensing', roadmap: ['Study science subjects', 'Prepare for medical entrance requirements', 'Complete medical education', 'Finish required clinical training', 'Obtain required registration'] },
    { id: 9, name: 'Research Scientist', category: 'Science', description: 'Investigate scientific questions.', skills: 'Research, statistics, experiments', education: 'Relevant degree; advanced roles may require postgraduate study', roadmap: ['Choose a science field', 'Build lab and research skills', 'Join projects', 'Study research methods', 'Pursue advanced specialization'] },
    { id: 10, name: 'Teacher', category: 'People', description: 'Help learners understand new concepts.', skills: 'Communication, patience, subject knowledge', education: 'Relevant degree and required teaching qualification', roadmap: ['Choose a subject', 'Build subject expertise', 'Practice teaching', 'Complete required qualifications', 'Apply to institutions'] },
    { id: 11, name: 'Career Counsellor', category: 'People', description: 'Guide people exploring education and work.', skills: 'Listening, research, communication', education: 'Relevant education and professional training', roadmap: ['Study career pathways', 'Learn counselling ethics', 'Practice guidance interviews', 'Get supervised experience', 'Build professional skills'] },
    { id: 12, name: 'Civil Engineer', category: 'Science', description: 'Design and manage infrastructure.', skills: 'Mathematics, CAD, project planning', education: 'Civil engineering degree', roadmap: ['Study engineering fundamentals', 'Learn CAD', 'Understand structures', 'Complete site projects', 'Apply for internships'] }
];
const questions = [['I enjoy solving programming problems.', 'Technology'], ['I like working with numbers and datasets.', 'Technology'], ['I am curious about how computers work.', 'Technology'], ['I enjoy drawing and visual design.', 'Creative'], ['I like designing apps that feel easy to use.', 'Creative'], ['I enjoy making original content.', 'Creative'], ['I like planning how to sell a product.', 'Business'], ['I enjoy leading a team.', 'Business'], ['I want to start my own company.', 'Business'], ['I enjoy biology or scientific experiments.', 'Science'], ['I like investigating how things work.', 'Science'], ['I enjoy solving math or physics problems.', 'Science'], ['I enjoy helping people learn.', 'People'], ['I listen carefully to others.', 'People'], ['I enjoy explaining complex topics.', 'People']];
function auth(req, res, next) { if (!req.session.userId)
    return res.status(401).json({ error: 'Please log in first' }); next(); }
app.get('/api/careers', (req, res) => res.json(careers));
app.get('/api/questions', (req, res) => res.json(questions.map((q, i) => ({ id: i, text: q[0] }))));
app.post('/api/signup', (req, res) => { const { name, email, password } = req.body; if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8)
    return res.status(400).json({ error: 'Enter a name, valid email and password of at least 8 characters' }); try {
    const r = db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run(name.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10));
    req.session.userId = r.lastInsertRowid;
    res.json({ name: name.trim(), email: email.trim().toLowerCase() });
}
catch (e) {
    res.status(409).json({ error: 'Email already registered' });
} });
app.post('/api/login', (req, res) => { const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(req.body.email || '').trim().toLowerCase()); if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password))
    return res.status(401).json({ error: 'Invalid email or password' }); req.session.userId = u.id; res.json({ name: u.name, email: u.email }); });
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => { const u = req.session.userId && db.prepare('SELECT id,name,email FROM users WHERE id=?').get(req.session.userId); res.json(u || null); });
app.post('/api/quiz', (req, res) => { const answers = req.body.answers; if (!Array.isArray(answers) || answers.length !== questions.length || answers.some(v => !Number.isInteger(v) || v < 1 || v > 5))
    return res.status(400).json({ error: 'Please answer every question from 1 to 5' }); const scores = { Technology: 0, Creative: 0, Business: 0, Science: 0, People: 0 }; answers.forEach((v, i) => scores[questions[i][1]] += v); const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]); if (req.session.userId)
    db.prepare('INSERT INTO results(user_id,category) VALUES(?,?)').run(req.session.userId, ranked[0][0]); res.json({ ranked: ranked.map(([category, score]) => ({ category, score, max: 15 })), recommended: careers.filter(c => ranked.slice(0, 3).some(x => x[0] === c.category)).slice(0, 6) }); });
app.get('/api/dashboard', auth, (req, res) => res.json({ results: db.prepare('SELECT category,created_at FROM results WHERE user_id=? ORDER BY id DESC LIMIT 10').all(req.session.userId), saved: db.prepare('SELECT career_id FROM saved WHERE user_id=?').all(req.session.userId).map(x => x.career_id) }));
app.post('/api/save', auth, (req, res) => { const id = Number(req.body.careerId); if (!careers.some(c => c.id === id))
    return res.status(400).json({ error: 'Invalid career' }); db.prepare('INSERT OR IGNORE INTO saved(user_id,career_id) VALUES(?,?)').run(req.session.userId, id); res.json({ ok: true }); });
app.post('/api/unsave', auth, (req, res) => { db.prepare('DELETE FROM saved WHERE user_id=? AND career_id=?').run(req.session.userId, Number(req.body.careerId)); res.json({ ok: true }); });
app.post('/api/contact', (req, res) => { const { name, email, message } = req.body; if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !message || message.length > 2000)
    return res.status(400).json({ error: 'Please provide valid details (message max 2000 characters)' }); db.prepare('INSERT INTO messages(name,email,message) VALUES(?,?,?)').run(name, email, message); res.json({ ok: true }); });
app.listen(3000, () => console.log('CareerPath running at http://localhost:3000'));

