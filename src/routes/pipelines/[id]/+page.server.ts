import { error } from '@sveltejs/kit';
import { getPipeline, getProjectsByPipeline, getPipelineStats } from '$lib/server/db';

export function load({ params }) {
	const pipeline = getPipeline(Number(params.id));
	if (!pipeline) throw error(404, 'Pipeline not found');
	const projects = getProjectsByPipeline(pipeline.id);
	const stats = getPipelineStats(pipeline.id);
	return { pipeline, projects, stats };
}
