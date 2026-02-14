import { getAllJournals, getAllPipelines, getAllProjects } from '$lib/server/db';

export async function load({ url }) {
	const projectId = url.searchParams.get('project');
	const [journals, projects, pipelines] = await Promise.all([
		getAllJournals(projectId ? Number(projectId) : undefined),
		getAllProjects(),
		getAllPipelines()
	]);
	return { journals, projects, pipelines };
}
