/**
 * RAG retrieval evaluation CLI.
 *
 *   npm run eval              → vector baseline + hybrid, then compare
 *   npm run eval:vector       → --mode=vector
 *   npm run eval:hybrid       → --mode=hybrid
 *   npm run eval:keyword      → --mode=keyword
 *   npm run eval:compare      → same as npm run eval
 */
import { runEvaluation, compareRuns } from '../services/evaluator.js';

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='))?.replace('--mode=', '');
const compare =
  args.includes('--compare') || (!modeArg && args.every((a) => !a.startsWith('--mode=')));

const run = async () => {
  console.log('Morocco With You — RAG retrieval evaluation');
  console.log('='.repeat(50));

  if (modeArg && !compare) {
    await runEvaluation({
      runName: `${modeArg}-${Date.now()}`,
      searchMode: modeArg,
      k: 5,
      threshold: modeArg === 'vector' ? 0.65 : 0.6,
      vectorWeight: 0.65,
      keywordWeight: 0.35,
    });
    return;
  }

  console.log('\n[1/2] Vector-only baseline...');
  const vectorRun = await runEvaluation({
    runName: `vector-baseline-${Date.now()}`,
    searchMode: 'vector',
    k: 5,
    threshold: 0.65,
  });

  console.log('\n[2/2] Hybrid (RRF)...');
  const hybridRun = await runEvaluation({
    runName: `hybrid-rrf-${Date.now()}`,
    searchMode: 'hybrid',
    k: 5,
    vectorWeight: 0.7,
    keywordWeight: 0.3,
  });

  console.log('\n' + '='.repeat(50));
  console.log('A/B comparison (hybrid vs vector)');
  const comparison = await compareRuns(vectorRun.run.id, hybridRun.run.id);
  console.log('Delta (second run − first run; second = hybrid):');
  Object.entries(comparison.delta).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(14)} ${v}`);
  });
  console.log(`\nHigher NDCG: ${comparison.winner}`);
};

run().catch((err) => {
  console.error('Eval failed:', err.message || err);
  process.exit(1);
});
