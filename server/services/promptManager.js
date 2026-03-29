import { supabase } from './supabase.js';

const promptCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * @param {string} feature
 * @returns {Promise<string | null>}
 */
export async function getActivePrompt(feature) {
  const cached = promptCache.get(feature);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.content;
  }

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('content, variables, version, name')
    .eq('feature', feature)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.content) {
    if (error && !String(error.message || '').includes('0 rows')) {
      console.warn(`[PROMPT] load ${feature}:`, error.message);
    }
    return null;
  }

  promptCache.set(feature, {
    content: data.content,
    variables: data.variables,
    version: data.version,
    name: data.name,
    timestamp: now,
  });

  return data.content;
}

/**
 * Replace {{key}} placeholders (keys escaped for regex).
 * @param {string} template
 * @param {Record<string, string>} [variables]
 */
export function renderPrompt(template, variables = {}) {
  if (!template) return '';
  return Object.entries(variables).reduce((tpl, [key, val]) => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return tpl.replace(
      new RegExp(`{{\\s*${escaped}\\s*}}`, 'g'),
      String(val ?? '')
    );
  }, template);
}

export function invalidatePromptCache(feature) {
  if (feature) promptCache.delete(feature);
  else promptCache.clear();
}
