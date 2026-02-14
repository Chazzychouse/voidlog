import { getAllPipelines, getPipelineStats } from '$lib/server/db';

export async function load() {
	const pipelines = await getAllPipelines();
	const pipelinesWithStats = await Promise.all(
		pipelines.map(async (p) => ({
			...p,
			stats: await getPipelineStats(p.id)
		}))
	);
	return { pipelines: pipelinesWithStats };
}
