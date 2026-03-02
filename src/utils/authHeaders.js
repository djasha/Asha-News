import { firebaseAuthService } from '../services/firebase';

export async function buildAuthHeaders(baseHeaders = {}, tokenOverride = null) {
  const token = tokenOverride || await firebaseAuthService.getUserToken();
  if (!token) return { ...baseHeaders };
  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}
