import { writable } from 'svelte/store';

export interface ToastMessage {
	id: number;
	text: string;
	type: 'success' | 'error' | 'info';
}

let nextId = 0;

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	function add(text: string, type: ToastMessage['type'] = 'info') {
		const id = nextId++;
		update(toasts => [...toasts, { id, text, type }]);
		setTimeout(() => dismiss(id), 4000);
	}

	function dismiss(id: number) {
		update(toasts => toasts.filter(t => t.id !== id));
	}

	return { subscribe, add, dismiss };
}

export const toasts = createToastStore();
