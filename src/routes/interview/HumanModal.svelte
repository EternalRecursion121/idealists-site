<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { HumanRequestPayload } from '$lib/interviewer-client';

	interface Props {
		/** name typed on the welcome screen, used to prefill */
		prefillName?: string;
		requestHuman: (payload: HumanRequestPayload) => Promise<unknown>;
		onclose: () => void;
	}

	let { prefillName = '', requestHuman, onclose }: Props = $props();

	// the modal is mounted fresh each time it opens, so the name typed on the
	// welcome screen (if any) is simply the starting value
	let name = $state(untrack(() => prefillName));
	let contact = $state('');
	let note = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	let modalEl: HTMLDivElement | null = $state(null);
	let opener: HTMLElement | null = null;

	onMount(() => {
		// remember what opened us and move focus into the dialog so Escape and
		// Tab work from the keyboard; hand focus back on close
		opener = document.activeElement as HTMLElement | null;
		tick().then(() => modalEl?.focus());
		return () => {
			opener?.focus();
			opener = null;
		};
	});

	async function submit() {
		if (!contact.trim()) {
			error = 'an email or discord handle, please.';
			return;
		}
		submitting = true;
		error = '';
		try {
			await requestHuman({
				name: name.trim() || null,
				contact: contact.trim(),
				note: note.trim() || null
			});
			submitted = true;
		} catch (e) {
			error =
				e instanceof TypeError
					? "couldn't reach us right now. try again in a moment."
					: e instanceof Error
						? e.message
						: 'something went wrong.';
		} finally {
			submitting = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={onclose}
	onkeydown={onKeydown}
	transition:fade={{ duration: 180 }}
>
	<div
		bind:this={modalEl}
		class="modal"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="human-modal-title"
		onclick={(e) => e.stopPropagation()}
		onkeydown={onKeydown}
		in:fly={{ y: 12, duration: 240 }}
	>
		{#if submitted}
			<h2 id="human-modal-title" class="modal-title">noted.</h2>
			<p class="modal-lede">
				a human from the collective will reach out. it might take a day or two — we're
				small.
			</p>
			<div class="modal-actions">
				<button class="modal-primary" onclick={onclose}>close</button>
			</div>
		{:else}
			<h2 id="human-modal-title" class="modal-title">talk to a human</h2>
			<p class="modal-lede">
				leave a name and a way to reach you. someone in the collective will follow up.
			</p>

			<label class="modal-field">
				<span class="modal-field-label">name <em>· optional</em></span>
				<input
					class="modal-input"
					type="text"
					bind:value={name}
					placeholder="what should we call you?"
					spellcheck="false"
					autocomplete="name"
					disabled={submitting}
				/>
			</label>

			<label class="modal-field">
				<span class="modal-field-label">email or discord</span>
				<input
					class="modal-input"
					type="text"
					bind:value={contact}
					placeholder="you@example.com  ·  or @yourhandle"
					spellcheck="false"
					autocomplete="email"
					disabled={submitting}
				/>
			</label>

			<label class="modal-field">
				<span class="modal-field-label">anything to add <em>· optional</em></span>
				<textarea
					class="modal-input modal-textarea"
					bind:value={note}
					placeholder="what you'd like to talk about, or how you came across this"
					rows="3"
					disabled={submitting}
				></textarea>
			</label>

			{#if error}
				<p class="error" in:fade>{error}</p>
			{/if}

			<div class="modal-actions">
				<button class="modal-secondary" onclick={onclose} disabled={submitting}>cancel</button>
				<button class="modal-primary" onclick={submit} disabled={submitting}>
					{submitting ? 'sending' : 'send'}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, #000 55%, transparent);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 50;
	}

	.modal {
		width: 100%;
		max-width: 32rem;
		background: var(--bg, #fff);
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 4px;
		padding: 2rem 2rem 1.75rem;
		box-shadow: 0 24px 60px color-mix(in srgb, #000 30%, transparent);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* the dialog container takes focus only so keys work; it isn't a control */
	.modal:focus {
		outline: none;
	}

	.modal-title {
		font-family: var(--font-display);
		font-weight: 500;
		font-size: 1.7rem;
		line-height: 1.1;
		margin: 0;
		color: var(--heading);
	}

	.modal-lede {
		font-size: 0.95rem;
		line-height: 1.55;
		opacity: 0.78;
		margin: -0.25rem 0 0.25rem;
	}

	.modal-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.modal-field-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
		color: var(--heading);
	}

	.modal-field-label em {
		opacity: 0.65;
		font-style: italic;
		letter-spacing: 0.04em;
	}

	.modal-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.4;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
		border-radius: 2px;
		color: var(--text);
		outline: none;
		transition: border-color 0.15s;
	}

	.modal-input:focus {
		border-color: var(--accent);
	}

	.modal-input::placeholder {
		opacity: 0.35;
	}

	.modal-textarea {
		resize: vertical;
		min-height: 4.5rem;
		font-family: inherit;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.modal-secondary,
	.modal-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1.5rem 0.8rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		line-height: 1;
		background: transparent;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.modal-secondary {
		border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
		color: var(--text);
		opacity: 0.7;
	}

	.modal-secondary:hover:not(:disabled) {
		opacity: 1;
		border-color: var(--text);
	}

	.modal-primary {
		border: 1px solid var(--accent);
		color: var(--accent);
	}

	.modal-primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}

	.modal-secondary:disabled,
	.modal-primary:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.error {
		color: color-mix(in srgb, var(--accent) 70%, #c44 30%);
		font-size: 0.9rem;
	}
</style>
