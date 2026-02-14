import { json } from '@sveltejs/kit';
import { createProject, updateProject, deleteProject, getProject, getPipeline } from '$lib/server/db';
import { sendMilestoneEmail } from '$lib/server/email';

export async function POST({ request }) {
	const { pipeline_id, title, description, difficulty } = await request.json();
	if (!pipeline_id || !title?.trim()) return json({ error: 'Pipeline and title are required' }, { status: 400 });
	const id = createProject(pipeline_id, title.trim(), description?.trim() ?? '', difficulty ?? 'beginner');
	return json({ id });
}

export async function PUT({ request }) {
	const { id, ...data } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });

	const previousProject = getProject(id);
	updateProject(id, data);

	// Send milestone email when project is completed
	if (data.status === 'completed' && previousProject?.status !== 'completed') {
		const project = getProject(id);
		const pipeline = project ? getPipeline(project.pipeline_id) : null;
		if (project && pipeline) {
			sendMilestoneEmail(project.title, pipeline.name).catch(console.error);
		}
	}

	return json({ success: true });
}

export async function DELETE({ request }) {
	const { id } = await request.json();
	if (!id) return json({ error: 'ID is required' }, { status: 400 });
	deleteProject(id);
	return json({ success: true });
}
