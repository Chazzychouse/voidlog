import { redirect } from '@sveltejs/kit';
import { createJournal, getAllProjects, getJournalWithFullContext } from '$lib/server/db';
import { writeJournalToVault, isSyncEnabled } from '$lib/server/obsidian';

export async function load() {
	const projects = await getAllProjects();
	return { projects };
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const projectId = data.get('project_id') as string;

		if (!title?.trim()) {
			return { error: 'Title is required' };
		}

		const id = await createJournal(title.trim(), content?.trim() ?? '', projectId ? Number(projectId) : undefined);

		if (isSyncEnabled()) {
			const journal = getJournalWithFullContext(id);
			if (journal) {
				await writeJournalToVault(journal);
			}
		}

		throw redirect(303, `/journal/${id}`);
	}
};
