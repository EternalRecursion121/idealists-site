<script lang="ts">
	import type { Annotation, Reply } from '../types';
	import { formatDate } from '../parser';

	interface Props {
		annotation: Annotation;
		username: string;
		onReply: (text: string) => void;
		onClose: () => void;
		onRequestUsername: () => string | null;
	}

	let { annotation, username, onReply, onClose, onRequestUsername }: Props = $props();

	let showReplyForm = $state(false);
	let replyText = $state('');

	function submitReply() {
		if (!replyText.trim()) return;

		// Ensure we have a username
		let name = username;
		if (!name) {
			name = onRequestUsername() || '';
			if (!name) return;
		}

		onReply(replyText.trim());
		replyText = '';
		showReplyForm = false;
	}

	function openReplyForm() {
		let name = username;
		if (!name) {
			name = onRequestUsername() || '';
			if (!name) return;
		}
		showReplyForm = true;
	}
</script>

<div class="annotation-thread">
	<button class="close" onclick={onClose}>×</button>

	<!-- Main comment -->
	<div class="comment-thread">
		<div class="comment main-comment">
			<div class="author">{annotation.body.author}</div>
			<div class="time">{formatDate(annotation.body.createdAt)}</div>
			<div class="text">{annotation.body.text}</div>
		</div>

		<!-- Replies -->
		{#if annotation.replies && annotation.replies.length > 0}
			<div class="replies">
				{#each annotation.replies as reply}
					<div class="comment reply">
						<div class="author">{reply.author}</div>
						<div class="time">{formatDate(reply.createdAt)}</div>
						<div class="text">{reply.text}</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Reply form -->
		{#if showReplyForm}
			<div class="reply-form">
				<textarea
					bind:value={replyText}
					placeholder="write a reply..."
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							submitReply();
						}
						if (e.key === 'Escape') {
							showReplyForm = false;
							replyText = '';
						}
					}}
				></textarea>
				<div class="form-buttons">
					<button class="cancel" onclick={() => { showReplyForm = false; replyText = ''; }}>cancel</button>
					<button class="submit" onclick={submitReply}>reply</button>
				</div>
			</div>
		{:else}
			<button class="reply-btn" onclick={openReplyForm}>reply</button>
		{/if}
	</div>
</div>

<style>
	.annotation-thread {
		position: relative;
	}

	.close {
		position: absolute;
		top: -6px;
		right: -4px;
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: var(--text, #999);
		opacity: 0.5;
	}

	.close:hover {
		opacity: 1;
	}

	.comment-thread {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.comment {
		padding-bottom: 8px;
	}

	.comment:not(:last-child) {
		border-bottom: 1px solid rgba(0,0,0,0.1);
	}

	.comment .author {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--accent);
	}

	.comment .time {
		font-size: 0.7rem;
		opacity: 0.5;
		margin-bottom: 4px;
	}

	.comment .text {
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.replies {
		padding-left: 12px;
		border-left: 2px solid rgba(0,0,0,0.1);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.reply {
		font-size: 0.9em;
	}

	.reply-btn {
		background: none;
		border: 1px solid var(--accent, #ddd);
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--text, #666);
	}

	.reply-btn:hover {
		background: rgba(0,0,0,0.05);
	}

	.reply-form {
		margin-top: 8px;
	}

	.reply-form textarea {
		width: 100%;
		border: 1px solid var(--accent, #ddd);
		border-radius: 4px;
		padding: 8px;
		font-family: inherit;
		font-size: 0.85rem;
		resize: vertical;
		min-height: 40px;
		background: var(--bg, #fff);
		color: var(--text, #222);
	}

	.reply-form textarea:focus {
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
