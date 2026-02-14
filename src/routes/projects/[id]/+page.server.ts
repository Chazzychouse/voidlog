import { error } from '@sveltejs/kit';
import { getProject, getAllJournals, getPipeline } from '$lib/server/db';

export function load({ params }) {
	const project = getProject(Number(params.id));
	if (!project) throw error(404, 'Project not found');
	const pipeline = getPipeline(project.pipeline_id);
	const journals = getAllJournals(project.id);
	return { project, pipeline, journals };
}
