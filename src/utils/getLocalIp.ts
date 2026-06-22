/**
 * WebRTC-based private IP address detection with TTL caching.
 * 
 * Uses RTCPeerConnection to generate ICE candidates which reveal
 * the client's local network IP address (e.g., 192.168.x.x, 10.x.x.x).
 * 
 * PRIVACY NOTE: This captures the user's private IP for audit traceability.
 * Ensure compliance with GDPR/local privacy laws before enabling in production.
 * Controlled by VITE_AUDIT_SEND_PRIVATE_IP (default: true).
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  value: string | null;
  timestamp: number;
}

let localIpCache: CacheEntry = { value: null, timestamp: 0 };
let detectionPromise: Promise<string | null> | null = null;

function isPrivateIp(ip: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

async function detectLocalIp(): Promise<string | null> {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(null);
      }, 3000);

      pc.onicecandidate = (ice) => {
        if (!ice.candidate) return;
        const candidate = ice.candidate.candidate;
        const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          const ip = match[1];
          if (isPrivateIp(ip)) {
            clearTimeout(timeout);
            pc.close();
            resolve(ip);
          }
        }
      };
    });
  } catch {
    return null;
  }
}

/**
 * Get the client's private/local IP address.
 * Returns cached value if within TTL, otherwise performs new detection.
 * Returns null if detection fails, times out, or only public IPs found.
 */
export async function getLocalIp(): Promise<string | null> {
  const now = Date.now();
  if (localIpCache.value !== null && (now - localIpCache.timestamp) < CACHE_TTL_MS) {
    return localIpCache.value;
  }

  if (detectionPromise) {
    return detectionPromise;
  }

  detectionPromise = (async () => {
    const ip = await detectLocalIp();
    localIpCache = { value: ip, timestamp: Date.now() };
    detectionPromise = null;
    return ip;
  })();

  return detectionPromise;
}

/**
 * Pre-warm the cache by starting detection early (e.g., on app init).
 * Call this during application bootstrap to avoid delay on first request.
 */
export function prewarmLocalIpDetection(): void {
  getLocalIp();
}

/**
 * Clear the cached IP (useful for testing or forced refresh).
 */
export function clearLocalIpCache(): void {
  localIpCache = { value: null, timestamp: 0 };
  detectionPromise = null;
}