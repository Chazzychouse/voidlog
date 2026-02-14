import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'voidlog.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
	CREATE TABLE IF NOT EXISTS pipelines (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT DEFAULT '',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed')),
		difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
		sort_order INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		completed_at TEXT
	);

	CREATE TABLE IF NOT EXISTS journals (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
		title TEXT NOT NULL,
		content TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS notifications_log (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT NOT NULL CHECK(type IN ('reminder', 'milestone', 'inactivity')),
		message TEXT NOT NULL,
		sent_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
`);

// --- Pipelines ---

export function getAllPipelines() {
	return db.prepare('SELECT * FROM pipelines ORDER BY created_at DESC').all() as Pipeline[];
}

export function getPipeline(id: number) {
	return db.prepare('SELECT * FROM pipelines WHERE id = ?').get(id) as Pipeline | undefined;
}

export function createPipeline(name: string, description = '') {
	const result = db.prepare('INSERT INTO pipelines (name, description) VALUES (?, ?)').run(name, description);
	return result.lastInsertRowid as number;
}

export function updatePipeline(id: number, name: string, description: string) {
	db.prepare('UPDATE pipelines SET name = ?, description = ? WHERE id = ?').run(name, description, id);
}

export function deletePipeline(id: number) {
	db.prepare('DELETE FROM pipelines WHERE id = ?').run(id);
}

// --- Projects ---

export function getProjectsByPipeline(pipelineId: number) {
	return db.prepare('SELECT * FROM projects WHERE pipeline_id = ? ORDER BY sort_order, created_at').all(pipelineId) as Project[];
}

export function getProject(id: number) {
	return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function createProject(pipelineId: number, title: string, description: string, difficulty: string) {
	const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects WHERE pipeline_id = ?').get(pipelineId) as { next: number };
	const result = db.prepare('INSERT INTO projects (pipeline_id, title, description, difficulty, sort_order) VALUES (?, ?, ?, ?, ?)').run(pipelineId, title, description, difficulty, maxOrder.next);
	return result.lastInsertRowid as number;
}

export function updateProject(id: number, data: Partial<Pick<Project, 'title' | 'description' | 'status' | 'difficulty' | 'sort_order'>>) {
	const fields: string[] = [];
	const values: unknown[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			fields.push(`${key} = ?`);
			values.push(value);
		}
	}
	if (data.status === 'completed') {
		fields.push("completed_at = datetime('now')");
	} else if (data.status && data.status !== 'completed') {
		fields.push('completed_at = NULL');
	}
	if (fields.length === 0) return;
	values.push(id);
	db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProject(id: number) {
	db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// --- Journals ---

export function getAllJournals(projectId?: number) {
	if (projectId) {
		return db.prepare('SELECT j.*, p.title as project_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id WHERE j.project_id = ? ORDER BY j.created_at DESC').all(projectId) as JournalWithProject[];
	}
	return db.prepare('SELECT j.*, p.title as project_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id ORDER BY j.created_at DESC').all() as JournalWithProject[];
}

export function getJournal(id: number) {
	return db.prepare('SELECT j.*, p.title as project_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id WHERE j.id = ?').get(id) as JournalWithProject | undefined;
}

export function createJournal(title: string, content: string, projectId?: number) {
	const result = db.prepare('INSERT INTO journals (title, content, project_id) VALUES (?, ?, ?)').run(title, content, projectId ?? null);
	return result.lastInsertRowid as number;
}

export function updateJournal(id: number, title: string, content: string, projectId?: number) {
	db.prepare('UPDATE journals SET title = ?, content = ?, project_id = ? WHERE id = ?').run(title, content, projectId ?? null, id);
}

export function deleteJournal(id: number) {
	db.prepare('DELETE FROM journals WHERE id = ?').run(id);
}

// --- Settings ---

export function getSetting(key: string): string | undefined {
	const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
	return row?.value;
}

export function setSetting(key: string, value: string) {
	db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
	const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
	return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// --- Notifications ---

export function logNotification(type: string, message: string) {
	db.prepare('INSERT INTO notifications_log (type, message) VALUES (?, ?)').run(type, message);
}

export function getRecentNotifications(limit = 20) {
	return db.prepare('SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT ?').all(limit) as NotificationLog[];
}

// --- Stats ---

export function getPipelineStats(pipelineId: number) {
	return db.prepare(`
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
			SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
			SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started
		FROM projects WHERE pipeline_id = ?
	`).get(pipelineId) as { total: number; completed: number; in_progress: number; not_started: number };
}

export function hasJournalToday(): boolean {
	const row = db.prepare("SELECT COUNT(*) as count FROM journals WHERE date(created_at) = date('now')").get() as { count: number };
	return row.count > 0;
}

export function getLastActivityDate(): string | null {
	const row = db.prepare("SELECT MAX(created_at) as last FROM journals").get() as { last: string | null };
	return row?.last ?? null;
}

export function getAllProjects() {
	return db.prepare('SELECT p.*, pl.name as pipeline_name FROM projects p JOIN pipelines pl ON p.pipeline_id = pl.id ORDER BY p.created_at DESC').all() as (Project & { pipeline_name: string })[];
}

// --- Types ---

export interface Pipeline {
	id: number;
	name: string;
	description: string;
	created_at: string;
}

export interface Project {
	id: number;
	pipeline_id: number;
	title: string;
	description: string;
	status: 'not_started' | 'in_progress' | 'completed';
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	sort_order: number;
	created_at: string;
	completed_at: string | null;
}

export interface Journal {
	id: number;
	project_id: number | null;
	title: string;
	content: string;
	created_at: string;
}

export interface JournalWithProject extends Journal {
	project_title: string | null;
}

export interface NotificationLog {
	id: number;
	type: string;
	message: string;
	sent_at: string;
}

export default db;
