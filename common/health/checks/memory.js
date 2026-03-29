const WARN_THRESHOLD_MB  = 400;
const FATAL_THRESHOLD_MB = 700;

export async function checkMemory() {
  const { rss, heapUsed, heapTotal, external } = process.memoryUsage();

  const toMB   = (b) => Math.round(b / 1024 / 1024);
  const usedMB = toMB(heapUsed);

  const status = usedMB > FATAL_THRESHOLD_MB ? 'unhealthy'
               : usedMB > WARN_THRESHOLD_MB  ? 'degraded'
               :                               'ok';

  return {
    name:    'checkMemory',
    status,
    message: `Heap used: ${usedMB} MB`,
    meta: {
      heapUsedMB:  usedMB,
      heapTotalMB: toMB(heapTotal),
      rssMB:       toMB(rss),
      externalMB:  toMB(external),
    },
  };
}