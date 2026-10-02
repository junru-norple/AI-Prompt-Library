#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */
'use strict';

const fs = require('fs');
const path = require('path');
const core = require('../visual-catalog/unified-search-core-v2.js');

function parseArguments(argv) {
  const result = { query: '', maxResults: 5, filters: {} };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--query' || key === '-q') { result.query = value || ''; index += 1; }
    else if (key === '--max-results' || key === '-n') { result.maxResults = Math.max(1, Math.min(12, Number(value || 5))); index += 1; }
    else if (key === '--filters') { result.filters = JSON.parse(value || '{}'); index += 1; }
    else if (key === '--include-blocked') result.filters.include_blocked = true;
  }
  return result;
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.query.trim()) {
    process.stderr.write('Usage: node Search_Unified_Index_V2.js --query "<request>" [--max-results 5] [--filters "{...}"]\n');
    process.exitCode = 2;
    return;
  }
  const indexPath = path.resolve(__dirname, '..', 'indexes', 'unified-index-v2.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/u, ''));
  const personalEntries = index.entries.filter((entry) => entry.source_id === 'personal');
  const personalRanked = core.searchEntries(personalEntries, args.query, args.filters, { limit: 12 });
  const ranked = core.searchEntries(index.entries, args.query, args.filters, { limit: args.maxResults });
  const output = {
    schema_version: '2.0',
    index_content_hash: index.content_hash,
    query: args.query,
    normalized_query: core.normalizeQuery(args.query),
    intent: core.intentRoute(args.query),
    filters: args.filters,
    retrieval_policy: {
      index: 'indexes/unified-index-v2.json',
      personal_searched_first: true,
      personal_candidate_count: personalRanked.length,
      bounded_local_top_n: 12,
      semantic_rerank_scope: 'Codex may rerank only this bounded local candidate pool.',
      final_recommendation_limit: 3,
      unbounded_repository_scan: false
    },
    result_count: ranked.length,
    max_results: args.maxResults,
    results: ranked.map(({ entry, score, matched_terms }) => ({
      rank_score: score,
      matched_terms,
      id: entry.id,
      title: entry.display_title_zh_tw || entry.title,
      content_type: entry.content_type,
      output_type: entry.output_type,
      source_id: entry.source_id,
      source_commit: entry.source_commit,
      relative_path: entry.relative_path,
      license: entry.license,
      license_status: entry.license_status,
      risk_flags: entry.risk_flags || [],
      duplicate_group: entry.duplicate_group,
      public_export_eligible: entry.public_export_eligible,
      execution_level: entry.execution_level,
      example_status: entry.example_status,
      preview_type: entry.preview_type,
      example_path: entry.example_path || '',
      local_artifact_path: entry.local_artifact_path || '',
      selection_eligible: entry.selection_eligible,
      summary_zh_tw: entry.summary_zh_tw
    }))
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { main, parseArguments };
