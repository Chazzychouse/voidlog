import { error, redirect } from '@sveltejs/kit';
import { getJournal, updateJournal, deleteJournal, getAllProjects, getAllTickets, getJournalWithFullContext } from '$lib/server/db';
import { writeJournalToVault, deleteJournalFromVault, isSyncEnabled, isDeleteOnRemoveEnabled } from '$lib/server/obsidian';

export async function load({ params }) {
	const [journal, projects, tickets] = await Promise.all([
		getJournal(Number(params.id)),
		getAllProjects(),
		getAllTickets()
	]);
	if (!journal) throw error(404, 'Journal entry not found');
	return { journal, projects, tickets };
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const projectId = data.get('project_id') as string;
		const ticketId = data.get('ticket_id') as string;

		if (!title?.trim()) {
			return { error: 'Title is required' };
		}

		await updateJournal(
			Number(params.id),
			title.trim(),
			content?.trim() ?? '',
			projectId ? Number(projectId) : undefined,
			ticketId ? Number(ticketId) : undefined
		);

		if (isSyncEnabled()) {
			const journal = getJournalWithFullContext(Number(params.id));
			if (journal) {
				await writeJournalToVault(journal);
			}
		}

		return { success: true };
	},
	delete: async ({ params }) => {
		const journalId = Number(params.id);

		if (isDeleteOnRemoveEnabled()) {
			await deleteJournalFromVault(journalId);
		}

		deleteJournal(journalId);
		throw redirect(303, '/journal');
	}
};
