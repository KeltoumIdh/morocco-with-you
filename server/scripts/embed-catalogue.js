#!/usr/bin/env node
/**
 * Embed catalogue (OpenAI, Gemini, or Ollama — see server/.env.example).
 *
 *   node --env-file=server/.env server/scripts/embed-catalogue.js
 *   node --env-file=server/.env server/scripts/embed-catalogue.js experience
 */
import '../env-bootstrap.js';
import {
  embedAllOfType,
  useOpenAIEmbeddings,
  useGeminiEmbeddings,
  useOllamaEmbeddings,
} from '../services/embeddings.js';
import { ollamaEmbedModel } from '../services/llmProviders.js';
import { geminiEmbedModel } from '../services/geminiProvider.js';

const TYPES = [
  'experience',
  'activity',
  'accommodation',
  'restaurant',
  'package',
  'provider',
  'group_trip',
];

const run = async () => {
  const target = process.argv[2];
  const types = target ? [target] : TYPES;

  console.log('Morocco With You — catalogue embedding pipeline');
  const embedLabel = useOpenAIEmbeddings()
    ? `OpenAI (${process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'})`
    : useGeminiEmbeddings()
      ? `Gemini (${geminiEmbedModel()})`
      : useOllamaEmbeddings()
        ? `Ollama (${ollamaEmbedModel()} @ ${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'})`
        : '(none)';
  console.log('Embeddings:', embedLabel);
  console.log('Types:', types.join(', '));
  console.log('-'.repeat(50));

  const totals = { processed: 0, skipped: 0, errors: 0 };

  for (const type of types) {
    process.stdout.write(`Embedding [${type}]... `);
    try {
      const result = await embedAllOfType(type);
      console.log(
        `ok processed=${result.processed} skipped=${result.skipped} errors=${result.errors}`
      );
      totals.processed += result.processed;
      totals.skipped += result.skipped;
      totals.errors += result.errors;
    } catch (err) {
      console.error(`fail ${err.message}`);
      totals.errors++;
    }
  }

  console.log('-'.repeat(50));
  console.log('Total processed:', totals.processed);
  console.log('Total skipped:', totals.skipped);
  console.log('Total errors:', totals.errors);
  process.exit(totals.errors > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
