// vitest alias target for "server-only" — that package intentionally throws
// when imported outside Next's server-component bundler, which is exactly
// what running these files under plain Node/Vitest does. Tests only need
// the import to no-op, not the real guard.
export {};
