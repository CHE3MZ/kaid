// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

/* Docs content index — imports the English markdown files and provides lookup by slug */

import quickstart from './en/quickstart.md';
import installation from './en/installation.md';
import configuration from './en/configuration.md';
import chatGPTPreview from './en/chatgpt-preview.md';
import cliReference from './en/cli-reference.md';
import reviewRules from './en/review-rules.md';
import architecture from './en/architecture.md';
import tools from './en/tools.md';
import mcp from './en/mcp.md';
import viewer from './en/viewer.md';
import telemetry from './en/telemetry.md';
import cicd from './en/integrations/ci.md';
import delegate from './en/integrations/delegate.md';
import acp from './en/integrations/acp.md';
import faq from './en/faq.md';

export type DocSlug =
  | 'quickstart'
  | 'installation'
  | 'configuration'
  | 'cli-reference'
  | 'review-rules'
  | 'architecture'
  | 'tools'
  | 'mcp'
  | 'viewer'
  | 'telemetry'
  | 'cicd'
  | 'delegate'
  | 'acp'
  | 'faq'
  | 'chatgpt-preview';

const docs: Record<DocSlug, string> = {
  'quickstart': quickstart,
  'installation': installation,
  'configuration': configuration,
  'chatgpt-preview': chatGPTPreview,
  'cli-reference': cliReference,
  'review-rules': reviewRules,
  'architecture': architecture,
  'tools': tools,
  'mcp': mcp,
  'viewer': viewer,
  'telemetry': telemetry,
  'cicd': cicd,
  'delegate': delegate,
  'acp': acp,
  'faq': faq,
};

/**
 * Strip YAML frontmatter from markdown content
 */
function stripFrontmatter(md: string): string {
  if (md.startsWith('---')) {
    const end = md.indexOf('---', 3);
    if (end !== -1) {
      return md.slice(end + 3).trim();
    }
  }
  return md;
}

/**
 * Get the markdown content for a given doc slug.
 */
export function getDocContent(slug: DocSlug): string {
  return stripFrontmatter(docs[slug] ?? '');
}

/**
 * Get the title from frontmatter
 */
export function getDocTitle(slug: DocSlug): string {
  const raw = docs[slug] ?? '';
  if (raw.startsWith('---')) {
    const end = raw.indexOf('---', 3);
    if (end !== -1) {
      const fm = raw.slice(3, end);
      const match = fm.match(/title:\s*(.+)/);
      if (match) return match[1].trim();
    }
  }
  return slug;
}

/**
 * Search across all docs for a query string. Returns matching slugs with context.
 */
export function searchDocs(query: string): { slug: DocSlug; title: string; snippet: string }[] {
  if (!query.trim()) return [];
  const results: { slug: DocSlug; title: string; snippet: string }[] = [];
  const lowerQuery = query.toLowerCase();
  const slugs = Object.keys(docs) as DocSlug[];
  for (const slug of slugs) {
    const content = stripFrontmatter(docs[slug] ?? '');
    const lowerContent = content.toLowerCase();
    const idx = lowerContent.indexOf(lowerQuery);
    if (idx !== -1) {
      // Extract snippet around match
      const start = Math.max(0, idx - 30);
      const end = Math.min(content.length, idx + query.length + 60);
      let snippet = content.slice(start, end).replace(/[#*_`[\]()]/g, '').replace(/\n/g, ' ').trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';
      const title = getDocTitle(slug);
      results.push({ slug, title, snippet });
    }
  }
  return results;
}
