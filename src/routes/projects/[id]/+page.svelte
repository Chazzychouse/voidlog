<script lang="ts">
	import TicketCard from '$lib/components/TicketCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toasts } from '$lib/stores/toast';
	import { invalidateAll, goto } from '$app/navigation';

	let { data } = $props();

	const statusOptions = [
		{ value: 'not_started', label: 'Not Started', color: 'bg-void-500' },
		{ value: 'in_progress', label: 'In Progress', color: 'bg-warning' },
		{ value: 'completed', label: 'Completed', color: 'bg-success' }
	];

	let showCreateTicket = $state(false);
	let newTicketTitle = $state('');
	let newTicketDesc = $state('');
	let newTicketPriority = $state('medium');

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

	async function createTicket() {
		if (!newTicketTitle.trim()) return;
		const res = await fetch('/api/tickets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: data.project.id,
				title: newTicketTitle.trim(),
				description: newTicketDesc.trim(),
				priority: newTicketPriority
			})
		});
		if (res.ok) {
			toasts.add('Ticket created', 'success');
			newTicketTitle = '';
			newTicketDesc = '';
			newTicketPriority = 'medium';
			showCreateTicket = false;
			await invalidateAll();
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

	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-4">
				<h2 class="text-lg font-bold text-void-100">Tickets</h2>
				{#if data.ticketStats.total > 0}
					<div class="flex items-center gap-3 text-xs text-void-400">
						<span>{data.ticketStats.total} total</span>
						<span class="text-success">{data.ticketStats.done} done</span>
						<span class="text-warning">{data.ticketStats.in_progress} active</span>
						<span>{data.ticketStats.open} open</span>
					</div>
				{/if}
			</div>
			<button
				onclick={() => (showCreateTicket = true)}
				class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors"
			>
				+ New Ticket
			</button>
		</div>

		{#if data.tickets.length === 0}
			<p class="text-void-400">No tickets for this project yet.</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.tickets as ticket}
					<TicketCard {ticket} />
				{/each}
			</div>
		{/if}
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

<Modal bind:open={showCreateTicket} title="New Ticket">
	<form onsubmit={(e) => { e.preventDefault(); createTicket(); }} class="space-y-4">
		<div>
			<label for="ticket-title" class="block text-sm text-void-300 mb-1">Title</label>
			<input id="ticket-title" type="text" bind:value={newTicketTitle} class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none" placeholder="e.g. Fix login bug" />
		</div>
		<div>
			<label for="ticket-desc" class="block text-sm text-void-300 mb-1">Description</label>
			<textarea id="ticket-desc" bind:value={newTicketDesc} rows="3" class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"></textarea>
		</div>
		<div>
			<label for="ticket-priority" class="block text-sm text-void-300 mb-1">Priority</label>
			<select id="ticket-priority" bind:value={newTicketPriority} class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none">
				<option value="low">Low</option>
				<option value="medium">Medium</option>
				<option value="high">High</option>
			</select>
		</div>
		<div class="flex gap-2 justify-end">
			<button type="button" onclick={() => (showCreateTicket = false)} class="px-4 py-2 text-sm text-void-300 hover:text-void-100">Cancel</button>
			<button type="submit" class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-4 py-2 rounded text-sm transition-colors">Create</button>
		</div>
	</form>
</Modal>
