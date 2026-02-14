<script lang="ts">
	import { toasts } from '$lib/stores/toast';

	let { data, form } = $props();

	let email = $state('');
	let reminderHour = $state('20');
	let inactivityDays = $state('3');
	let reminderEnabled = $state(true);
	let inactivityEnabled = $state(true);
	let testingEmail = $state(false);

	$effect(() => {
		email = data.settings.email ?? '';
		reminderHour = data.settings.reminder_hour ?? '20';
		inactivityDays = data.settings.inactivity_days ?? '3';
		reminderEnabled = data.settings.reminder_enabled !== 'false';
		inactivityEnabled = data.settings.inactivity_enabled !== 'false';
	});

	$effect(() => {
		if (form?.success) {
			toasts.add('Settings saved', 'success');
		}
	});

	async function sendTestEmail() {
		testingEmail = true;
		try {
			const res = await fetch('/api/notifications/test', { method: 'POST' });
			const result = await res.json();
			if (result.sent) {
				toasts.add('Test email sent!', 'success');
			} else {
				toasts.add('Failed to send test email. Check your .env config.', 'error');
			}
		} catch {
			toasts.add('Error sending test email', 'error');
		}
		testingEmail = false;
	}
</script>

<div class="max-w-2xl">
	<h1 class="text-2xl font-bold text-void-50 mb-6">Settings</h1>

	<form method="POST" class="space-y-6">
		<section class="border border-void-600 rounded-lg p-5 bg-void-800">
			<h2 class="text-lg font-bold text-void-100 mb-4">Notification Email</h2>
			<div>
				<label for="email" class="block text-sm text-void-300 mb-1">Email address (overrides .env NOTIFY_EMAIL)</label>
				<input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					class="w-full bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
					placeholder="your@email.com"
				/>
			</div>
			<button
				type="button"
				onclick={sendTestEmail}
				disabled={testingEmail}
				class="mt-3 text-sm text-accent hover:text-accent-hover disabled:opacity-50"
			>
				{testingEmail ? 'Sending...' : 'Send test email'}
			</button>
		</section>

		<section class="border border-void-600 rounded-lg p-5 bg-void-800">
			<h2 class="text-lg font-bold text-void-100 mb-4">Daily Reminder</h2>
			<div class="flex items-center gap-3 mb-3">
				<input type="checkbox" id="reminder-on" bind:checked={reminderEnabled} class="accent-accent" />
				<input type="hidden" name="reminder_enabled" value={reminderEnabled ? 'true' : 'false'} />
				<label for="reminder-on" class="text-sm text-void-200">Enable daily journal reminder</label>
			</div>
			<div>
				<label for="reminder-hour" class="block text-sm text-void-300 mb-1">Reminder hour (0-23)</label>
				<input
					id="reminder-hour"
					name="reminder_hour"
					type="number"
					min="0"
					max="23"
					bind:value={reminderHour}
					class="w-24 bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
				/>
			</div>
		</section>

		<section class="border border-void-600 rounded-lg p-5 bg-void-800">
			<h2 class="text-lg font-bold text-void-100 mb-4">Inactivity Alert</h2>
			<div class="flex items-center gap-3 mb-3">
				<input type="checkbox" id="inactivity-on" bind:checked={inactivityEnabled} class="accent-accent" />
				<input type="hidden" name="inactivity_enabled" value={inactivityEnabled ? 'true' : 'false'} />
				<label for="inactivity-on" class="text-sm text-void-200">Enable inactivity alerts</label>
			</div>
			<div>
				<label for="inactivity-days" class="block text-sm text-void-300 mb-1">Days of inactivity before alert</label>
				<input
					id="inactivity-days"
					name="inactivity_days"
					type="number"
					min="1"
					max="30"
					bind:value={inactivityDays}
					class="w-24 bg-void-700 border border-void-600 rounded px-3 py-2 text-void-50 focus:border-accent focus:outline-none"
				/>
			</div>
		</section>

		<button
			type="submit"
			class="bg-accent hover:bg-accent-hover text-void-900 font-bold px-6 py-2 rounded transition-colors"
		>
			Save Settings
		</button>
	</form>

	{#if data.notifications.length > 0}
		<section class="mt-8">
			<h2 class="text-lg font-bold text-void-100 mb-4">Recent Notifications</h2>
			<div class="flex flex-col gap-2">
				{#each data.notifications as n}
					<div class="border border-void-600 rounded p-3 bg-void-800 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-xs px-2 py-0.5 rounded bg-void-600 text-void-200">{n.type}</span>
							<span class="text-xs text-void-400">{new Date(n.sent_at).toLocaleString()}</span>
						</div>
						<p class="text-void-300 mt-1">{n.message}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
