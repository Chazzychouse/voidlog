<script lang="ts">
	import TaskList from '$lib/components/TaskList.svelte';
	import { toasts } from '$lib/stores/toast';
	import { invalidateAll, goto } from '$app/navigation';

	let { data } = $props();

	const statusOptions = [
		{ value: 'open', label: 'Open', color: 'bg-void-500' },
		{ value: 'in_progress', label: 'In Progress', color: 'bg-warning' },
		{ value: 'done', label: 'Done', color: 'bg-success' },
		{ value: 'closed', label: 'Closed', color: 'bg-void-600' }
	];

	const priorityColors: Record<string, string> = {
		low: 'text-void-400',
		medium: 'text-warning',
		high: 'text-danger'
	};

	async function setStatus(status: string) {
		const res = await fetch('/api/tickets', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.ticket.id, status })
		});
		if (res.ok) {
			toasts.add('Status updated', 'info');
			await invalidateAll();
		}
	}

	async function deleteTicket() {
		if (!confirm('Delete this ticket and all its tasks?')) return;
		const res = await fetch('/api/tickets', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: data.ticket.id })
		});
		if (res.ok) {
			toasts.add('Ticket deleted', 'success');
			goto(`/projects/${data.ticket.project_id}`);
		}
	}
</script>

<div class="max-w-4xl">
	<div class="flex items-center gap-3 mb-1 text-sm">
		<a href="/" class="text-void-400 hover:text-void-200">&larr; Dashboard</a>
		<span class="text-void-600">/</span>
		<a href="/projects/{data.ticket.project_id}" class="text-void-400 hover:text-void-200">{data.ticket.project_title}</a>
	</div>

	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-void-50">{data.ticket.title}</h1>
		<button onclick={deleteTicket} class="text-sm text-danger hover:text-danger/80 px-3 py-1 border border-void-600 rounded">Delete</button>
	</div>

	{#if data.ticket.description}
		<p class="text-void-300 mb-6">{data.ticket.description}</p>
	{/if}

	<div class="flex items-center gap-4 mb-6 text-sm">
		<span class={priorityColors[data.ticket.priority]}>{data.ticket.priority} priority</span>
		<span class="text-void-400">{data.ticket.pipeline_name}</span>
		{#if data.ticket.closed_at}
			<span class="text-void-400">Closed {new Date(data.ticket.closed_at).toLocaleDateString()}</span>
		{/if}
	</div>

	<div class="mb-8">
		<h2 class="text-sm text-void-300 mb-2">Status</h2>
		<div class="flex gap-2">
			{#each statusOptions as opt}
				<button
					onclick={() => setStatus(opt.value)}
					class="px-4 py-2 rounded text-sm border transition-colors {data.ticket.status === opt.value ? `${opt.color} text-void-900 font-bold border-transparent` : 'border-void-600 text-void-300 hover:text-void-100'}"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="text-lg font-bold text-void-100 mb-4">Tasks</h2>
		<div class="border border-void-600 rounded-lg p-4 bg-void-800">
			<TaskList tasks={data.tasks} ticketId={data.ticket.id} />
		</div>
	</div>

	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-bold text-void-100">Journal Entries</h2>
			<a href="/journal/new?project={data.ticket.project_id}&ticket={data.ticket.id}" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">
				+ New Entry
			</a>
		</div>

		{#if data.journals.length === 0}
			<p class="text-void-400">No journal entries linked to this ticket yet.</p>
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
