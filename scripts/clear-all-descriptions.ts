// Script to clear all location descriptions
// This can be imported and called from your app

import { clearAllDescriptions } from '../lib/location-descriptions';

/**
 * Clear all cached descriptions
 * Run this to force regeneration of all descriptions with new unique prompts
 */
export async function clearDescriptions() {
  try {
    await clearAllDescriptions();
    console.log('✅ All descriptions cleared successfully');
    console.log('📝 Descriptions will be regenerated with unique prompts on next location load');
  } catch (error) {
    console.error('❌ Error clearing descriptions:', error);
  }
}

// Uncomment to run directly:
// clearDescriptions();

