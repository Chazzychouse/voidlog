<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toasts } from '$lib/stores/toast';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let showCreate = $state(false);
	let showEdit = $state(false);
	let newTitle = $state('');
	let newDesc = $state('');
	let newDifficulty = $state('beginner');
	let editName = $state('');
	let editDesc = $state('');

	function openEdit() {
		editName = data.pipeline.name;
		editDesc = data.pipeline.description;
		showEdit = true;
	}

	async function createProject() {
		if (!newTitle.trim()) return;
		const res = await fetch('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				pipeline_id: data.pipeline.id,
				title: newTitle.trim(),
				description: newDesc.trim(),
				difficulty: newDifficulty
			})
		});
		if (res.ok) {
			toasts.add('Project created', 'success');
			newTitle = '';
			newDesc = '';
			newDifficulty = 'beginner';
			showCreate = false;
			await invalidateAll();
		}
	}

	async function updatePipeline() {
		if (!editName.trim()) return;
		const res = await fetch('/api/pipelines', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.pipeline.id, name: editName.trim(), description: editDesc.trim() })
		});
		if (res.ok) {
			toasts.add('Pipeline updated', 'success');
			showEdit = false;
			await invalidateAll();
		}
	}

	async function deletePipeline() {
		if (!confirm('Delete this pipeline and all its projects?')) return;
		const res = await fetch('/api/pipelines', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.pipeline.id })
		});
		if (res.ok) {
			toasts.add('Pipeline deleted', 'success');
			goto('/');
		}
	}
</script>

<div class="max-w-4xl">
	<div class="flex items-center gap-3 mb-1">
		<a href="/" class="text-void-400 hover:text-void-200 text-sm">&larr; Dashboard</a>
	</div>

	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-void-50">{data.pipeline.name}</h1>
			{#if data.pipeline.description}
				<p class="text-void-300 mt-1">{data.pipeline.description}</p>
			{/if}
		</div>
		<div class="flex gap-2">
			<button onclick={openEdit} class="text-sm text-void-300 hover:text-void-100 px-3 py-1 border border-void-600 rounded">Edit</button>
			<button onclick={deletePipeline} class="text-sm text-danger hover:text-danger/80 px-3 py-1 border border-void-600 rounded">Delete</button>
		</div>
	</div>

	<div class="flex items-center gap-4 mb-6 text-sm text-void-400">
		<span>{data.stats.total} project{data.stats.total !== 1 ? 's' : ''}</span>
		<span class="text-success">{data.stats.completed} done</span>
		<span class="text-warning">{data.stats.in_progress} active</span>
		<span>{data.stats.not_started} queued</span>
	</div>

	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-bold text-void-100">Projects</h2>
		<button
			onclick={() => (showCreate = true)}
			class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors"
		>
			+ New Project
		</button>
	</div>

	{#if data.projects.length === 0}
		<p class="text-void-400">No projects yet.</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.projects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>

<Modal bind:open={showCreate} title="New Project">
	<form onsubmit={(e) => { e.preventDefault(); createProject(); }} class="space-y-4">
		<div>
			<label for="proj-title" class="block text-sm text-void-300 mb-1">Title</label>
			<input id="proj-title" type="text" bind:value={newTitle} class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none" placeholder="e.g. CLI Todo App" />
		</div>
		<div>
			<label for="proj-desc" class="block text-sm text-void-300 mb-1">Description</label>
			<textarea id="proj-desc" bind:value={newDesc} rows="3" class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"></textarea>
		</div>
		<div>
			<label for="proj-diff" class="block text-sm text-void-300 mb-1">Difficulty</label>
			<select id="proj-diff" bind:value={newDifficulty} class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none">
				<option value="beginner">Beginner</option>
				<option value="intermediate">Intermediate</option>
				<option value="advanced">Advanced</option>
			</select>
		</div>
		<div class="flex gap-2 justify-end">
			<button type="button" onclick={() => (showCreate = false)} class="px-4 py-2 text-sm text-void-300 hover:text-void-100">Cancel</button>
			<button type="submit" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">Create</button>
		</div>
	</form>
</Modal>

<Modal bind:open={showEdit} title="Edit Pipeline">
	<form onsubmit={(e) => { e.preventDefault(); updatePipeline(); }} class="space-y-4">
		<div>
			<label for="edit-name" class="block text-sm text-void-300 mb-1">Name</label>
			<input id="edit-name" type="text" bind:value={editName} class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none" />
		</div>
		<div>
			<label for="edit-desc" class="block text-sm text-void-300 mb-1">Description</label>
			<textarea id="edit-desc" bind:value={editDesc} rows="3" class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"></textarea>
		</div>
		<div class="flex gap-2 justify-end">
			<button type="button" onclick={() => (showEdit = false)} class="px-4 py-2 text-sm text-void-300 hover:text-void-100">Cancel</button>
			<button type="submit" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">Save</button>
		</div>
	</form>
</Modal>
