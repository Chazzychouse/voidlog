import { getAllSettings, setSetting, getRecentNotifications } from '$lib/server/db';

export async function load() {
	const [settings, notifications] = await Promise.all([
		getAllSettings(),
		getRecentNotifications()
	]);
	return { settings, notifications };
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const keys = [
			'email',
			'reminder_hour',
			'inactivity_days',
			'reminder_enabled',
			'inactivity_enabled',
			'obsidian_vault_path',
			'obsidian_sync_enabled',
			'obsidian_delete_on_remove'
		];
		for (const key of keys) {
			const value = data.get(key) as string;
			if (value !== null && value !== undefined) {
				await setSetting(key, value);
			}
		}
		return { success: true };
	}
};
