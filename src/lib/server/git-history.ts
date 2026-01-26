import { diffLines } from 'diff';
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } from '$env/static/private';
import type { Revision, RevisionWithDiff, DiffResult, DiffLine } from '$lib/types/writing';

const WRITINGS_DIR = 'src/lib/writings';

// Map current paths to their previous paths (for tracking renames)
const PATH_RENAMES: Record<string, string[]> = {
	'src/lib/writings/i-want-to-write-code-like-im-playing-jazz/content.md': [
		'src/lib/writings/i want to write code like im playing jazz/content.md'
	]
};

const headers: HeadersInit = {
	'Accept': 'application/vnd.github.v3+json',
	'User-Agent': 'idealists-site',
	...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {})
};

export async function getWritingSlugs(): Promise<string[]> {
	try {
		const res = await fetch(
			`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${WRITINGS_DIR}`,
			{ headers }
		);

		if (!res.ok) return [];

		const contents = await res.json();
		return contents
			.filter((item: { type: string }) => item.type === 'dir')
			.map((item: { name: string }) => item.name);
	} catch {
		return [];
	}
}

export function getWritingPath(slug: string): string {
	return `${WRITINGS_DIR}/${slug}/content.md`;
}

async function getFileHistoryForPath(filePath: string): Promise<Revision[]> {
	try {
		const res = await fetch(
			`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${encodeURIComponent(filePath)}`,
			{ headers }
		);

		if (!res.ok) return [];

		const commits = await res.json();

		return commits.map((commit: {
			sha: string;
			commit: {
				author: { name: string; date: string };
				message: string;
			};
		}) => ({
			hash: commit.sha,
			shortHash: commit.sha.slice(0, 7),
			date: commit.commit.author.date,
			author: commit.commit.author.name,
			message: commit.commit.message.split('\n')[0] // First line only
		}));
	} catch {
		return [];
	}
}

export async function getFileHistory(filePath: string): Promise<Revision[]> {
	// Get all paths to check (current + any previous paths from renames)
	const allPaths = [filePath, ...(PATH_RENAMES[filePath] || [])];

	// Fetch history for all paths in parallel
	const histories = await Promise.all(allPaths.map(getFileHistoryForPath));

	// Merge and dedupe by commit hash, sort by date descending
	const seen = new Set<string>();
	const merged: Revision[] = [];

	for (const history of histories) {
		for (const rev of history) {
			if (!seen.has(rev.hash)) {
				seen.add(rev.hash);
				merged.push(rev);
			}
		}
	}

	return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getFileAtCommit(hash: string, filePath: string): Promise<string | null> {
	// Get all paths to try (current + any previous paths from renames)
	const allPaths = [filePath, ...(PATH_RENAMES[filePath] || [])];

	for (const path of allPaths) {
		try {
			const res = await fetch(
				`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${hash}`,
				{ headers }
			);

			if (!res.ok) continue;

			const data = await res.json();

			// Content is base64 encoded - decode properly for UTF-8
			if (data.content && data.encoding === 'base64') {
				const binary = atob(data.content.replace(/\n/g, ''));
				const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
				return new TextDecoder('utf-8').decode(bytes);
			}
		} catch {
			continue;
		}
	}

	return null;
}

export function computeDiff(oldContent: string, newContent: string): DiffResult {
	const changes = diffLines(oldContent, newContent);

	const lines: DiffLine[] = [];
	let oldLineNumber = 1;
	let newLineNumber = 1;
	let additions = 0;
	let deletions = 0;

	for (const change of changes) {
		const changeLines = change.value.split('\n');
		if (changeLines[changeLines.length - 1] === '') {
			changeLines.pop();
		}

		for (const line of changeLines) {
			if (change.added) {
				lines.push({
					type: 'add',
					content: line,
					newLineNumber: newLineNumber++
				});
				additions++;
			} else if (change.removed) {
				lines.push({
					type: 'remove',
					content: line,
					oldLineNumber: oldLineNumber++
				});
				deletions++;
			} else {
				lines.push({
					type: 'context',
					content: line,
					oldLineNumber: oldLineNumber++,
					newLineNumber: newLineNumber++
				});
			}
		}
	}

	return { lines, additions, deletions };
}

export async function getWritingWithRevisions(slug: string): Promise<RevisionWithDiff[]> {
	const filePath = getWritingPath(slug);
	const history = await getFileHistory(filePath);

	if (history.length === 0) {
		return [];
	}

	const revisions: RevisionWithDiff[] = [];

	// Fetch content for all revisions
	const contents: (string | null)[] = await Promise.all(
		history.map((rev) => getFileAtCommit(rev.hash, filePath))
	);

	// Process from oldest to newest for diff computation
	for (let i = history.length - 1; i >= 0; i--) {
		const revision = history[i];
		const content = contents[i];

		if (content === null) continue;

		const prevContent = i < history.length - 1 ? contents[i + 1] : '';
		const diff = prevContent !== null ? computeDiff(prevContent || '', content) : undefined;

		revisions.unshift({
			...revision,
			content,
			diff
		});
	}

	return revisions;
}

export function extractFrontmatter(content: string): { title?: string; description?: string; authors?: string[]; body: string } {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

	if (!frontmatterMatch) {
		const headingMatch = content.match(/^#\s+(.+)$/m);
		return {
			title: headingMatch?.[1],
			body: content
		};
	}

	const [, frontmatter, body] = frontmatterMatch;
	const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
	const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);

	// Parse authors - supports multiple formats:
	// 1. Single author: author: Name
	// 2. Comma-separated: authors: Name1, Name2
	// 3. YAML array: authors:\n  - Name1\n  - Name2
	let authors: string[] | undefined;

	// Try YAML array format first
	const yamlArrayMatch = frontmatter.match(/^authors:\s*\n((?:\s+-\s*.+\n?)+)/m);
	if (yamlArrayMatch) {
		authors = yamlArrayMatch[1]
			.split('\n')
			.map(line => line.replace(/^\s*-\s*/, '').trim())
			.filter(Boolean);
	} else {
		// Try single line (authors: or author:)
		const authorsMatch = frontmatter.match(/^authors?:\s*["']?(.+?)["']?\s*$/m);
		if (authorsMatch) {
			authors = authorsMatch[1].split(/,\s*/).map(a => a.trim()).filter(Boolean);
		}
	}

	return {
		title: titleMatch?.[1],
		description: descMatch?.[1],
		authors: authors?.length ? authors : undefined,
		body: body.trim()
	};
}
