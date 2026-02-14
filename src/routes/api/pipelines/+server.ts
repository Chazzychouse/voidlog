import { json } from '@sveltejs/kit';
import { createPipeline, updatePipeline, deletePipeline } from '$lib/server/db';

export async function POST({ request }) {
	const { name, description } = await request.json();
	if (!name?.trim()) return json({ error: 'Name is required' }, { status: 400 });
	const id = await createPipeline(name.trim(), description?.trim() ?? '');
	return json({ id });
}

export async function PUT({ request }) {
	const { id, name, description } = await request.json();
	if (!id || !name?.trim()) return json({ error: 'ID and name are required' }, { status: 400 });
	await updatePipeline(id, name.trim(), description?.trim() ?? '');
	return json({ success: true });
}

export async function DELETE({ request }) {
	const { id } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await deletePipeline(id);
	return json({ success: true });
}
