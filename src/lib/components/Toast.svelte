<script lang="ts">
	import { toasts } from '$lib/stores/toast';

	const typeColors = {
		success: 'bg-success/20 border-success/40 text-success',
		error: 'bg-danger/20 border-danger/40 text-danger',
		info: 'bg-accent/20 border-accent/40 text-accent'
	};
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	{#each $toasts as toast (toast.id)}
		<div class="border rounded px-4 py-2 text-sm {typeColors[toast.type]} animate-[fadeIn_0.2s_ease-out]">
			{toast.text}
			<button class="ml-3 opacity-60 hover:opacity-100" onclick={() => toasts.dismiss(toast.id)}>×</button>
		</div>
	{/each}
</div>
