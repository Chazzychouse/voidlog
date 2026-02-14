import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import { logNotification } from './db.js';

function createTransporter() {
	if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: env.GMAIL_USER,
			pass: env.GMAIL_APP_PASSWORD
		}
	});
}

export async function sendEmail(subject: string, text: string, type: 'reminder' | 'milestone' | 'inactivity') {
	const transporter = createTransporter();
	const to = env.NOTIFY_EMAIL || env.GMAIL_USER;
	if (!transporter || !to) {
		console.log(`[email] Skipped (not configured): ${subject}`);
		return false;
	}

	try {
		await transporter.sendMail({
			from: `"Voidlog" <${env.GMAIL_USER}>`,
			to,
			subject: `[Voidlog] ${subject}`,
			text
		});
		logNotification(type, `${subject}: ${text}`);
		console.log(`[email] Sent: ${subject}`);
		return true;
	} catch (err) {
		console.error('[email] Failed to send:', err);
		return false;
	}
}

export async function sendTestEmail() {
	return sendEmail('Test Notification', 'This is a test email from Voidlog. Your email notifications are working!', 'reminder');
}

export async function sendMilestoneEmail(projectTitle: string, pipelineName: string) {
	return sendEmail(
		'Project Completed!',
		`Congrats! You completed "${projectTitle}" in the ${pipelineName} pipeline.`,
		'milestone'
	);
}

export async function sendReminderEmail() {
	return sendEmail(
		'Daily Journal Reminder',
		"You haven't written a journal entry today. Take a few minutes to reflect on your progress!",
		'reminder'
	);
}

export async function sendInactivityEmail(days: number) {
	return sendEmail(
		'Inactivity Notice',
		`It's been ${days} days since your last journal entry. Don't lose momentum!`,
		'inactivity'
	);
}
