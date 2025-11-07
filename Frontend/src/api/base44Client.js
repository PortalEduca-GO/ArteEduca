import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client without authentication requirement
export const base44 = createClient({
  appId: "68d01ff17e017d39292ccc5f", 
  requiresAuth: false // Allow access without authentication
});
