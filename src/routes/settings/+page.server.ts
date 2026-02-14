import { getAllSettings, setSetting, getRecentNotifications } from '$lib/server/db';

export function load() {
	const settings = getAllSettings();
	const notifications = getRecentNotifications();
	return { settings, notifications };
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const keys = ['email', 'reminder_hour', 'inactivity_days', 'reminder_enabled', 'inactivity_enabled'];
		for (const key of keys) {
			const value = data.get(key) as string;
			if (value !== null && value !== undefined) {
				setSetting(key, value);
			}
		}
		return { success: true };
	}
};
