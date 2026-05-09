(() => {
  const profiles = {
    baseline: {
      intended: 'Fast event triage for exploratory signal-region studies.',
      limitations:
        'Moderate threshold sensitivity; should be calibrated again for shifted samples.',
      base: { signal: 520, background: 680, tpr: 0.74, fpr: 0.24 },
    },
    calibrated: {
      intended: 'Balanced analysis review where probability calibration matters.',
      limitations: 'Higher inference cost and still dependent on representative validation data.',
      base: { signal: 520, background: 680, tpr: 0.8, fpr: 0.18 },
    },
    conservative: {
      intended: 'High-purity selections for follow-up inspection.',
      limitations: 'Lower signal efficiency; can hide rare phase-space failures.',
      base: { signal: 520, background: 680, tpr: 0.66, fpr: 0.1 },
    },
  };

  const ids = {
    select: 'model-select',
    threshold: 'threshold-input',
    thresholdValue: 'threshold-value',
    tp: 'tp-cell',
    fn: 'fn-cell',
    fp: 'fp-cell',
    tn: 'tn-cell',
    precision: 'precision-value',
    recall: 'recall-value',
    specificity: 'specificity-value',
    f1: 'f1-value',
    intended: 'intended-use',
    limitations: 'limitations',
  };
  const el = Object.fromEntries(
    Object.entries(ids).map(([key, id]) => [key, document.getElementById(id)]),
  );

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pct(value) {
    return `${Math.round(value * 100)}%`;
  }

  function render() {
    const profile = profiles[el.select.value];
    const threshold = Number(el.threshold.value) / 100;
    const shift = threshold - 0.5;
    const tpr = clamp(profile.base.tpr - shift * 0.7, 0.05, 0.98);
    const fpr = clamp(profile.base.fpr - shift * 0.55, 0.01, 0.8);
    const tp = Math.round(profile.base.signal * tpr);
    const fn = profile.base.signal - tp;
    const fp = Math.round(profile.base.background * fpr);
    const tn = profile.base.background - fp;
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const specificity = tn / (tn + fp);
    const f1 = (2 * precision * recall) / (precision + recall);

    el.thresholdValue.textContent = threshold.toFixed(2);
    el.tp.textContent = String(tp);
    el.fn.textContent = String(fn);
    el.fp.textContent = String(fp);
    el.tn.textContent = String(tn);
    el.precision.textContent = pct(precision);
    el.recall.textContent = pct(recall);
    el.specificity.textContent = pct(specificity);
    el.f1.textContent = pct(f1);
    el.intended.textContent = profile.intended;
    el.limitations.textContent = profile.limitations;
  }

  el.select.addEventListener('change', render);
  el.threshold.addEventListener('input', render);
  render();
})();
