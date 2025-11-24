// Multi-AI Service
// Suportă multiple API-uri AI pentru performanță și redundanță îmbunătățită

export type AIProvider = 'gemini' | 'openai' | 'anthropic';
export type Strategy = 'fallback' | 'parallel' | 'load-balance';

interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
  priority?: number; // Lower number = higher priority
  enabled?: boolean;
}

interface MultiAIResponse {
  text: string;
  provider: AIProvider;
  responseTime: number;
}

// Configurare API-uri disponibile
const AI_PROVIDERS: AIProviderConfig[] = [
  // Gemini - Primary (fast)
  {
    provider: 'gemini',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '', // Set EXPO_PUBLIC_GEMINI_API_KEY in .env
    model: 'gemini-2.5-flash',
    priority: 1,
    enabled: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY, // Only enable if key is set
  },
  // Gemini - Secondary (backup key or different model)
  {
    provider: 'gemini',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY_2 || '', // Optional second key
    model: 'gemini-2.5-pro',
    priority: 3,
    enabled: false, // Enable if you have a second key
  },
  // OpenAI - Fallback provider
  {
    provider: 'openai',
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '', // Set EXPO_PUBLIC_OPENAI_API_KEY in .env
    model: 'gpt-3.5-turbo',
    priority: 2,
    enabled: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY, // Only enable if key is set
  },
];

// ==================== GEMINI API ====================
async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error('Invalid Gemini response structure');
}

// ==================== OPENAI API ====================
async function callOpenAIAPI(prompt: string, apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Ești un asistent AI expert în turism pentru o aplicație mobilă din România.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  throw new Error('Invalid OpenAI response structure');
}

// ==================== GENERIC API CALLER ====================
async function callAIProvider(
  config: AIProviderConfig,
  prompt: string,
  timeout: number = 10000
): Promise<MultiAIResponse> {
  const startTime = Date.now();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });

  const apiPromise = (async () => {
    switch (config.provider) {
      case 'gemini':
        if (!config.apiKey || config.apiKey.length < 20) {
          throw new Error('Gemini API key not configured');
        }
        const text = await callGeminiAPI(prompt, config.apiKey, config.model);
        return {
          text,
          provider: config.provider,
          responseTime: Date.now() - startTime,
        };
      case 'openai':
        if (!config.apiKey || config.apiKey.length < 20) {
          throw new Error('OpenAI API key not configured');
        }
        const openaiText = await callOpenAIAPI(prompt, config.apiKey, config.model);
        return {
          text: openaiText,
          provider: config.provider,
          responseTime: Date.now() - startTime,
        };
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  })();

  return Promise.race([apiPromise, timeoutPromise]);
}

// ==================== STRATEGIES ====================

/**
 * Fallback Strategy: Try providers in priority order until one succeeds
 */
async function fallbackStrategy(
  prompt: string,
  providers: AIProviderConfig[]
): Promise<MultiAIResponse> {
  const enabledProviders = providers
    .filter((p) => p.enabled && p.apiKey && p.apiKey.length >= 20)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  if (enabledProviders.length === 0) {
    throw new Error('No enabled AI providers configured');
  }

  let lastError: Error | null = null;

  for (const provider of enabledProviders) {
    try {
      console.log(`[Multi-AI] Trying ${provider.provider} (${provider.model || 'default'})...`);
      const result = await callAIProvider(provider, prompt);
      console.log(`[Multi-AI] ✅ Success with ${provider.provider} in ${result.responseTime}ms`);
      return result;
    } catch (error: any) {
      console.warn(`[Multi-AI] ❌ ${provider.provider} failed:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }

  throw lastError || new Error('All AI providers failed');
}

/**
 * Parallel Strategy: Call all providers simultaneously, use the first successful response
 */
async function parallelStrategy(
  prompt: string,
  providers: AIProviderConfig[]
): Promise<MultiAIResponse> {
  const enabledProviders = providers
    .filter((p) => p.enabled && p.apiKey && p.apiKey.length >= 20)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  if (enabledProviders.length === 0) {
    throw new Error('No enabled AI providers configured');
  }

  // Create promises for all providers
  const promises = enabledProviders.map((provider) =>
    callAIProvider(provider, prompt).catch((error) => ({
      error,
      provider: provider.provider,
    }))
  );

  // Race: use first successful response
  const results = await Promise.allSettled(promises);

  // Find first successful result
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && !('error' in result.value)) {
      console.log(
        `[Multi-AI] ✅ Parallel success with ${enabledProviders[i].provider} in ${result.value.responseTime}ms`
      );
      return result.value;
    }
  }

  // If all failed, throw error
  throw new Error('All parallel AI requests failed');
}

/**
 * Load Balance Strategy: Round-robin distribution across providers
 */
let loadBalanceIndex = 0;
async function loadBalanceStrategy(
  prompt: string,
  providers: AIProviderConfig[]
): Promise<MultiAIResponse> {
  const enabledProviders = providers
    .filter((p) => p.enabled && p.apiKey && p.apiKey.length >= 20)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  if (enabledProviders.length === 0) {
    throw new Error('No enabled AI providers configured');
  }

  // Round-robin selection
  const provider = enabledProviders[loadBalanceIndex % enabledProviders.length];
  loadBalanceIndex++;

  console.log(`[Multi-AI] Load balancing to ${provider.provider} (${provider.model || 'default'})...`);
  const result = await callAIProvider(provider, prompt);
  console.log(`[Multi-AI] ✅ Success with ${provider.provider} in ${result.responseTime}ms`);
  return result;
}

// ==================== MAIN EXPORT ====================

/**
 * Generate AI response using multiple providers with specified strategy
 */
export async function generateAIResponse(
  prompt: string,
  strategy: Strategy = 'fallback'
): Promise<MultiAIResponse> {
  const enabledCount = AI_PROVIDERS.filter((p) => p.enabled && p.apiKey && p.apiKey.length >= 20).length;

  if (enabledCount === 0) {
    throw new Error('No enabled AI providers configured. Check your API keys.');
  }

  console.log(`[Multi-AI] Using strategy: ${strategy} with ${enabledCount} provider(s)`);

  switch (strategy) {
    case 'fallback':
      return fallbackStrategy(prompt, AI_PROVIDERS);
    case 'parallel':
      return parallelStrategy(prompt, AI_PROVIDERS);
    case 'load-balance':
      return loadBalanceStrategy(prompt, AI_PROVIDERS);
    default:
      return fallbackStrategy(prompt, AI_PROVIDERS);
  }
}

/**
 * Get statistics about available providers
 */
export function getAIProviderStats() {
  const enabled = AI_PROVIDERS.filter((p) => p.enabled && p.apiKey && p.apiKey.length >= 20);
  return {
    total: AI_PROVIDERS.length,
    enabled: enabled.length,
    providers: enabled.map((p) => ({
      provider: p.provider,
      model: p.model,
      priority: p.priority,
    })),
  };
}


