import { error, redirect } from '@sveltejs/kit';
import { getJournal, updateJournal, deleteJournal, getAllProjects } from '$lib/server/db';

export async function load({ params }) {
	const [journal, projects] = await Promise.all([
		getJournal(Number(params.id)),
		getAllProjects()
	]);
	if (!journal) throw error(404, 'Journal entry not found');
	return { journal, projects };
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const projectId = data.get('project_id') as string;

		if (!title?.trim()) {
			return { error: 'Title is required' };
		}

		await updateJournal(Number(params.id), title.trim(), content?.trim() ?? '', projectId ? Number(projectId) : undefined);
		return { success: true };
	},
	delete: async ({ params }) => {
		await deleteJournal(Number(params.id));
		throw redirect(303, '/journal');
	}
};
