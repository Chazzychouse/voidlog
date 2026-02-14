import { error } from '@sveltejs/kit';
import { getPipeline, getProjectsByPipeline, getPipelineStats } from '$lib/server/db';

export async function load({ params }) {
	const pipeline = await getPipeline(Number(params.id));
	if (!pipeline) throw error(404, 'Pipeline not found');
	const [projects, stats] = await Promise.all([
		getProjectsByPipeline(pipeline.id),
		getPipelineStats(pipeline.id)
	]);
	return { pipeline, projects, stats };
}
