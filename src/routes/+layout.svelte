<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/journal', label: 'Journal' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Voidlog</title>
</svelte:head>

<div class="min-h-screen flex">
	<aside class="w-56 shrink-0 border-r border-void-700 bg-void-800 p-4 flex flex-col">
		<a href="/" class="text-xl font-bold text-accent mb-8 tracking-wider">voidlog</a>
		<nav class="flex flex-col gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="px-3 py-2 rounded text-sm text-void-200 hover:bg-void-700 hover:text-void-50 transition-colors"
				>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="mt-auto text-xs text-void-500 pt-4">
			local project tracker
		</div>
	</aside>

	<main class="flex-1 p-8 overflow-auto">
		{@render children()}
	</main>
</div>

<Toast />
