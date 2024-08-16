const fs = require('fs');

function generateComparisonTable(baseCommitHash, baseMetricsPath, targetCommitHash, targetMetricsPath, outputPath) {
  // Load JSON outputs from k6
  const baseMetrics = JSON.parse(fs.readFileSync(baseMetricsPath, 'utf8'));
  const targetMetrics = JSON.parse(fs.readFileSync(targetMetricsPath, 'utf8'));

  const baseData = extractMetrics(baseMetrics);
  const targetData = extractMetrics(targetMetrics);

  const table = generateTable(baseCommitHash, baseData, targetCommitHash, targetData);

  fs.writeFileSync(outputPath, table);
}

function extractMetrics(metrics) {
  const extractedMetrics = {};
  const metricKeys = Object.keys(metrics.metrics);

  for (const key of metricKeys) {
    if (key.endsWith('_http_req_duration')) {
      const values = metrics.metrics[key].values;
      const avgResponseTime = values.avg;
      const maxResponseTime = values.max;
      const p90 = values['p(90)'];
      const p95 = values['p(95)'];

      const name = key.split('_')[0].charAt(0).toUpperCase() + key.split('_')[0].slice(1);

      if (!extractedMetrics[name]) {
        extractedMetrics[name] = { avgResponseTime, maxResponseTime, p90, p95 };
      } else {
        extractedMetrics[name].avgResponseTime = avgResponseTime;
        extractedMetrics[name].maxResponseTime = maxResponseTime;
        extractedMetrics[name].p90 = p90;
        extractedMetrics[name].p95 = p95;
      }
    }
  }

  extractedMetrics['Test Run Duration'] = metrics.state.testRunDurationMs;

  return extractedMetrics;
}

function generateTable(baseCommitHash, baseData, targetCommitHash, targetData) {
  let table = `k6 load testing comparison.\nBase Commit Hash: ${baseCommitHash}\nTarget Commit Hash: ${targetCommitHash}\n\n`;
  table += '| Metric | Base | Target | Diff |\n';
  table += '| ------ | ---- | ------ | ---- |\n';

  for (const key of Object.keys(baseData)) {
    if (key === 'Test Run Duration') {
      continue;
    }
    const baseAvg = baseData[key].avgResponseTime;
    const targetAvg = targetData[key].avgResponseTime;
    const baseMax = baseData[key].maxResponseTime;
    const targetMax = targetData[key].maxResponseTime;
    const baseP90 = baseData[key].p90;
    const targetP90 = targetData[key].p90;
    const baseP95 = baseData[key].p95;
    const targetP95 = targetData[key].p95;

    const avgDiff = getDifferencePercentage(baseAvg, targetAvg);
    const maxDiff = getDifferencePercentage(baseMax, targetMax);
    const p90Diff = getDifferencePercentage(baseP90, targetP90);
    const p95Diff = getDifferencePercentage(baseP95, targetP95);

    const avgColor = getColor(baseAvg, targetAvg);
    const maxColor = getColor(baseMax, targetMax);
    const p90Color = getColor(baseP90, targetP90);
    const p95Color = getColor(baseP95, targetP95);

    table += `| **${key}** | | |\n`;
    table += `| - Average Response Time | ${baseAvg.toFixed(2)} ms | ${targetAvg.toFixed(2)} ms | ${avgDiff} ${avgColor} |\n`;
    table += `| - Max Response Time | ${baseMax.toFixed(2)} ms | ${targetMax.toFixed(2)} ms | ${maxDiff} ${maxColor} |\n`;
    table += `| - 90th Percentile | ${baseP90.toFixed(2)} ms | ${targetP90.toFixed(2)} ms | ${p90Diff} ${p90Color} |\n`;
    table += `| - 95th Percentile | ${baseP95.toFixed(2)} ms | ${targetP95.toFixed(2)} ms | ${p95Diff} ${p95Color} |\n`;
  }

  const baseDuration = baseData['Test Run Duration'].toFixed(2);
  const targetDuration = targetData['Test Run Duration'].toFixed(2);
  table += `| **Test Run Duration**     | ${baseDuration} ms | ${targetDuration} ms | |\n`;

  return table;
}

function getColor(baseValue, targetValue) {
  if (baseValue >= targetValue) {
    return '✅'; // Green emoji for improvement or equivalence
  } else {
    return '🔴'; // Red emoji for degradation
  }
}

function getDifferencePercentage(baseValue, targetValue) {
  const difference = ((targetValue - baseValue) / baseValue) * 100;
  const sign = difference >= 0 ? '+' : '';
  return `${sign}${difference.toFixed(2)}%`;
}

if (process.argv.length !== 7) {
  console.error('Usage: node compare-results.js baseCommitHash baseMetricsPath targetCommitHash targetMetricsPath outputFile');
  process.exit(1);
}

const baseCommitHash = process.argv[2];
const baseMetricsPath = process.argv[3];
const targetCommitHash = process.argv[4];
const targetMetricsPath = process.argv[5];
const outputPath = process.argv[6];

generateComparisonTable(baseCommitHash, baseMetricsPath, targetCommitHash, targetMetricsPath, outputPath);
