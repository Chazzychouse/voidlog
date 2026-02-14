import { getAllJournals, getAllPipelines, getAllProjects } from '$lib/server/db';

export function load({ url }) {
	const projectId = url.searchParams.get('project');
	const journals = getAllJournals(projectId ? Number(projectId) : undefined);
	const projects = getAllProjects();
	const pipelines = getAllPipelines();
	return { journals, projects, pipelines };
}
