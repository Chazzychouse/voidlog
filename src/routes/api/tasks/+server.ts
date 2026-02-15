import { json } from '@sveltejs/kit';
import { createTask, updateTask, deleteTask } from '$lib/server/db';

export async function POST({ request }) {
	const { ticket_id, title } = await request.json();
	if (!ticket_id || !title?.trim()) return json({ error: 'Ticket and title are required' }, { status: 400 });
	const id = await createTask(ticket_id, title.trim());
	return json({ id });
}

export async function PUT({ request }) {
	const { id, ...data } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await updateTask(id, data);
	return json({ success: true });
}

export async function DELETE({ request }) {
	const { id } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await deleteTask(id);
	return json({ success: true });
}
