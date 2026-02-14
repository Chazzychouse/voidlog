<script lang="ts">
	import type { Pipeline } from '$lib/server/db';

	let { pipeline, stats }: {
		pipeline: Pipeline;
		stats: { total: number; completed: number; in_progress: number; not_started: number };
	} = $props();

	const pct = $derived(stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0);
</script>

<a href="/pipelines/{pipeline.id}" class="block border border-void-600 rounded-lg p-5 hover:border-accent/50 transition-colors bg-void-800">
	<h3 class="text-lg font-bold text-void-50">{pipeline.name}</h3>
	{#if pipeline.description}
		<p class="text-sm text-void-300 mt-1 line-clamp-2">{pipeline.description}</p>
	{/if}

	<div class="mt-4 flex items-center gap-3 text-xs text-void-400">
		<span>{stats.total} project{stats.total !== 1 ? 's' : ''}</span>
		<span class="text-success">{stats.completed} done</span>
		<span class="text-warning">{stats.in_progress} active</span>
	</div>

	{#if stats.total > 0}
		<div class="mt-3 h-1.5 bg-void-700 rounded-full overflow-hidden">
			<div class="h-full bg-accent rounded-full transition-all" style="width: {pct}%"></div>
		</div>
		<p class="text-xs text-void-400 mt-1">{pct}% complete</p>
	{/if}
</a>
