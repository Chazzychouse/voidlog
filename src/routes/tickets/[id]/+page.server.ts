import { error } from '@sveltejs/kit';
import { getTicket, getTasksByTicket, getJournalsByTicket } from '$lib/server/db';

export async function load({ params }) {
	const ticket = await getTicket(Number(params.id));
	if (!ticket) throw error(404, 'Ticket not found');
	const [tasks, journals] = await Promise.all([
		getTasksByTicket(ticket.id),
		getJournalsByTicket(ticket.id)
	]);
	return { ticket, tasks, journals };
}
