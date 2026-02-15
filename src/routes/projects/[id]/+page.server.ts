import { error } from '@sveltejs/kit';
import { getProject, getAllJournals, getPipeline, getTicketsByProject, getTicketStats } from '$lib/server/db';

export async function load({ params }) {
	const project = await getProject(Number(params.id));
	if (!project) throw error(404, 'Project not found');
	const [pipeline, journals, tickets, ticketStats] = await Promise.all([
		getPipeline(project.pipeline_id),
		getAllJournals(project.id),
		getTicketsByProject(project.id),
		getTicketStats(project.id)
	]);
	return { project, pipeline, journals, tickets, ticketStats };
}
