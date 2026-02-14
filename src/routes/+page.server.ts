import { getAllPipelines, getPipelineStats } from '$lib/server/db';

export function load() {
	const pipelines = getAllPipelines();
	const pipelinesWithStats = pipelines.map(p => ({
		...p,
		stats: getPipelineStats(p.id)
	}));
	return { pipelines: pipelinesWithStats };
}
