import { solveEmbedding, type Defects, type Problem } from '../../lib/embedding/solver';

self.onmessage = (event: MessageEvent<{ problem: Problem; defects: Defects }>) => {
  try {
    self.postMessage({ result: solveEmbedding(event.data.problem, event.data.defects) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
