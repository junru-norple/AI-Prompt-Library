/* SPDX-License-Identifier: MIT */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UnifiedSearchCoreV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SYNONYMS = Object.freeze({
    '網站': ['web', 'website', 'web-page', 'landing page'],
    '網頁': ['web', 'website', 'web-page', 'landing page'],
    '首頁': ['homepage', 'landing page', 'web-page'],
    '落地頁': ['landing page', 'web-page'],
    '元件': ['ui', 'component', 'ui-component'],
    '組件': ['ui', 'component', 'ui-component'],
    '介面': ['ui', 'component'],
    '動畫': ['animation', 'motion', 'motion-effect'],
    '動效': ['animation', 'motion', 'motion-effect'],
    '滾動': ['scroll', 'scroll animation', 'motion-effect'],
    '滑入': ['slide', 'text reveal', 'transition'],
    '文字': ['text', 'typography'],
    '電影感': ['cinematic', 'motion', 'dark'],
    '極簡': ['minimal', 'clean'],
    '奢華': ['luxury', 'premium'],
    '精品': ['luxury', 'premium'],
    '野獸派': ['brutalist'],
    '編輯感': ['editorial', 'magazine'],
    '雜誌': ['magazine', 'editorial'],
    '文章頁': ['article', 'web-page'],
    '儀表板': ['dashboard', 'data interface'],
    '控制台': ['dashboard', 'control panel'],
    '簡報': ['ppt', 'pptx', 'powerpoint', 'presentation'],
    '投影片': ['slide', 'pptx', 'presentation'],
    '專案': ['project', 'project status'],
    '報告': ['report', 'review', 'annual report'],
    '醫療': ['medical', 'clinical', 'healthcare'],
    '圖片': ['image', 'photo', 'illustration'],
    '影像': ['image', 'video'],
    '放大': ['upscale', 'enhance', 'super resolution'],
    '工作流': ['workflow', 'comfy-workflow'],
    '節點': ['node', 'workflow', 'comfyui'],
    '影片': ['video', 'film'],
    '音訊': ['audio', 'sound'],
    '音樂': ['audio', 'music'],
    '設計系統': ['design system', 'design-system', 'tokens'],
    '技能': ['skill', 'agent skill'],
    'github 個人頁': ['github profile', 'readme'],
    'github profile': ['github-profile', 'readme'],
    'readme': ['github', 'github-profile', 'readme'],
    '離線': ['offline', 'ready_offline'],
    '純 css': ['css', 'pure css'],
    'react': ['react', 'component'],
    'comfyui': ['comfyui', 'workflow', 'comfy-workflow']
  });

  const STOP_WORDS = new Set([
    '我', '想', '要', '做', '一個', '一个', '有', '的', '請', '请', '幫我', '帮我', '找', '需要',
    'make', 'create', 'build', 'find', 'want', 'need', 'please', 'a', 'an', 'the', 'for', 'with', 'and', 'or', 'to', 'of'
  ]);

  const ROUTES = Object.freeze([
    { intent: 'comfy-workflow', pattern: /comfy|workflow|工作流|節點|节点|放大|upscale/u, outputs: ['comfy-workflow'] },
    { intent: 'ppt', pattern: /pptx?|powerpoint|presentation|slide deck|簡報|简报|投影片/u, outputs: ['pptx'] },
    { intent: 'github-profile', pattern: /github|readme|個人頁|个人页/u, outputs: ['github-profile', 'readme'] },
    { intent: 'design-system', pattern: /design system|design-system|設計系統|设计系统|tokens?/u, outputs: ['web-page', 'ui-component'] },
    { intent: 'skill', pattern: /agent skill|\bskill\b|技能/u, outputs: ['analysis-text', 'code-project', 'other'] },
    { intent: 'prompt', pattern: /\bprompts?\b|提示詞|提示词|提示語|提示语/u, outputs: ['analysis-text', 'structured-data', 'code-project', 'image'] },
    { intent: 'dashboard', pattern: /dashboard|儀表板|仪表板|控制台/u, outputs: ['web-page', 'ui-component'] },
    { intent: 'motion', pattern: /motion|animation|scroll|hover|reveal|動效|动画|動畫|滾動|滚动|滑入/u, outputs: ['motion-effect', 'ui-component'] },
    { intent: 'ui', pattern: /\bui\b|component|button|form|card|元件|组件|組件|介面/u, outputs: ['ui-component', 'motion-effect'] },
    { intent: 'web', pattern: /web|website|landing|homepage|article|magazine|網站|网頁|網頁|首頁|落地|文章頁|雜誌/u, outputs: ['web-page', 'ui-component'] },
    { intent: 'image', pattern: /image|photo|illustration|圖片|图像|影像|插畫/u, outputs: ['image', 'comfy-workflow'] },
    { intent: 'video-audio-3d', pattern: /video|audio|music|3d|影片|音訊|音频|音樂|模型/u, outputs: ['video', 'audio', '3d', 'comfy-workflow'] }
  ]);

  const asArray = (value) => Array.isArray(value) ? value : [];
  const SEARCH_FIELD_CACHE = new WeakMap();

  function normalizeQuery(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLocaleLowerCase('zh-Hant')
      .replace(/[’']/g, '')
      .replace(/[^\p{L}\p{N}+#.\-]+/gu, ' ')
      .trim();
  }

  function expandQuery(value) {
    const normalized = normalizeQuery(value);
    const expanded = [normalized];
    for (const [phrase, replacements] of Object.entries(SYNONYMS)) {
      if (normalized.includes(normalizeQuery(phrase))) expanded.push(...replacements);
    }
    return normalizeQuery(expanded.join(' '));
  }

  function queryTerms(value) {
    const original = normalizeQuery(value);
    const expanded = expandQuery(value);
    const tokens = expanded.split(/\s+/).filter((term) => term && !STOP_WORDS.has(term));
    for (const phrase of Object.keys(SYNONYMS)) {
      const normalizedPhrase = normalizeQuery(phrase);
      if (normalizedPhrase && original.includes(normalizedPhrase)) tokens.push(normalizedPhrase);
    }
    return [...new Set(tokens)].slice(0, 32);
  }

  function intentRoute(value) {
    const expanded = expandQuery(value);
    const route = ROUTES.find((candidate) => candidate.pattern.test(expanded));
    return route ? { intent: route.intent, output_types: [...route.outputs] } : { intent: 'general', output_types: [] };
  }

  function normalizedArray(value) {
    return asArray(value).map(normalizeQuery);
  }

  function exactArrayMatch(value, expected) {
    if (!expected) return true;
    const needle = normalizeQuery(expected);
    return normalizedArray(value).includes(needle);
  }

  function matchesFilters(entry, filters = {}) {
    if (filters.content_type && entry.content_type !== filters.content_type) return false;
    if (filters.output_type && entry.output_type !== filters.output_type) return false;
    if (filters.style && !exactArrayMatch(entry.style_tags, filters.style)) return false;
    if (filters.interaction && !exactArrayMatch(entry.interaction_tags, filters.interaction)) return false;
    if (filters.technology && !exactArrayMatch(entry.technology_stack, filters.technology)) return false;
    if (filters.source && entry.source_id !== filters.source) return false;
    if (filters.license && normalizeQuery(entry.license) !== normalizeQuery(filters.license) && entry.license_status !== filters.license) return false;
    if (filters.offline && entry.offline_status !== filters.offline) return false;
    if (filters.execution_level && entry.execution_level !== filters.execution_level) return false;
    if (filters.example_status && entry.example_status !== filters.example_status) return false;
    if (filters.preview_available === 'yes' && (!entry.example_path || ['none', 'metadata-only'].includes(entry.preview_type))) return false;
    if (filters.preview_available === 'no' && entry.example_path && !['none', 'metadata-only'].includes(entry.preview_type)) return false;
    return true;
  }

  function licenseUsability(entry) {
    const status = String(entry.license_status || '');
    if (/^verified(?:$|[-_])/i.test(status)) return 5;
    if (/review_required/i.test(status)) return -10;
    if (/blocked|unavailable|conflict/i.test(status)) return -18;
    return -5;
  }

  function fieldScore(text, terms, weight) {
    let score = 0;
    let hits = 0;
    for (const term of terms) {
      if (term.length < 2) continue;
      if (text.includes(term)) {
        score += weight;
        hits += 1;
      }
    }
    return { score, hits };
  }

  function queryConcepts(normalizedQuery) {
    const concepts = [];
    for (const [phrase, replacements] of Object.entries(SYNONYMS)) {
      const concept = normalizeQuery(phrase);
      if (!concept || !normalizedQuery.includes(concept)) continue;
      concepts.push([concept, ...replacements.map(normalizeQuery)]);
    }
    return concepts;
  }

  const RELEVANCE_SYNONYMS = Object.entries(SYNONYMS).map(([phrase, alternatives]) =>
    [...new Set([phrase, ...alternatives].map(normalizeQuery))]);

  function aliasInQuery(query, alias, onMatch) {
    // Latin aliases are words: "ui" must not match "build", or "react"
    // match "reaction". Chinese aliases can occur without whitespace.
    let offset = query.indexOf(alias);
    let matched = false;
    while (offset >= 0) {
      const before = query[offset - 1] || '';
      const after = query[offset + alias.length] || '';
      if (!(/[a-z0-9]/u.test(alias[0]) && /[a-z0-9]/u.test(before))
        && !(/[a-z0-9]/u.test(alias[alias.length - 1]) && /[a-z0-9]/u.test(after))) {
        if (!onMatch) return true;
        onMatch(offset, alias.length);
        matched = true;
      }
      offset = query.indexOf(alias, offset + 1);
    }
    return matched;
  }

  function relevanceConcepts(query) {
    const groups = [];
    const consumed = new Uint8Array(query.length);
    const mark = (start, length) => consumed.fill(1, start, start + length);
    for (const alternatives of RELEVANCE_SYNONYMS) {
      let matched = false;
      for (const alias of alternatives) if (aliasInQuery(query, alias, mark)) matched = true;
      if (!matched) continue;
      const combined = new Set(alternatives);
      // Aliases such as presentation/PPTX belong to one concept even when
      // several dictionary entries mention them. Merge intersecting groups.
      for (let index = groups.length - 1; index >= 0; index -= 1) {
        if (!groups[index].some((alias) => combined.has(alias))) continue;
        for (const alias of groups.splice(index, 1)[0]) combined.add(alias);
      }
      groups.push([...combined]);
    }
    for (const word of STOP_WORDS) aliasInQuery(query, word, mark);
    // Unknown subject words must not disappear: a partial dictionary match
    // cannot claim that the complete request was understood in either language.
    let offset = 0;
    for (const character of query) {
      if (!consumed[offset] && /[\p{L}\p{N}]/u.test(character)) return [];
      offset += character.length;
    }
    return groups;
  }

  function conceptMatchScore(fields, concepts, containsTerm) {
    let score = 0;
    for (const alternatives of concepts) {
      if (alternatives.some((term) => term.length > 1 && containsTerm(fields, term))) score += 18;
    }
    return Math.min(72, score);
  }

  function searchFields(entry) {
    const cached = SEARCH_FIELD_CACHE.get(entry);
    if (cached) return cached;
    const title = normalizeQuery(`${entry.title || ''} ${entry.display_title_zh_tw || ''}`);
    const facets = normalizeQuery([entry.content_type, entry.output_type, entry.semantic_cluster, ...asArray(entry.tags), ...asArray(entry.bilingual_search_terms)].join(' '));
    const context = normalizeQuery([...asArray(entry.use_cases), ...asArray(entry.style_tags), ...asArray(entry.interaction_tags), ...asArray(entry.technology_stack)].join(' '));
    const directPrompt = typeof globalThis !== 'undefined'
      ? globalThis.DIRECT_USE_PROMPT_DATA?.entries?.[entry.id]
      : '';
    const body = normalizeQuery([
      entry.search_text || `${entry.summary_zh_tw || ''} ${entry.original_summary || ''}`,
      typeof directPrompt === 'string' ? directPrompt : ''
    ].filter(Boolean).join(' '));
    const fields = { title, facets, context, body, all: `${title} ${facets} ${context} ${body}`, weighted: `${title} ${facets} ${context}` };
    SEARCH_FIELD_CACHE.set(entry, fields);
    return fields;
  }

  function rarityScore(fields, rarity, containsTerm) {
    let score = 0;
    for (const [term, frequency] of rarity) {
      if (!containsTerm(fields, term)) continue;
      const inTitle = fields.title.includes(term);
      if (frequency <= 25) score += inTitle ? 42 : 18;
      else if (frequency <= 100) score += inTitle ? 22 : 10;
      else if (frequency <= 500 && inTitle) score += 8;
    }
    return Math.min(64, score);
  }

  function scoreEntry(entry, queryContext) {
    const { terms, route, phrase, concepts, relevanceConceptGroups, rarity, containsTerm } = queryContext;
    const fields = terms.length ? searchFields(entry) : null;
    const titleResult = fields ? fieldScore(fields.title, terms, 24) : { score: 0, hits: 0 };
    const facetResult = fields ? fieldScore(fields.facets, terms, 14) : { score: 0, hits: 0 };
    const contextResult = fields ? fieldScore(fields.context, terms, 11) : { score: 0, hits: 0 };
    const bodyResult = fields ? fieldScore(fields.body, terms, 5) : { score: 0, hits: 0 };
    let score = titleResult.score + facetResult.score + contextResult.score + bodyResult.score;
    if (fields) score += conceptMatchScore(fields, concepts, containsTerm);
    if (fields) score += rarityScore(fields, rarity, containsTerm);
    const hits = new Set();
    if (fields) for (const term of terms) if (containsTerm(fields, term)) hits.add(term);
    if (fields && phrase && fields.weighted.includes(phrase)) score += 30;
    if (route.output_types.includes(entry.output_type)) score += 24;
    if (route.intent === 'design-system' && entry.content_type === 'design-system') score += 28;
    if (route.intent === 'skill' && entry.content_type === 'skill') score += 56;
    if (route.intent === 'prompt' && entry.content_type === 'prompt') score += 48;
    if (route.intent === 'comfy-workflow' && entry.content_type === 'workflow') score += 22;
    if (entry.source_id === 'personal' && entry.content_type === 'prompt' && hits.size > 0 && ['general', 'prompt'].includes(route.intent)) score += 5;
    score += Math.min(12, Number(entry.quality_score || 0) / 8);
    score += licenseUsability(entry);
    if (entry.offline_status === 'verified-local-preview' || /ready-offline|verified-local|preview-ready/i.test(entry.offline_status || '')) score += 4;
    if (entry.example_status === 'VERIFIED') score += 3;
    score -= Math.min(10, asArray(entry.risk_flags).length * 1.25);
    // A requested file format is a constraint on usefulness, not a cosmetic
    // score bonus. A generic presentation query still accepts source-native
    // HTML and written guidance; only explicit PPT/PowerPoint asks prefer PPTX.
    const formatRequired = route.intent === 'ppt' && /\b(?:pptx?|powerpoint)\b/u.test(phrase);
    const formatMatch = formatRequired && route.output_types.includes(entry.output_type);
    // Cover distinct concepts before counting aliases repeatedly. For example,
    // a clinical presentation is more useful than a generic presentation tool
    // that happens to mention several names for the same file format.
    const allConcepts = route.intent === 'ppt' && fields && relevanceConceptGroups.length > 1 && relevanceConceptGroups.every((alternatives) =>
      alternatives.some((term) => term.length > 1 && containsTerm(fields, term) && aliasInQuery(fields.all, term)));
    return { score, hits: hits.size, title_hits: titleResult.hits,
      relevance_tier: (formatMatch ? 2 : 0) + (allConcepts ? 1 : 0) };
  }

  function relevanceFloor(terms, route, scored) {
    if (!terms.length) return true;
    if (scored.hits > 0) return true;
    return route.intent !== 'general' && scored.score >= 18;
  }

  function diversify(ranked, limit = 80) {
    if (ranked.length < 4) return ranked;
    const pool = ranked.slice();
    const output = [];
    const sourceCounts = new Map();
    const styleCounts = new Map();
    while (pool.length && output.length < Math.min(limit, ranked.length)) {
      let bestIndex = 0;
      let bestAdjusted = -Infinity;
      const windowSize = Math.min(256, pool.length);
      for (let index = 0; index < windowSize; index += 1) {
        const candidate = pool[index];
        // Diversity can reorder equally relevant results, never promote a
        // partial topic/format match over a complete one.
        if (candidate.relevance_tier < pool[0].relevance_tier) continue;
        const sourcePenalty = (sourceCounts.get(candidate.entry.source_id) || 0) * 18;
        const primaryStyle = asArray(candidate.entry.style_tags)[0] || '';
        const stylePenalty = primaryStyle ? Math.max(0, (styleCounts.get(primaryStyle) || 0) - 2) * 1.5 : 0;
        const positionPenalty = Math.min(5, index * 0.03);
        const adjusted = candidate.score - sourcePenalty - stylePenalty - positionPenalty;
        if (adjusted > bestAdjusted) {
          bestAdjusted = adjusted;
          bestIndex = index;
        }
      }
      const selected = pool.splice(bestIndex, 1)[0];
      output.push(selected);
      sourceCounts.set(selected.entry.source_id, (sourceCounts.get(selected.entry.source_id) || 0) + 1);
      const style = asArray(selected.entry.style_tags)[0] || '';
      if (style) styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
    }
    return [...output, ...pool];
  }

  function searchEntries(entries, query = '', filters = {}, options = {}) {
    const terms = queryTerms(query);
    const route = intentRoute(query);
    const phrase = normalizeQuery(query);
    const sourceEntries = asArray(entries);
    // Rarity, concept matching and hit counting ask the same full-text question.
    // Keep its answer for this query only; every field and ranking weight remains
    // unchanged, including phrase matches spanning the joined field boundaries.
    const termMatches = new WeakMap();
    const containsTerm = (fields, term) => {
      let matches = termMatches.get(fields);
      if (!matches) { matches = new Map(); termMatches.set(fields, matches); }
      const cached = matches.get(term);
      if (cached !== undefined) return cached;
      const matched = fields.all.includes(term);
      matches.set(term, matched);
      return matched;
    };
    if (!terms.length) {
      // Prime normalized search fields during the initial paged render so the
      // first interactive query does not pay the full 5k-entry normalization cost.
      for (const entry of sourceEntries) searchFields(entry);
    }
    const rarity = new Map();
    for (const term of terms.filter((value) => value.length >= 3).slice(0, 12)) {
      let frequency = 0;
      for (const entry of sourceEntries) if (containsTerm(searchFields(entry), term)) frequency += 1;
      rarity.set(term, frequency);
    }
    const queryContext = { terms, route, phrase, concepts: queryConcepts(phrase), relevanceConceptGroups: route.intent === 'ppt' ? relevanceConcepts(phrase) : [], rarity, containsTerm };
    const includeBlocked = filters.include_blocked === true || /gitskins|來源狀態|source status/i.test(String(query));
    const deduplicate = options.dedupe === true;
    const duplicateGroups = new Set();
    const includeAllPptRecords = includeBlocked && filters.output_type === 'pptx';
    const ranked = [];
    for (const entry of sourceEntries) {
      if (!matchesFilters(entry, filters)) continue;
      if ((entry.index_enabled === false || entry.selection_eligible === false) && !includeBlocked) continue;
      const scored = scoreEntry(entry, queryContext);
      if (!relevanceFloor(terms, route, scored)) continue;
      const group = String(entry.duplicate_group || entry.id);
      if (deduplicate && !includeAllPptRecords && duplicateGroups.has(group)) continue;
      if (deduplicate) duplicateGroups.add(group);
      ranked.push({ entry, relevance_tier: scored.relevance_tier, score: Number(scored.score.toFixed(3)), matched_terms: scored.hits, intent: route.intent });
    }
    ranked.sort((left, right) => right.relevance_tier - left.relevance_tier || right.score - left.score
      || Number(right.entry.quality_score || 0) - Number(left.entry.quality_score || 0)
      || String(left.entry.display_title_zh_tw || left.entry.title).localeCompare(String(right.entry.display_title_zh_tw || right.entry.title), 'zh-Hant'));
    const diversified = options.diversity === false ? ranked : diversify(ranked, Number(options.diversity_window || 80));
    return options.limit ? diversified.slice(0, Number(options.limit)) : diversified;
  }

  function overlap(left, right) {
    const a = new Set(asArray(left).map(normalizeQuery).filter(Boolean));
    const b = new Set(asArray(right).map(normalizeQuery).filter(Boolean));
    let count = 0;
    for (const value of a) if (b.has(value)) count += 1;
    return count;
  }

  function relatedEntries(entries, target, limit = 6) {
    if (!target) return [];
    const scored = asArray(entries).filter((entry) => entry.id !== target.id
      && entry.index_enabled !== false
      && entry.selection_eligible !== false
      && (/^verified(?:$|[-_])/iu.test(entry.license_status || '') || entry.license_status === 'local-project-use')
      && entry.action_capabilities?.entry_id === entry.id
      && ['can_preview', 'can_copy', 'can_download', 'can_open_local_source', 'can_open_local_executable']
        .some((action) => entry.action_capabilities[action] === true)).map((entry) => {
      let score = 0;
      if (entry.output_type === target.output_type) score += 32;
      if (entry.semantic_cluster === target.semantic_cluster) score += 25;
      score += overlap(entry.style_tags, target.style_tags) * 8;
      score += overlap(entry.interaction_tags, target.interaction_tags) * 8;
      score += overlap(entry.technology_stack, target.technology_stack) * 5;
      score += overlap(entry.use_cases, target.use_cases) * 4;
      if (entry.source_id !== target.source_id) score += 4;
      if (entry.example_status === 'VERIFIED') score += 2;
      if (entry.selection_eligible === false) score -= 20;
      return { entry, score };
    }).filter((item) => item.score > 10)
      .sort((left, right) => right.score - left.score || String(left.entry.title).localeCompare(String(right.entry.title)));
    const output = [];
    const sourceCounts = new Map();
    const groups = new Set([target.duplicate_group]);
    for (const item of scored) {
      if (groups.has(item.entry.duplicate_group)) continue;
      const count = sourceCounts.get(item.entry.source_id) || 0;
      if (count >= 2) continue;
      output.push(item);
      groups.add(item.entry.duplicate_group);
      sourceCounts.set(item.entry.source_id, count + 1);
      if (output.length >= limit) break;
    }
    return output;
  }

  function facetValues(entries, field) {
    const counts = new Map();
    const normalizedLabels = new Map();
    for (const entry of asArray(entries)) {
      const values = Array.isArray(entry[field]) ? entry[field] : [entry[field]];
      for (const value of values) {
        const label = String(value || '').trim();
        if (!label) continue;
        let key = normalizedLabels.get(label);
        if (key === undefined) { key = normalizeQuery(label); normalizedLabels.set(label, key); }
        const record = counts.get(key);
        counts.set(key, record ? { value: record.value, count: record.count + 1 } : { value: label, count: 1 });
      }
    }
    return [...counts.values()].sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, 'zh-Hant'));
  }

  function buildGuidedDiscovery(answers = {}) {
    const output = String(answers.output || '').trim();
    const style = String(answers.style || '').trim();
    const interaction = String(answers.interaction || '').trim();
    const technology = String(answers.technology || '').trim();
    const parts = [output, style, interaction, technology].filter(Boolean);
    const filters = {};
    const outputMap = {
      web: 'web-page', ui: 'ui-component', motion: 'motion-effect', ppt: 'pptx', image: 'image',
      comfy: 'comfy-workflow', video: 'video', audio: 'audio', '3d': '3d', github: 'github-profile',
      readme: 'readme', 'design-system': 'web-page'
    };
    if (outputMap[output]) filters.output_type = outputMap[output];
    if (style && style !== 'professional') filters.style = style;
    if (interaction && !['report', 'upscale'].includes(interaction)) filters.interaction = interaction;
    if (technology) filters.technology = technology;
    return { query: parts.join(' '), filters, route: intentRoute(parts.join(' ')) };
  }

  function comparisonCompatibility(entries) {
    const selected = asArray(entries);
    if (selected.length < 2) return { compatible: true, message: '' };
    const outputTypes = new Set(selected.map((entry) => entry.output_type));
    const clusters = new Set(selected.map((entry) => entry.semantic_cluster));
    if (outputTypes.size === 1 || clusters.size === 1) return { compatible: true, message: '可直接比較主要功能、相依、授權、離線與成果狀態。' };
    return { compatible: false, message: '這些項目的成果類型不同；仍可比較來源、授權與執行條件，但功能欄位不應視為一對一等價。' };
  }

  function exampleFreshness(entry, currentContentHash) {
    if (!entry) return { status: 'NOT_APPLICABLE', stale: false, reason: 'missing-entry' };
    const declaredStatus = String(entry.example_status || 'NOT_APPLICABLE');
    const currentHash = String(currentContentHash || entry.content_hash || '');
    const generatedFromHash = String(entry.example_generated_from_hash || '');
    if (entry.example_policy === 'NOT_APPLICABLE' || declaredStatus === 'NOT_APPLICABLE') {
      return { status: 'NOT_APPLICABLE', stale: false, reason: 'example-not-applicable' };
    }
    if (entry.example_hash && generatedFromHash && currentHash && generatedFromHash !== currentHash) {
      return { status: 'STALE', stale: true, reason: 'source-content-hash-changed' };
    }
    return { status: declaredStatus, stale: declaredStatus === 'STALE', reason: declaredStatus === 'STALE' ? 'declared-stale' : 'hash-current-or-not-generated' };
  }

  function buildCodexHandoff(entry) {
    if (!entry) return '';
    return [
      '使用 prompt-library 與 unified-index-v2。',
      `目標項目：${entry.display_title_zh_tw || entry.title}`,
      `Entry ID：${entry.id}`,
      `來源：${entry.source_id} @ ${entry.source_commit || '無固定 commit'}`,
      `原始路徑：${entry.relative_path || '無'}`,
      `成果類型：${entry.output_type}；執行層級：${entry.execution_level}`,
      '',
      '請只讀取 unified local search 的 Top-N 與此項來源 metadata，先檢查授權、相依、離線與風險，再提出安全整合方案。不要無限制掃描 repository，不要安裝、部署、下載模型、啟動服務或修改 Codex 設定。'
    ].join('\n');
  }

  function buildImageSimilarityHandoff() {
    return '使用 prompt-library。\n我接下來會附上一張參考畫面，請分析它的視覺風格、版面、互動與動效，然後使用目前 unified index 找出最相似的 Prompt / Live UI / Design System，最多五項，不要修改專案。';
  }

  return Object.freeze({
    normalizeQuery,
    expandQuery,
    queryTerms,
    intentRoute,
    matchesFilters,
    searchEntries,
    relatedEntries,
    facetValues,
    buildGuidedDiscovery,
    comparisonCompatibility,
    exampleFreshness,
    buildCodexHandoff,
    buildImageSimilarityHandoff
  });
});
