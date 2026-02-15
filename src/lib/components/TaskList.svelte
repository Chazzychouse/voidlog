<script lang="ts">
	import type { Task } from '$lib/server/db';

	let { tasks = $bindable([]), ticketId }: { tasks: Task[]; ticketId: number } = $props();

	let newTitle = $state('');

	async function addTask() {
		if (!newTitle.trim()) return;
		const res = await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ticket_id: ticketId, title: newTitle.trim() })
		});
		if (res.ok) {
			const { id } = await res.json();
			tasks = [...tasks, { id, ticket_id: ticketId, title: newTitle.trim(), completed: 0, sort_order: tasks.length, created_at: new Date().toISOString() }];
			newTitle = '';
		}
	}

	async function toggleTask(task: Task) {
		const completed = task.completed ? 0 : 1;
		const res = await fetch('/api/tasks', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: task.id, completed })
		});
		if (res.ok) {
			tasks = tasks.map(t => t.id === task.id ? { ...t, completed } : t);
		}
	}

	async function removeTask(id: number) {
		const res = await fetch('/api/tasks', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
		if (res.ok) {
			tasks = tasks.filter(t => t.id !== id);
		}
	}
</script>

<div class="space-y-2">
	{#each tasks as task (task.id)}
		<div class="flex items-center gap-3 group">
			<button
				onclick={() => toggleTask(task)}
				class="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors {task.completed ? 'bg-success border-success text-void-900' : 'border-void-500 hover:border-accent'}"
			>
				{#if task.completed}
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
				{/if}
			</button>
			<span class="flex-1 text-sm {task.completed ? 'line-through text-void-500' : 'text-void-200'}">{task.title}</span>
			<button
				onclick={() => removeTask(task.id)}
				class="text-void-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity text-sm px-1"
			>&times;</button>
		</div>
	{/each}

	<form onsubmit={(e) => { e.preventDefault(); addTask(); }} class="flex items-center gap-2 mt-3">
		<input
			type="text"
			bind:value={newTitle}
			class="flex-1 bg-void-700 border border-void-600 rounded px-3 py-1.5 text-sm text-void-50 focus:border-accent focus:outline-none"
			placeholder="Add a task..."
		/>
		<button type="submit" class="text-sm text-accent hover:text-accent-hover px-2 py-1.5">Add</button>
	</form>
</div>
