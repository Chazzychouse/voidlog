<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import { invalidateAll, goto } from '$app/navigation';

	let { data } = $props();

	const statusOptions = [
		{ value: 'not_started', label: 'Not Started', color: 'bg-void-500' },
		{ value: 'in_progress', label: 'In Progress', color: 'bg-warning' },
		{ value: 'completed', label: 'Completed', color: 'bg-success' }
	];

	async function setStatus(status: string) {
		const res = await fetch('/api/projects', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.project.id, status })
		});
		if (res.ok) {
			if (status === 'completed') {
				toasts.add('Project completed! Milestone email sent.', 'success');
			} else {
				toasts.add('Status updated', 'info');
			}
			await invalidateAll();
		}
	}

	async function deleteProject() {
		if (!confirm('Delete this project?')) return;
		const res = await fetch('/api/projects', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.project.id })
		});
		if (res.ok) {
			toasts.add('Project deleted', 'success');
			goto(`/pipelines/${data.project.pipeline_id}`);
		}
	}

	const difficultyColors: Record<string, string> = {
		beginner: 'text-success',
		intermediate: 'text-warning',
		advanced: 'text-danger'
	};
</script>

<div class="max-w-4xl">
	<div class="flex items-center gap-3 mb-1 text-sm">
		<a href="/" class="text-void-400 hover:text-void-200">&larr; Dashboard</a>
		<span class="text-void-600">/</span>
		<a href="/pipelines/{data.pipeline?.id}" class="text-void-400 hover:text-void-200">{data.pipeline?.name}</a>
	</div>

	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-void-50">{data.project.title}</h1>
		<button onclick={deleteProject} class="text-sm text-danger hover:text-danger/80 px-3 py-1 border border-void-600 rounded">Delete</button>
	</div>

	{#if data.project.description}
		<p class="text-void-300 mb-6">{data.project.description}</p>
	{/if}

	<div class="flex items-center gap-4 mb-6">
		<span class="text-sm {difficultyColors[data.project.difficulty]}">{data.project.difficulty}</span>
		{#if data.project.completed_at}
			<span class="text-sm text-void-400">Completed {new Date(data.project.completed_at).toLocaleDateString()}</span>
		{/if}
	</div>

	<div class="mb-8">
		<h2 class="text-sm text-void-300 mb-2">Status</h2>
		<div class="flex gap-2">
			{#each statusOptions as opt}
				<button
					onclick={() => setStatus(opt.value)}
					class="px-4 py-2 rounded text-sm border transition-colors {data.project.status === opt.value ? `${opt.color} text-void-900 font-bold border-transparent` : 'border-void-600 text-void-300 hover:text-void-100'}"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-bold text-void-100">Journal Entries</h2>
			<a href="/journal/new?project={data.project.id}" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">
				+ New Entry
			</a>
		</div>

		{#if data.journals.length === 0}
			<p class="text-void-400">No journal entries for this project yet.</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.journals as j}
					<a href="/journal/{j.id}" class="block border border-void-600 rounded-lg p-4 hover:border-accent/50 transition-colors bg-void-800">
						<h3 class="font-bold text-void-50">{j.title}</h3>
						<p class="text-sm text-void-400 mt-1">{new Date(j.created_at).toLocaleDateString()}</p>
						<p class="text-sm text-void-300 mt-2 line-clamp-2">{j.content}</p>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
