export const PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-5-20250929',
    displayPrefix: 'Claude',
  },
  gemini: {
    name: 'Google Gemini',
    envKey: 'GOOGLE_API_KEY',
    defaultModel: 'gemini-2.0-flash',
    displayPrefix: 'Gemini',
  },
} as const;

export type ProviderKey = keyof typeof PROVIDERS;

export const MODEL_CATALOG: Record<string, { provider: ProviderKey; label: string }> = {
  'claude-sonnet-4-5-20250929': { provider: 'anthropic', label: 'Claude Sonnet 4.5' },
  'claude-opus-4-20250514': { provider: 'anthropic', label: 'Claude Opus 4' },
  'claude-haiku-3-5-20241022': { provider: 'anthropic', label: 'Claude Haiku 3.5' },
  'gemini-2.0-flash': { provider: 'gemini', label: 'Gemini 2.0 Flash' },
  'gemini-2.5-flash': { provider: 'gemini', label: 'Gemini 2.5 Flash' },
  'gemini-2.5-pro': { provider: 'gemini', label: 'Gemini 2.5 Pro' },
  'gemini-1.5-pro': { provider: 'gemini', label: 'Gemini 1.5 Pro' },
};

export function inferProvider(modelId: string): ProviderKey | null {
  if (!modelId) return null;
  if (MODEL_CATALOG[modelId]) return MODEL_CATALOG[modelId].provider;
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('gemini')) return 'gemini';
  return null;
}

export function getModelLabel(providerKey: ProviderKey, modelId: string): string {
  const entry = MODEL_CATALOG[modelId];
  if (entry) return entry.label;
  const provider = PROVIDERS[providerKey];
  return provider ? `${provider.displayPrefix} ${modelId}` : modelId;
}
