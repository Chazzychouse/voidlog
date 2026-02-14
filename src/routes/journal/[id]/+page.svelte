<script lang="ts">
	import JournalEditor from '$lib/components/JournalEditor.svelte';
	import { toasts } from '$lib/stores/toast';

	let { data, form } = $props();

	let editing = $state(false);
	let title = $state('');
	let content = $state('');
	let projectId = $state('');

	$effect(() => {
		title = data.journal.title;
		content = data.journal.content;
		projectId = data.journal.project_id ? String(data.journal.project_id) : '';
	});

	$effect(() => {
		if (form?.success) {
			editing = false;
			toasts.add('Entry updated', 'success');
		}
	});
</script>

<div class="max-w-3xl">
	<div class="flex items-center gap-3 mb-1 text-sm">
		<a href="/journal" class="text-void-400 hover:text-void-200">&larr; Journal</a>
	</div>

	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-void-50">{data.journal.title}</h1>
		<div class="flex gap-2">
			<button onclick={() => (editing = !editing)} class="text-sm text-void-300 hover:text-void-100 px-3 py-1 border border-void-600 rounded">
				{editing ? 'Cancel' : 'Edit'}
			</button>
			<form method="POST" action="?/delete">
				<button type="submit" class="text-sm text-danger hover:text-danger/80 px-3 py-1 border border-void-600 rounded" onclick={(e) => { if (!confirm('Delete this entry?')) e.preventDefault(); }}>Delete</button>
			</form>
		</div>
	</div>

	<div class="text-sm text-void-400 mb-2">
		{new Date(data.journal.created_at).toLocaleString()}
		{#if data.journal.project_title}
			<span class="ml-2 text-accent">({data.journal.project_title})</span>
		{/if}
	</div>

	{#if editing}
		<form method="POST" action="?/update">
			<JournalEditor
				bind:title
				bind:content
				bind:projectId
				projects={data.projects}
				error={form?.error ?? ''}
				submitLabel="Save Changes"
			/>
		</form>
	{:else}
		<div class="mt-4 prose prose-invert max-w-none">
			<pre class="whitespace-pre-wrap text-sm text-void-200 bg-void-800 border border-void-600 rounded-lg p-4">{data.journal.content}</pre>
		</div>
	{/if}
</div>
