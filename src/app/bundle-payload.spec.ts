import { buildBundlePayload, BundleState } from './bundle-payload';

const software = { name: 'newapp', productLink: 'https://example.com', categories: ['productivity'], cpu: ['x86-64'], free: true };
const version = { version: '1.1', download: 'https://example.com/1.1.zip' };
const report = { status: 'gold', description: 'works' };

function state(over: Partial<BundleState>): BundleState {
  return {
    softwareName: null, software: null,
    versionMode: 'none', existingVersionId: null, version: null,
    report: null, screenshots: [],
    ...over,
  };
}

describe('buildBundlePayload', () => {
  it('builds new software + new version + report with screenshots', () => {
    const payload = buildBundlePayload(state({
      software, versionMode: 'new', version, report, screenshots: ['data:image/png;base64,AAA'],
    }));

    expect(payload).toEqual({
      software: { name: 'newapp', links: { product: 'https://example.com' }, cpu: ['x86-64'], free: true, categories: ['productivity'] },
      version: { version: '1.1', download: 'https://example.com/1.1.zip' },
      report: { status: 'gold', description: 'works', screenshots: ['data:image/png;base64,AAA'] },
    });
  });

  it('builds a software-only submission without version or report keys', () => {
    const payload = buildBundlePayload(state({ software }));

    expect(Object.keys(payload)).toEqual(['software']);
  });

  it('builds a new version for existing software', () => {
    const payload = buildBundlePayload(state({ softwareName: 'pearcalc', versionMode: 'new', version }));

    expect(payload).toEqual({ softwareName: 'pearcalc', version: { version: '1.1', download: 'https://example.com/1.1.zip' } });
  });

  it('builds a report for an existing version of existing software', () => {
    const payload = buildBundlePayload(state({
      softwareName: 'pearcalc', versionMode: 'existing', existingVersionId: '1.0', report,
    }));

    expect(payload).toEqual({
      softwareName: 'pearcalc', versionId: '1.0',
      report: { status: 'gold', description: 'works', screenshots: [] },
    });
  });

  it('ignores stale version fields when the mode is none', () => {
    const payload = buildBundlePayload(state({ software, versionMode: 'none', version, existingVersionId: '9' }));

    expect(payload.version).toBeUndefined();
    expect(payload.versionId).toBeUndefined();
  });
});
