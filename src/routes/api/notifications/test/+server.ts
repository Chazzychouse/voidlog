import { json } from '@sveltejs/kit';
import { sendTestEmail } from '$lib/server/email';

export async function POST() {
	const sent = await sendTestEmail();
	return json({ sent });
}
