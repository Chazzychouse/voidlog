import fs from 'fs';
import path from 'path';
import { getSetting } from './db';
import type { JournalWithFullContext } from './db';

/**
 * Check if the vault path exists and is writable
 */
export function validateVaultPath(vaultPath: string): { valid: boolean; error?: string } {
	if (!vaultPath || !vaultPath.trim()) {
		return { valid: false, error: 'Vault path is required' };
	}

	const resolvedPath = path.resolve(vaultPath);

	try {
		const stats = fs.statSync(resolvedPath);
		if (!stats.isDirectory()) {
			return { valid: false, error: 'Path is not a directory' };
		}
	} catch {
		return { valid: false, error: 'Path does not exist' };
	}

	try {
		fs.accessSync(resolvedPath, fs.constants.W_OK);
	} catch {
		return { valid: false, error: 'Path is not writable' };
	}

	return { valid: true };
}

/**
 * Convert a title to a safe filename slug
 */
export function slugifyTitle(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
		.substring(0, 50); // Limit length
}

/**
 * Generate the filename for a journal entry
 * Format: voidlog-{id}-{slug}.md
 */
export function generateFilename(id: number, title: string): string {
	const slug = slugifyTitle(title);
	return `voidlog-${id}-${slug}.md`;
}

/**
 * Build YAML frontmatter for a journal entry
 */
export function buildFrontmatter(journal: JournalWithFullContext): string {
	const lines: string[] = ['---'];

	lines.push(`id: ${journal.id}`);
	lines.push(`title: "${escapeYamlString(journal.title)}"`);
	lines.push(`created: ${journal.created_at}`);

	if (journal.project_title) {
		lines.push(`project: "${escapeYamlString(journal.project_title)}"`);
	}

	if (journal.pipeline_name) {
		lines.push(`pipeline: "${escapeYamlString(journal.pipeline_name)}"`);
	}

	if (journal.project_difficulty) {
		lines.push(`difficulty: "${journal.project_difficulty}"`);
	}

	if (journal.project_status) {
		lines.push(`status: "${journal.project_status}"`);
	}

	lines.push('source: voidlog');
	lines.push('---');

	return lines.join('\n');
}

/**
 * Escape special characters in YAML strings
 */
function escapeYamlString(str: string): string {
	return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build the full markdown content with frontmatter
 */
export function buildMarkdownContent(journal: JournalWithFullContext): string {
	const frontmatter = buildFrontmatter(journal);
	const title = `# ${journal.title}`;
	const content = journal.content || '';

	return `${frontmatter}\n\n${title}\n\n${content}`;
}

/**
 * Get the full file path for a journal in the vault
 */
function getJournalFilePath(vaultPath: string, id: number, title: string): string {
	return path.join(vaultPath, generateFilename(id, title));
}

/**
 * Find existing file for a journal (in case title changed)
 */
function findExistingJournalFile(vaultPath: string, id: number): string | null {
	try {
		const files = fs.readdirSync(vaultPath);
		const pattern = new RegExp(`^voidlog-${id}-.*\\.md$`);
		const match = files.find((f) => pattern.test(f));
		return match ? path.join(vaultPath, match) : null;
	} catch {
		return null;
	}
}

/**
 * Write a single journal entry to the vault
 */
export async function writeJournalToVault(
	journal: JournalWithFullContext
): Promise<{ success: boolean; error?: string; filePath?: string }> {
	const vaultPath = getSetting('obsidian_vault_path');
	if (!vaultPath) {
		return { success: false, error: 'Vault path not configured' };
	}

	const validation = validateVaultPath(vaultPath);
	if (!validation.valid) {
		return { success: false, error: validation.error };
	}

	try {
		// Remove old file if title changed
		const existingFile = findExistingJournalFile(vaultPath, journal.id);
		const newFilePath = getJournalFilePath(vaultPath, journal.id, journal.title);

		if (existingFile && existingFile !== newFilePath) {
			fs.unlinkSync(existingFile);
		}

		// Write the new file
		const content = buildMarkdownContent(journal);
		fs.writeFileSync(newFilePath, content, 'utf-8');

		return { success: true, filePath: newFilePath };
	} catch (err) {
		return { success: false, error: `Failed to write file: ${err}` };
	}
}

/**
 * Delete a journal file from the vault
 */
export async function deleteJournalFromVault(
	journalId: number
): Promise<{ success: boolean; error?: string }> {
	const vaultPath = getSetting('obsidian_vault_path');
	if (!vaultPath) {
		return { success: false, error: 'Vault path not configured' };
	}

	try {
		const existingFile = findExistingJournalFile(vaultPath, journalId);
		if (existingFile) {
			fs.unlinkSync(existingFile);
		}
		return { success: true };
	} catch (err) {
		return { success: false, error: `Failed to delete file: ${err}` };
	}
}

/**
 * Export all journals to the vault
 */
export async function exportAllJournals(
	journals: JournalWithFullContext[]
): Promise<{ success: boolean; exported: number; errors: string[] }> {
	const vaultPath = getSetting('obsidian_vault_path');
	if (!vaultPath) {
		return { success: false, exported: 0, errors: ['Vault path not configured'] };
	}

	const validation = validateVaultPath(vaultPath);
	if (!validation.valid) {
		return { success: false, exported: 0, errors: [validation.error!] };
	}

	let exported = 0;
	const errors: string[] = [];

	for (const journal of journals) {
		const result = await writeJournalToVault(journal);
		if (result.success) {
			exported++;
		} else {
			errors.push(`Journal ${journal.id}: ${result.error}`);
		}
	}

	return {
		success: errors.length === 0,
		exported,
		errors
	};
}

/**
 * Check if Obsidian sync is enabled
 */
export function isSyncEnabled(): boolean {
	return getSetting('obsidian_sync_enabled') === 'true';
}

/**
 * Check if delete-on-remove is enabled
 */
export function isDeleteOnRemoveEnabled(): boolean {
	return getSetting('obsidian_delete_on_remove') === 'true';
}
