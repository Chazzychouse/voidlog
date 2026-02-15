import { createClient, type Client, type Row } from '@libsql/client';
import { env } from '$env/dynamic/private';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

function getClient(): Client {
	const localUrl = `file:${path.join(dataDir, 'voidlog.db')}`;

	if (env.TURSO_URL && env.TURSO_AUTH_TOKEN) {
		// Embedded replica: local SQLite file that syncs with Turso
		return createClient({
			url: localUrl,
			syncUrl: env.TURSO_URL,
			authToken: env.TURSO_AUTH_TOKEN,
			syncInterval: 60
		});
	}

	// Local-only fallback
	return createClient({ url: localUrl });
}

const db = getClient();

async function init() {
	await db.executeMultiple(`
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

		CREATE TABLE IF NOT EXISTS tickets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			description TEXT DEFAULT '',
			status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'done', 'closed')),
			priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			closed_at TEXT
		);

		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			completed INTEGER NOT NULL DEFAULT 0,
			sort_order INTEGER NOT NULL DEFAULT 0,
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

		PRAGMA foreign_keys = ON;
	`);

	// Migration: add ticket_id to journals
	try {
		await db.execute("ALTER TABLE journals ADD COLUMN ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL");
	} catch { /* column already exists */ }

	await seed();

	if (env.TURSO_URL && env.TURSO_AUTH_TOKEN) {
		await db.sync();
		console.log('[db] Synced with Turso');
	}
}

async function seed() {
	const { rows } = await db.execute('SELECT COUNT(*) as count FROM pipelines');
	if ((rows[0] as Row).count !== 0) return;

	console.log('[db] Seeding initial Rust pipeline...');

	const result = await db.execute({
		sql: 'INSERT INTO pipelines (name, description) VALUES (?, ?)',
		args: ['Rust', 'Systems programming with Rust — from basics to advanced projects']
	});

	const pipelineId = Number(result.lastInsertRowid);

	const projects: [string, string, string, number][] = [
		['Hello Cargo', 'Set up Rust toolchain, create first project with Cargo, understand project structure', 'beginner', 0],
		['Guessing Game', 'Build the classic guessing game from The Book — learn variables, types, control flow, and user input', 'beginner', 1],
		['CLI Todo App', 'File-backed todo list CLI — structs, enums, error handling, serde for JSON persistence', 'beginner', 2],
		['Markdown Parser', 'Parse a subset of Markdown to HTML — string processing, iterators, and basic parsing techniques', 'intermediate', 3],
		['HTTP Server', 'Build a minimal HTTP server from scratch — TCP sockets, threading, request parsing', 'intermediate', 4],
		['REST API with Axum', 'Full CRUD REST API using Axum, SQLx, and SQLite — async Rust, extractors, middleware', 'intermediate', 5],
		['Shell (rsh)', 'Build a Unix shell — process spawning, pipes, signal handling, job control', 'advanced', 6],
		['Git Implementation', 'Implement core Git commands (init, add, commit, log) — binary formats, SHA-1, tree structures', 'advanced', 7],
		['Compiler Frontend', 'Lexer + parser for a small language — tokenization, AST, recursive descent parsing', 'advanced', 8],
	];

	for (const [title, description, difficulty, sort_order] of projects) {
		await db.execute({
			sql: 'INSERT INTO projects (pipeline_id, title, description, difficulty, sort_order) VALUES (?, ?, ?, ?, ?)',
			args: [pipelineId, title, description, difficulty, sort_order]
		});
	}

	console.log('[db] Seeded Rust pipeline with', projects.length, 'projects');
}

const ready = init();

export async function ensureReady() {
	await ready;
}

// --- Pipelines ---

export async function getAllPipelines() {
	await ready;
	const { rows } = await db.execute('SELECT * FROM pipelines ORDER BY created_at DESC');
	return rows as unknown as Pipeline[];
}

export async function getPipeline(id: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM pipelines WHERE id = ?', args: [id] });
	return (rows[0] as unknown as Pipeline) ?? undefined;
}

export async function createPipeline(name: string, description = '') {
	await ready;
	const result = await db.execute({ sql: 'INSERT INTO pipelines (name, description) VALUES (?, ?)', args: [name, description] });
	return Number(result.lastInsertRowid);
}

export async function updatePipeline(id: number, name: string, description: string) {
	await ready;
	await db.execute({ sql: 'UPDATE pipelines SET name = ?, description = ? WHERE id = ?', args: [name, description, id] });
}

export async function deletePipeline(id: number) {
	await ready;
	await db.execute({ sql: 'DELETE FROM pipelines WHERE id = ?', args: [id] });
}

// --- Projects ---

export async function getProjectsByPipeline(pipelineId: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM projects WHERE pipeline_id = ? ORDER BY sort_order, created_at', args: [pipelineId] });
	return rows as unknown as Project[];
}

export async function getProject(id: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [id] });
	return (rows[0] as unknown as Project) ?? undefined;
}

export async function createProject(pipelineId: number, title: string, description: string, difficulty: string) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM projects WHERE pipeline_id = ?', args: [pipelineId] });
	const next = (rows[0] as Row).next as number;
	const result = await db.execute({ sql: 'INSERT INTO projects (pipeline_id, title, description, difficulty, sort_order) VALUES (?, ?, ?, ?, ?)', args: [pipelineId, title, description, difficulty, next] });
	return Number(result.lastInsertRowid);
}

export async function updateProject(id: number, data: Partial<Pick<Project, 'title' | 'description' | 'status' | 'difficulty' | 'sort_order'>>) {
	await ready;
	const fields: string[] = [];
	const values: (string | number | null)[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			fields.push(`${key} = ?`);
			values.push(value as string | number);
		}
	}
	if (data.status === 'completed') {
		fields.push("completed_at = datetime('now')");
	} else if (data.status && data.status !== 'completed') {
		fields.push('completed_at = NULL');
	}
	if (fields.length === 0) return;
	values.push(id);
	await db.execute({ sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, args: values });
}

export async function deleteProject(id: number) {
	await ready;
	await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
}

// --- Journals ---

export async function getAllJournals(projectId?: number) {
	await ready;
	if (projectId) {
		const { rows } = await db.execute({ sql: 'SELECT j.*, p.title as project_title, t.title as ticket_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id LEFT JOIN tickets t ON j.ticket_id = t.id WHERE j.project_id = ? ORDER BY j.created_at DESC', args: [projectId] });
		return rows as unknown as JournalWithProject[];
	}
	const { rows } = await db.execute('SELECT j.*, p.title as project_title, t.title as ticket_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id LEFT JOIN tickets t ON j.ticket_id = t.id ORDER BY j.created_at DESC');
	return rows as unknown as JournalWithProject[];
}

export async function getJournal(id: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT j.*, p.title as project_title, t.title as ticket_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id LEFT JOIN tickets t ON j.ticket_id = t.id WHERE j.id = ?', args: [id] });
	return (rows[0] as unknown as JournalWithProject) ?? undefined;
}

export async function createJournal(title: string, content: string, projectId?: number, ticketId?: number) {
	await ready;
	const result = await db.execute({ sql: 'INSERT INTO journals (title, content, project_id, ticket_id) VALUES (?, ?, ?, ?)', args: [title, content, projectId ?? null, ticketId ?? null] });
	return Number(result.lastInsertRowid);
}

export async function updateJournal(id: number, title: string, content: string, projectId?: number, ticketId?: number) {
	await ready;
	await db.execute({ sql: 'UPDATE journals SET title = ?, content = ?, project_id = ?, ticket_id = ? WHERE id = ?', args: [title, content, projectId ?? null, ticketId ?? null, id] });
}

export async function deleteJournal(id: number) {
	await ready;
	await db.execute({ sql: 'DELETE FROM journals WHERE id = ?', args: [id] });
}

export function getJournalWithFullContext(id: number) {
	return db.prepare(`
		SELECT
			j.id,
			j.title,
			j.content,
			j.created_at,
			j.project_id,
			j.ticket_id,
			p.title as project_title,
			p.status as project_status,
			p.difficulty as project_difficulty,
			pl.name as pipeline_name,
			t.title as ticket_title
		FROM journals j
		LEFT JOIN projects p ON j.project_id = p.id
		LEFT JOIN pipelines pl ON p.pipeline_id = pl.id
		LEFT JOIN tickets t ON j.ticket_id = t.id
		WHERE j.id = ?
	`).get(id) as JournalWithFullContext | undefined;
}

export function getAllJournalsWithFullContext() {
	return db.prepare(`
		SELECT
			j.id,
			j.title,
			j.content,
			j.created_at,
			j.project_id,
			j.ticket_id,
			p.title as project_title,
			p.status as project_status,
			p.difficulty as project_difficulty,
			pl.name as pipeline_name,
			t.title as ticket_title
		FROM journals j
		LEFT JOIN projects p ON j.project_id = p.id
		LEFT JOIN pipelines pl ON p.pipeline_id = pl.id
		LEFT JOIN tickets t ON j.ticket_id = t.id
		ORDER BY j.created_at DESC
	`).all() as JournalWithFullContext[];
}

export interface JournalWithFullContext {
	id: number;
	title: string;
	content: string;
	created_at: string;
	project_id: number | null;
	ticket_id: number | null;
	project_title: string | null;
	project_status: string | null;
	project_difficulty: string | null;
	pipeline_name: string | null;
	ticket_title: string | null;
}

// --- Tickets ---

export async function getTicketsByProject(projectId: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM tickets WHERE project_id = ? ORDER BY created_at DESC', args: [projectId] });
	return rows as unknown as Ticket[];
}

export async function getTicket(id: number) {
	await ready;
	const { rows } = await db.execute({
		sql: `SELECT t.*, p.title as project_title, pl.name as pipeline_name
			FROM tickets t
			JOIN projects p ON t.project_id = p.id
			JOIN pipelines pl ON p.pipeline_id = pl.id
			WHERE t.id = ?`,
		args: [id]
	});
	return (rows[0] as unknown as TicketWithProject) ?? undefined;
}

export async function createTicket(projectId: number, title: string, description = '', priority = 'medium') {
	await ready;
	const result = await db.execute({ sql: 'INSERT INTO tickets (project_id, title, description, priority) VALUES (?, ?, ?, ?)', args: [projectId, title, description, priority] });
	return Number(result.lastInsertRowid);
}

export async function updateTicket(id: number, data: Partial<Pick<Ticket, 'title' | 'description' | 'status' | 'priority'>>) {
	await ready;
	const fields: string[] = [];
	const values: (string | number | null)[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			fields.push(`${key} = ?`);
			values.push(value as string | number);
		}
	}
	if (data.status === 'done' || data.status === 'closed') {
		fields.push("closed_at = datetime('now')");
	} else if (data.status) {
		fields.push('closed_at = NULL');
	}
	if (fields.length === 0) return;
	values.push(id);
	await db.execute({ sql: `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`, args: values });
}

export async function deleteTicket(id: number) {
	await ready;
	await db.execute({ sql: 'DELETE FROM tickets WHERE id = ?', args: [id] });
}

export async function getTicketStats(projectId: number) {
	await ready;
	const { rows } = await db.execute({
		sql: `SELECT
			COUNT(*) as total,
			SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
			SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
			SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
			SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
		FROM tickets WHERE project_id = ?`,
		args: [projectId]
	});
	return rows[0] as unknown as { total: number; open: number; in_progress: number; done: number; closed: number };
}

export async function getAllTickets() {
	await ready;
	const { rows } = await db.execute('SELECT t.*, p.title as project_title FROM tickets t JOIN projects p ON t.project_id = p.id ORDER BY t.created_at DESC');
	return rows as unknown as (Ticket & { project_title: string })[];
}

// --- Tasks ---

export async function getTasksByTicket(ticketId: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM tasks WHERE ticket_id = ? ORDER BY sort_order, created_at', args: [ticketId] });
	return rows as unknown as Task[];
}

export async function createTask(ticketId: number, title: string) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM tasks WHERE ticket_id = ?', args: [ticketId] });
	const next = (rows[0] as Row).next as number;
	const result = await db.execute({ sql: 'INSERT INTO tasks (ticket_id, title, sort_order) VALUES (?, ?, ?)', args: [ticketId, title, next] });
	return Number(result.lastInsertRowid);
}

export async function updateTask(id: number, data: Partial<Pick<Task, 'title' | 'completed' | 'sort_order'>>) {
	await ready;
	const fields: string[] = [];
	const values: (string | number | null)[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			fields.push(`${key} = ?`);
			values.push(value as string | number);
		}
	}
	if (fields.length === 0) return;
	values.push(id);
	await db.execute({ sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, args: values });
}

export async function deleteTask(id: number) {
	await ready;
	await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
}

export async function getJournalsByTicket(ticketId: number) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT j.*, p.title as project_title, t.title as ticket_title FROM journals j LEFT JOIN projects p ON j.project_id = p.id LEFT JOIN tickets t ON j.ticket_id = t.id WHERE j.ticket_id = ? ORDER BY j.created_at DESC', args: [ticketId] });
	return rows as unknown as JournalWithProject[];
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | undefined> {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
	return rows[0] ? (rows[0] as Row).value as string : undefined;
}

export async function setSetting(key: string, value: string) {
	await ready;
	await db.execute({ sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', args: [key, value] });
}

export async function getAllSettings(): Promise<Record<string, string>> {
	await ready;
	const { rows } = await db.execute('SELECT key, value FROM settings');
	return Object.fromEntries(rows.map(r => [(r as Row).key as string, (r as Row).value as string]));
}

// --- Notifications ---

export async function logNotification(type: string, message: string) {
	await ready;
	await db.execute({ sql: 'INSERT INTO notifications_log (type, message) VALUES (?, ?)', args: [type, message] });
}

export async function getRecentNotifications(limit = 20) {
	await ready;
	const { rows } = await db.execute({ sql: 'SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT ?', args: [limit] });
	return rows as unknown as NotificationLog[];
}

// --- Stats ---

export async function getPipelineStats(pipelineId: number) {
	await ready;
	const { rows } = await db.execute({
		sql: `SELECT
			COUNT(*) as total,
			SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
			SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
			SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started
		FROM projects WHERE pipeline_id = ?`,
		args: [pipelineId]
	});
	return rows[0] as unknown as { total: number; completed: number; in_progress: number; not_started: number };
}

export async function hasJournalToday(): Promise<boolean> {
	await ready;
	const { rows } = await db.execute("SELECT COUNT(*) as count FROM journals WHERE date(created_at) = date('now')");
	return ((rows[0] as Row).count as number) > 0;
}

export async function getLastActivityDate(): Promise<string | null> {
	await ready;
	const { rows } = await db.execute('SELECT MAX(created_at) as last FROM journals');
	return ((rows[0] as Row).last as string) ?? null;
}

export async function getAllProjects() {
	await ready;
	const { rows } = await db.execute('SELECT p.*, pl.name as pipeline_name FROM projects p JOIN pipelines pl ON p.pipeline_id = pl.id ORDER BY p.created_at DESC');
	return rows as unknown as (Project & { pipeline_name: string })[];
}

// --- Sync helper ---

export async function syncDb() {
	if (env.TURSO_URL && env.TURSO_AUTH_TOKEN) {
		await db.sync();
	}
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
	ticket_id: number | null;
	title: string;
	content: string;
	created_at: string;
}

export interface JournalWithProject extends Journal {
	project_title: string | null;
	ticket_title: string | null;
}

export interface Ticket {
	id: number;
	project_id: number;
	title: string;
	description: string;
	status: 'open' | 'in_progress' | 'done' | 'closed';
	priority: 'low' | 'medium' | 'high';
	created_at: string;
	closed_at: string | null;
}

export interface TicketWithProject extends Ticket {
	project_title: string;
	pipeline_name: string;
}

export interface Task {
	id: number;
	ticket_id: number;
	title: string;
	completed: number;
	sort_order: number;
	created_at: string;
}

export interface NotificationLog {
	id: number;
	type: string;
	message: string;
	sent_at: string;
}
