<script lang="ts">
	let { data } = $props();

	let filterProject = $state('');

	const filtered = $derived(
		filterProject
			? data.journals.filter((j: any) => String(j.project_id) === filterProject)
			: data.journals
	);
</script>

<div class="max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-void-50">Journal</h1>
		<a href="/journal/new" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">
			+ New Entry
		</a>
	</div>

	<div class="mb-6">
		<select
			bind:value={filterProject}
			class="bg-void-700 border border-void-600 rounded px-3 py-2 text-sm text-void-50 focus:border-accent focus:outline-none"
		>
			<option value="">All entries</option>
			{#each data.projects as p}
				<option value={String(p.id)}>{p.pipeline_name} / {p.title}</option>
			{/each}
		</select>
	</div>

	{#if filtered.length === 0}
		<p class="text-void-400">No journal entries yet.</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each filtered as j}
				<a href="/journal/{j.id}" class="block border border-void-600 rounded-lg p-4 hover:border-accent/50 transition-colors bg-void-800">
					<div class="flex items-center justify-between">
						<h3 class="font-bold text-void-50">{j.title}</h3>
						<span class="text-xs text-void-400">{new Date(j.created_at).toLocaleDateString()}</span>
					</div>
					{#if j.project_title}
						<span class="text-xs text-accent mt-1 inline-block">{j.project_title}</span>
					{/if}
					{#if j.ticket_title}
						<span class="text-xs text-warning mt-1 inline-block ml-2">[{j.ticket_title}]</span>
					{/if}
					<p class="text-sm text-void-300 mt-2 line-clamp-3">{j.content}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
