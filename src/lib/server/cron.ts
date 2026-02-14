import cron from 'node-cron';
import { hasJournalToday, getLastActivityDate, getSetting } from './db.js';
import { sendReminderEmail, sendInactivityEmail } from './email.js';

let started = false;

export function startCronJobs() {
	if (started) return;
	started = true;

	// Check every hour for reminder/inactivity
	cron.schedule('0 * * * *', async () => {
		try {
			const reminderHour = parseInt(getSetting('reminder_hour') ?? '20', 10);
			const currentHour = new Date().getHours();

			// Daily journal reminder
			if (currentHour === reminderHour && !hasJournalToday()) {
				const enabled = getSetting('reminder_enabled');
				if (enabled !== 'false') {
					await sendReminderEmail();
				}
			}

			// Inactivity check (once a day at reminder hour)
			if (currentHour === reminderHour) {
				const enabled = getSetting('inactivity_enabled');
				if (enabled !== 'false') {
					const inactivityDays = parseInt(getSetting('inactivity_days') ?? '3', 10);
					const lastActivity = getLastActivityDate();
					if (lastActivity) {
						const diffMs = Date.now() - new Date(lastActivity + 'Z').getTime();
						const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
						if (diffDays >= inactivityDays) {
							await sendInactivityEmail(diffDays);
						}
					}
				}
			}
		} catch (err) {
			console.error('[cron] Error:', err);
		}
	});

	console.log('[cron] Notification jobs started');
}
