import { json } from '@sveltejs/kit';
import { validateVaultPath } from '$lib/server/obsidian';

export async function POST({ request }) {
	const { path } = await request.json();

	if (!path || typeof path !== 'string') {
		return json({ valid: false, error: 'Path is required' }, { status: 400 });
	}

	const result = validateVaultPath(path);
	return json(result);
}
