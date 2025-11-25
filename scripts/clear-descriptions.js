// Script to clear all cached location descriptions
// Run with: node scripts/clear-descriptions.js

// Note: This is a Node.js script, but AsyncStorage is React Native specific
// For React Native, use the clearDescriptionCache function instead

console.log('To clear descriptions in React Native app:');
console.log('1. Use the clearDescriptionCache() function from lib/location-descriptions.ts');
console.log('2. Or manually clear AsyncStorage key: @location_base_descriptions');
console.log('');
console.log('In your app, you can call:');
console.log('import { clearDescriptionCache } from "@/lib/location-descriptions";');
console.log('await clearDescriptionCache();');

