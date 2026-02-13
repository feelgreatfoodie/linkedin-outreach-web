import 'server-only';
import { getSystemPrompt, getOutreachPrompt } from './templates';
import { inferProvider, getModelLabel, PROVIDERS, type ProviderKey } from './models';
import type { Prospect, Sequence, OutreachStyle, Message } from './types';
import { nanoid } from 'nanoid';

interface GenerateParams {
  model: string;
  system?: string;
  user: string;
  maxTokens: number;
}

interface AIProvider {
  generate(params: GenerateParams): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private client: unknown;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = null;
  }

  private async getClient() {
    if (!this.client) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
    return this.client as import('@anthropic-ai/sdk').default;
  }

  async generate({ model, system, user, maxTokens }: GenerateParams): Promise<string> {
    const client = await this.getClient();
    const params: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: user }],
    };
    if (system) {
      params.system = system;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.messages.create(params as any);
    const content = response.content[0];
    if (content.type === 'text') return content.text;
    throw new Error('Unexpected response type from Anthropic');
  }
}

class GeminiProvider implements AIProvider {
  private apiKey: string;
  private client: unknown;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = null;
  }

  private async getClient() {
    if (!this.client) {
      const { GoogleGenAI } = await import('@google/genai');
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client as import('@google/genai').GoogleGenAI;
  }

  async generate({ model, system, user, maxTokens }: GenerateParams): Promise<string> {
    const client = await this.getClient();
    const config: Record<string, unknown> = {};
    if (system) {
      config.systemInstruction = system;
    }
    if (maxTokens) {
      config.maxOutputTokens = maxTokens;
    }
    const response = await client.models.generateContent({
      model,
      contents: user,
      config,
    });
    return response.text ?? '';
  }
}

function parseSequenceResponse(text: string): { messages: Message[] } {
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  const parsed = JSON.parse(jsonStr);
  if (!parsed.messages || !Array.isArray(parsed.messages)) {
    throw new Error('Response missing "messages" array');
  }
  return parsed;
}

function resolveConfig() {
  const provider = (process.env.AI_PROVIDER || 'gemini') as ProviderKey;
  const model = process.env.MODEL || PROVIDERS[provider]?.defaultModel || 'gemini-2.0-flash';
  const resolvedProvider = inferProvider(model) || provider;
  const apiKey = resolvedProvider === 'anthropic'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.GOOGLE_API_KEY;
  return { provider: resolvedProvider, model, apiKey };
}

function createProvider(providerKey: ProviderKey, apiKey: string): AIProvider {
  if (providerKey === 'anthropic') return new AnthropicProvider(apiKey);
  return new GeminiProvider(apiKey);
}

export async function generateSequence(
  prospect: Prospect,
  style: OutreachStyle = 'cold'
): Promise<Sequence> {
  const { provider: providerKey, model, apiKey } = resolveConfig();

  if (!apiKey) {
    throw new Error(`API key not configured. Set ${PROVIDERS[providerKey]?.envKey || 'API key'} in environment.`);
  }

  const providerInstance = createProvider(providerKey, apiKey);
  const systemPrompt = getSystemPrompt();
  const userPrompt = getOutreachPrompt(style, prospect);

  const startTime = Date.now();

  const text = await providerInstance.generate({
    model,
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 2048,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const parsed = parseSequenceResponse(text);

  return {
    id: nanoid(10),
    prospectId: prospect.id,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    company: prospect.company,
    style,
    model,
    provider: providerKey,
    generatedAt: new Date().toISOString(),
    generationTime: `${elapsed}s`,
    messages: parsed.messages,
  };
}

export function getHealthInfo() {
  const { provider, model, apiKey } = resolveConfig();
  return {
    provider,
    providerName: PROVIDERS[provider]?.name || provider,
    model,
    modelLabel: getModelLabel(provider, model),
    configured: !!apiKey,
  };
}
