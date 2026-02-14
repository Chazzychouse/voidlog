<script lang="ts">
	let {
		title = $bindable(''),
		content = $bindable(''),
		projectId = $bindable(''),
		projects = [],
		error = '',
		submitLabel = 'Save'
	}: {
		title: string;
		content: string;
		projectId: string;
		projects: { id: number; title: string; pipeline_name: string }[];
		error?: string;
		submitLabel?: string;
	} = $props();
</script>

{#if error}
	<p class="text-danger text-sm mb-4">{error}</p>
{/if}

<div class="space-y-4">
	<div>
		<label for="title" class="block text-sm text-void-300 mb-1">Title</label>
		<input
			id="title"
			name="title"
			type="text"
			bind:value={title}
			class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
			placeholder="Entry title..."
		/>
	</div>

	<div>
		<label for="project_id" class="block text-sm text-void-300 mb-1">Linked Project (optional)</label>
		<select
			id="project_id"
			name="project_id"
			bind:value={projectId}
			class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
		>
			<option value="">General (no project)</option>
			{#each projects as p}
				<option value={String(p.id)}>{p.pipeline_name} / {p.title}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="content" class="block text-sm text-void-300 mb-1">Content (markdown)</label>
		<textarea
			id="content"
			name="content"
			bind:value={content}
			rows="12"
			class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none font-mono text-sm"
			placeholder="Write your journal entry..."
		></textarea>
	</div>

	<button
		type="submit"
		class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded transition-colors"
	>
		{submitLabel}
	</button>
</div>
