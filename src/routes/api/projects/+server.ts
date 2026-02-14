import { json } from '@sveltejs/kit';
import { createProject, updateProject, deleteProject, getProject, getPipeline } from '$lib/server/db';
import { sendMilestoneEmail } from '$lib/server/email';

export async function POST({ request }) {
	const { pipeline_id, title, description, difficulty } = await request.json();
	if (!pipeline_id || !title?.trim()) return json({ error: 'Pipeline and title are required' }, { status: 400 });
	const id = await createProject(pipeline_id, title.trim(), description?.trim() ?? '', difficulty ?? 'beginner');
	return json({ id });
}

export async function PUT({ request }) {
	const { id, ...data } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });

	const previousProject = await getProject(id);
	await updateProject(id, data);

	if (data.status === 'completed' && previousProject?.status !== 'completed') {
		const project = await getProject(id);
		const pipeline = project ? await getPipeline(project.pipeline_id) : null;
		if (project && pipeline) {
			sendMilestoneEmail(project.title, pipeline.name).catch(console.error);
		}
	}

	return json({ success: true });
}

export async function DELETE({ request }) {
	const { id } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	await deleteProject(id);
	return json({ success: true });
}
