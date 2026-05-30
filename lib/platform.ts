/**
 * Detects if the current environment is running inside Capacitor (Android/iOS WebView).
 */
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}
