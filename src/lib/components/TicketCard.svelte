<script lang="ts">
	import type { Ticket } from '$lib/server/db';

	let { ticket }: { ticket: Ticket } = $props();

	const statusColors: Record<string, string> = {
		open: 'bg-void-500 text-void-200',
		in_progress: 'bg-warning/20 text-warning',
		done: 'bg-success/20 text-success',
		closed: 'bg-void-600 text-void-400'
	};

	const statusLabels: Record<string, string> = {
		open: 'Open',
		in_progress: 'In Progress',
		done: 'Done',
		closed: 'Closed'
	};

	const priorityColors: Record<string, string> = {
		low: 'text-void-400',
		medium: 'text-warning',
		high: 'text-danger'
	};
</script>

<a href="/tickets/{ticket.id}" class="block border border-void-600 rounded-lg p-4 hover:border-accent/50 transition-colors bg-void-800">
	<div class="flex items-center justify-between gap-2">
		<h4 class="font-bold text-void-50 truncate">{ticket.title}</h4>
		<span class="shrink-0 text-xs px-2 py-0.5 rounded {statusColors[ticket.status]}">
			{statusLabels[ticket.status]}
		</span>
	</div>
	{#if ticket.description}
		<p class="text-sm text-void-300 mt-1 line-clamp-2">{ticket.description}</p>
	{/if}
	<div class="mt-2 flex items-center gap-3 text-xs">
		<span class={priorityColors[ticket.priority]}>{ticket.priority} priority</span>
		{#if ticket.closed_at}
			<span class="text-void-400">closed {new Date(ticket.closed_at).toLocaleDateString()}</span>
		{/if}
	</div>
</a>
