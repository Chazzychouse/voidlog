<script lang="ts">
	import type { Project } from '$lib/server/db';

	let { project }: { project: Project } = $props();

	const statusColors: Record<string, string> = {
		not_started: 'bg-void-500 text-void-200',
		in_progress: 'bg-warning/20 text-warning',
		completed: 'bg-success/20 text-success'
	};

	const statusLabels: Record<string, string> = {
		not_started: 'Not Started',
		in_progress: 'In Progress',
		completed: 'Completed'
	};

	const difficultyColors: Record<string, string> = {
		beginner: 'text-success',
		intermediate: 'text-warning',
		advanced: 'text-danger'
	};
</script>

<a href="/projects/{project.id}" class="block border border-void-600 rounded-lg p-4 hover:border-accent/50 transition-colors bg-void-800">
	<div class="flex items-center justify-between gap-2">
		<h4 class="font-bold text-void-50 truncate">{project.title}</h4>
		<span class="shrink-0 text-xs px-2 py-0.5 rounded {statusColors[project.status]}">
			{statusLabels[project.status]}
		</span>
	</div>
	{#if project.description}
		<p class="text-sm text-void-300 mt-1 line-clamp-2">{project.description}</p>
	{/if}
	<div class="mt-2 flex items-center gap-3 text-xs">
		<span class={difficultyColors[project.difficulty]}>{project.difficulty}</span>
		{#if project.completed_at}
			<span class="text-void-400">completed {new Date(project.completed_at).toLocaleDateString()}</span>
		{/if}
	</div>
</a>
