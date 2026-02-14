<script lang="ts">
	import PipelineCard from '$lib/components/PipelineCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toasts } from '$lib/stores/toast';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showCreate = $state(false);
	let newName = $state('');
	let newDesc = $state('');

	async function createPipeline() {
		if (!newName.trim()) return;
		const res = await fetch('/api/pipelines', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
		});
		if (res.ok) {
			toasts.add('Pipeline created', 'success');
			newName = '';
			newDesc = '';
			showCreate = false;
			await invalidateAll();
		} else {
			toasts.add('Failed to create pipeline', 'error');
		}
	}
</script>

<div class="max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-void-50">Pipelines</h1>
		<button
			onclick={() => (showCreate = true)}
			class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors"
		>
			+ New Pipeline
		</button>
	</div>

	{#if data.pipelines.length === 0}
		<p class="text-void-400">No pipelines yet. Create one to get started.</p>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each data.pipelines as p}
				<PipelineCard pipeline={p} stats={p.stats} />
			{/each}
		</div>
	{/if}
</div>

<Modal bind:open={showCreate} title="New Pipeline">
	<form onsubmit={(e) => { e.preventDefault(); createPipeline(); }} class="space-y-4">
		<div>
			<label for="pipe-name" class="block text-sm text-void-300 mb-1">Name</label>
			<input
				id="pipe-name"
				type="text"
				bind:value={newName}
				class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
				placeholder="e.g. Rust, Go, TypeScript"
			/>
		</div>
		<div>
			<label for="pipe-desc" class="block text-sm text-void-300 mb-1">Description (optional)</label>
			<textarea
				id="pipe-desc"
				bind:value={newDesc}
				rows="3"
				class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
			></textarea>
		</div>
		<div class="flex gap-2 justify-end">
			<button type="button" onclick={() => (showCreate = false)} class="px-4 py-2 text-sm text-void-300 hover:text-void-100">Cancel</button>
			<button type="submit" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">Create</button>
		</div>
	</form>
</Modal>
