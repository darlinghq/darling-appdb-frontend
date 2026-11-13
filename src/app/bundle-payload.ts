/** Which version the submission refers to: none, a new one, or an existing one. */
export type VersionMode = 'none' | 'new' | 'existing';

/** Everything the wizard has collected; sections not in use are null / 'none'. */
export interface BundleState {
  /** Existing software (opened from its page); null when adding new software. */
  softwareName: string | null;
  software: { name: string; productLink: string; categories: string[]; cpu: string[]; free: boolean } | null;
  versionMode: VersionMode;
  existingVersionId: string | null;
  version: { version: string; download: string } | null;
  report: { status: string; description: string } | null;
  screenshots: string[];
}

/** Body of POST /api/submissions; absent sections are omitted. */
export interface BundlePayload {
  softwareName?: string;
  software?: { name: string; links: Record<string, string>; cpu: string[]; free: boolean; categories: string[] };
  versionId?: string;
  version?: { version: string; download: string };
  report?: { status: string; description: string; screenshots: string[] };
}

export function buildBundlePayload(state: BundleState): BundlePayload {
  const payload: BundlePayload = {};

  if (state.softwareName) {
    payload.softwareName = state.softwareName;
  } else if (state.software) {
    const s = state.software;
    payload.software = { name: s.name, links: { product: s.productLink }, cpu: s.cpu, free: s.free, categories: s.categories };
  }

  if (state.versionMode === 'new' && state.version) {
    payload.version = { version: state.version.version, download: state.version.download };
  } else if (state.versionMode === 'existing' && state.existingVersionId) {
    payload.versionId = state.existingVersionId;
  }

  if (state.report) {
    payload.report = { status: state.report.status, description: state.report.description, screenshots: state.screenshots };
  }

  return payload;
}
