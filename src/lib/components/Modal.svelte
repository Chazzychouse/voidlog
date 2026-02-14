<script lang="ts">
	import type { Snippet } from 'svelte';

	let { open = $bindable(false), title = '', children }: { open: boolean; title?: string; children: Snippet } = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onkeydown={(e) => e.key === 'Escape' && (open = false)} onclick={(e) => { if (e.target === e.currentTarget) open = false; }}>
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div class="bg-void-800 border border-void-600 rounded-lg p-6 w-full max-w-lg mx-4" onclick={(e) => e.stopPropagation()}>
			{#if title}
				<h2 class="text-lg font-bold mb-4 text-void-50">{title}</h2>
			{/if}
			{@render children()}
		</div>
	</div>
{/if}
