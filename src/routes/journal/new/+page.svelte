<script lang="ts">
	import JournalEditor from '$lib/components/JournalEditor.svelte';
	import { page } from '$app/stores';

	let { data, form } = $props();

	let title = $state('');
	let content = $state('');
	let projectId = $state($page.url.searchParams.get('project') ?? '');
	let ticketId = $state($page.url.searchParams.get('ticket') ?? '');
</script>

<div class="max-w-3xl">
	<div class="flex items-center gap-3 mb-1 text-sm">
		<a href="/journal" class="text-void-400 hover:text-void-200">&larr; Journal</a>
	</div>

	<h1 class="text-2xl font-bold text-void-50 mb-6">New Journal Entry</h1>

	<form method="POST">
		<JournalEditor
			bind:title
			bind:content
			bind:projectId
			bind:ticketId
			projects={data.projects}
			tickets={data.tickets}
			error={form?.error ?? ''}
			submitLabel="Create Entry"
		/>
	</form>
</div>
