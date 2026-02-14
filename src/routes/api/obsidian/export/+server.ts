import { json } from '@sveltejs/kit';
import { getAllJournalsWithFullContext } from '$lib/server/db';
import { exportAllJournals } from '$lib/server/obsidian';

export async function POST() {
	const journals = getAllJournalsWithFullContext();
	const result = await exportAllJournals(journals);
	return json(result);
}
