// Markdown parser/serializer for annotations
import type { Annotation, Reply } from './types';

/**
 * Parse annotations from markdown format:
 *
 * ## "exact quoted text"
 * > prefix: "text before"
 * > suffix: "text after"
 *
 * ### @author · Jan 27, 2026
 * Comment text here
 *
 * #### @replier · Jan 28, 2026
 * Reply text here
 *
 * ---
 */
export function parseAnnotationsMarkdown(markdown: string | null): Annotation[] {
	if (!markdown) return [];

	const annotations: Annotation[] = [];

	// Split by annotation blocks (## headers)
	const blocks = markdown.split(/(?=^## )/m).filter(b => b.trim());

	for (const block of blocks) {
		const annotation = parseAnnotationBlock(block);
		if (annotation) {
			annotations.push(annotation);
		}
	}

	return annotations;
}

function parseAnnotationBlock(block: string): Annotation | null {
	const lines = block.split('\n');

	// First line should be ## "exact text"
	const exactMatch = lines[0]?.match(/^## "(.+)"$/);
	if (!exactMatch) return null;

	const exact = exactMatch[1];
	let prefix = '';
	let suffix = '';

	// Parse prefix/suffix from blockquotes
	let lineIndex = 1;
	while (lineIndex < lines.length) {
		const line = lines[lineIndex];
		const prefixMatch = line.match(/^> prefix: "(.+)"$/);
		const suffixMatch = line.match(/^> suffix: "(.+)"$/);

		if (prefixMatch) {
			prefix = prefixMatch[1];
			lineIndex++;
		} else if (suffixMatch) {
			suffix = suffixMatch[1];
			lineIndex++;
		} else if (line.startsWith('>')) {
			lineIndex++;
		} else {
			break;
		}
	}

	// Parse comments (### headers) and replies (#### headers)
	let mainComment: { author: string; date: number; text: string } | null = null;
	const replies: Reply[] = [];
	let currentText: string[] = [];
	let currentHeader: { author: string; date: number; isReply: boolean } | null = null;

	for (let i = lineIndex; i < lines.length; i++) {
		const line = lines[i];

		// Check for comment header (### @author · date)
		const commentMatch = line.match(/^### @(.+?) · (.+)$/);
		if (commentMatch) {
			// Save previous if exists
			if (currentHeader && currentText.length > 0) {
				const text = currentText.join('\n').trim();
				if (currentHeader.isReply) {
					replies.push({
						id: `reply_${currentHeader.date}_${Math.random().toString(36).slice(2, 6)}`,
						author: currentHeader.author,
						text,
						createdAt: currentHeader.date
					});
				} else {
					mainComment = { author: currentHeader.author, date: currentHeader.date, text };
				}
			}

			currentHeader = {
				author: commentMatch[1],
				date: parseDate(commentMatch[2]),
				isReply: false
			};
			currentText = [];
			continue;
		}

		// Check for reply header (#### @author · date)
		const replyMatch = line.match(/^#### @(.+?) · (.+)$/);
		if (replyMatch) {
			// Save previous if exists
			if (currentHeader && currentText.length > 0) {
				const text = currentText.join('\n').trim();
				if (currentHeader.isReply) {
					replies.push({
						id: `reply_${currentHeader.date}_${Math.random().toString(36).slice(2, 6)}`,
						author: currentHeader.author,
						text,
						createdAt: currentHeader.date
					});
				} else {
					mainComment = { author: currentHeader.author, date: currentHeader.date, text };
				}
			}

			currentHeader = {
				author: replyMatch[1],
				date: parseDate(replyMatch[2]),
				isReply: true
			};
			currentText = [];
			continue;
		}

		// Skip separators
		if (line === '---') continue;

		// Accumulate text
		if (currentHeader) {
			currentText.push(line);
		}
	}

	// Save final comment/reply
	if (currentHeader && currentText.length > 0) {
		const text = currentText.join('\n').trim();
		if (currentHeader.isReply) {
			replies.push({
				id: `reply_${currentHeader.date}_${Math.random().toString(36).slice(2, 6)}`,
				author: currentHeader.author,
				text,
				createdAt: currentHeader.date
			});
		} else {
			mainComment = { author: currentHeader.author, date: currentHeader.date, text };
		}
	}

	if (!mainComment) return null;

	return {
		id: `ann_${mainComment.date}_${Math.random().toString(36).slice(2, 6)}`,
		target: {
			selectors: [
				{
					type: 'TextQuoteSelector',
					exact,
					prefix: prefix || undefined,
					suffix: suffix || undefined
				}
			]
		},
		body: {
			text: mainComment.text,
			author: mainComment.author,
			createdAt: mainComment.date
		},
		replies
	};
}

function parseDate(dateStr: string): number {
	const parsed = new Date(dateStr);
	return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
}

/**
 * Serialize annotations to markdown format
 */
export function serializeAnnotationsMarkdown(annotations: Annotation[]): string {
	if (annotations.length === 0) return '';

	const lines: string[] = ['# Annotations', ''];

	for (const ann of annotations) {
		const selector = ann.target.selectors.find(s => s.type === 'TextQuoteSelector');
		if (!selector || selector.type !== 'TextQuoteSelector' || !selector.exact) continue;

		// Annotation header
		lines.push(`## "${selector.exact}"`);

		// Prefix/suffix context
		if (selector.prefix) {
			lines.push(`> prefix: "${selector.prefix}"`);
		}
		if (selector.suffix) {
			lines.push(`> suffix: "${selector.suffix}"`);
		}
		lines.push('');

		// Main comment
		lines.push(`### @${ann.body.author} · ${formatDate(ann.body.createdAt)}`);
		lines.push(ann.body.text);
		lines.push('');

		// Replies
		for (const reply of ann.replies || []) {
			lines.push(`#### @${reply.author} · ${formatDate(reply.createdAt)}`);
			lines.push(reply.text);
			lines.push('');
		}

		lines.push('---');
		lines.push('');
	}

	return lines.join('\n');
}

export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
