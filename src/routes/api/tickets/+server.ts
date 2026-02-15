import { json } from '@sveltejs/kit';
import { createTicket, updateTicket, deleteTicket } from '$lib/server/db';

export async function POST({ request }) {
	const { project_id, title, description, priority } = await request.json();
	if (!project_id || !title?.trim()) return json({ error: 'Project and title are required' }, { status: 400 });
	const id = await createTicket(project_id, title.trim(), description?.trim() ?? '', priority ?? 'medium');
	return json({ id });
}

export async function PUT({ request }) {
	const { id, ...data } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await updateTicket(id, data);
	return json({ success: true });
}

export async function DELETE({ request }) {
	const { id } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await deleteTicket(id);
	return json({ success: true });
}
