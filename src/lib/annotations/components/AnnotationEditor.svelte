<script lang="ts">
	interface Props {
		selectedText: string;
		onSubmit: (text: string) => void;
		onCancel: () => void;
	}

	let { selectedText, onSubmit, onCancel }: Props = $props();

	let annotationText = $state('');

	function submit() {
		if (!annotationText.trim()) return;
		onSubmit(annotationText.trim());
		annotationText = '';
	}
</script>

<div class="annotation-editor">
	<div class="selected-preview">
		"{selectedText.slice(0, 80)}{selectedText.length > 80 ? '...' : ''}"
	</div>
	<textarea
		bind:value={annotationText}
		placeholder="add your note..."
		onkeydown={(e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				submit();
			}
			if (e.key === 'Escape') {
				onCancel();
			}
		}}
	></textarea>
	<div class="form-buttons">
		<button class="cancel" onclick={onCancel}>cancel</button>
		<button class="submit" onclick={submit}>save</button>
	</div>
</div>

<style>
	.annotation-editor {
		width: 100%;
	}

	.selected-preview {
		font-size: 0.75rem;
		font-style: italic;
		opacity: 0.6;
		margin-bottom: 8px;
		padding: 6px 8px;
		background: rgba(0,0,0,0.05);
		border-radius: 4px;
	}

	textarea {
		width: 100%;
		border: 1px solid var(--accent, #ddd);
		border-radius: 4px;
		padding: 8px;
		font-family: inherit;
		font-size: 0.85rem;
		resize: vertical;
		min-height: 60px;
		background: var(--bg, #fff);
		color: var(--text, #222);
	}

	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 6px;
		margin-top: 8px;
	}

	.form-buttons button {
		padding: 6px 12px;
		border-radius: 4px;
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		border: none;
	}

	.form-buttons .cancel {
		background: rgba(0,0,0,0.1);
		color: var(--text, #222);
	}

	.form-buttons .submit {
		background: var(--accent);
		color: var(--bg, #fff);
	}
</style>
