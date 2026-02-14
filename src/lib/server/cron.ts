import cron from 'node-cron';
import { hasJournalToday, getLastActivityDate, getSetting } from './db.js';
import { sendReminderEmail, sendInactivityEmail } from './email.js';

let started = false;

export function startCronJobs() {
	if (started) return;
	started = true;

	cron.schedule('0 * * * *', async () => {
		try {
			const reminderHour = parseInt((await getSetting('reminder_hour')) ?? '20', 10);
			const currentHour = new Date().getHours();

			if (currentHour === reminderHour && !(await hasJournalToday())) {
				const enabled = await getSetting('reminder_enabled');
				if (enabled !== 'false') {
					await sendReminderEmail();
				}
			}

			if (currentHour === reminderHour) {
				const enabled = await getSetting('inactivity_enabled');
				if (enabled !== 'false') {
					const inactivityDays = parseInt((await getSetting('inactivity_days')) ?? '3', 10);
					const lastActivity = await getLastActivityDate();
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
