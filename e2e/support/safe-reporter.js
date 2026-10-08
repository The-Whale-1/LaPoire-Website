'use strict';

const { redactText, isAuthTest, sanitizeError, sanitizeResult, sanitizeStep } = require('./privacy');

class SafeReporter {
  constructor(options = {}) {
    const { kind = 'list', ...reporterOptions } = options;
    this.kind = kind;
    this.queue = [];
    if (kind === 'allure') {
      const Reporter = require('allure-playwright').default;
      this.delegate = new Reporter({ ...reporterOptions, detail: false });
      this.ready = Promise.resolve(this.delegate);
    } else {
      // Playwright 1.64 exports its bundled runner factory. Avoid removed file
      // paths; pinned dependency plus collection tests cover this integration.
      const { runnerReporters } = require('playwright/lib/runner');
      this.ready = runnerReporters.createReporters({ config: { tags: [], reporter: [] }, configDir: options.configDir || process.cwd() }, options._mode || 'test', [[kind, reporterOptions]])
        .then(reporters => {
          this.delegate = reporters[reporters.length - 1];
          for (const [method, args] of this.queue) this.call(method, ...args);
          this.queue = [];
          return this.delegate;
        });
    }
  }
  version() { return 'v2'; }
  printsToStdio() { return this.delegate?.printsToStdio ? this.delegate.printsToStdio() : this.kind === 'list'; }
  call(method, ...args) {
    if (!this.delegate) { this.queue.push([method, args]); return; }
    if (method === 'onBegin' && this.delegate.version?.() !== 'v2') return this.delegate.onBegin?.(this.config, ...args);
    return this.delegate[method]?.(...args);
  }
  onConfigure(config) { this.config = config; return this.call('onConfigure', config); }
  onBegin(suite) { return this.call('onBegin', suite); }
  onTestBegin(test, result) { return this.call('onTestBegin', test, result); }
  onStepBegin(test, result, step) { return this.call('onStepBegin', test, result, sanitizeStep(test, step)); }
  onStepEnd(test, result, step) { return this.call('onStepEnd', test, result, sanitizeStep(test, step)); }
  onStdOut(chunk, test, result) { return this.call('onStdOut', this.safeOutput(chunk, test), test, result); }
  onStdErr(chunk, test, result) { return this.call('onStdErr', this.safeOutput(chunk, test), test, result); }
  safeOutput(chunk, test) { return test && isAuthTest(test) ? '[authenticated output suppressed]\n' : redactText(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk); }
  onTestEnd(test, result) { return this.call('onTestEnd', test, sanitizeResult(test, result)); }
  onError(error) { return this.call('onError', sanitizeError(error, false)); }
  async onEnd(result) { await this.ready; return this.call('onEnd', result); }
  async onExit() { await this.ready; return this.call('onExit'); }
}

module.exports = SafeReporter;
