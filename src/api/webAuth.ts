import { encodeBase64 } from './encryption';
import { configuration } from '@/configuration';

/**
 * Generate a URL for web authentication
 * @param publicKey - The ephemeral public key to include in the URL
 * @returns The web authentication URL
 */
export function generateWebAuthUrl(publicKey: Uint8Array): string {
    const publicKeyBase64 = encodeBase64(publicKey, 'base64url');
    if (!configuration.webappUrl) {
        throw new Error('Web auth requires --webapp-url <url> or HAPPY_WEBAPP_URL to be set.');
    }
    return `${configuration.webappUrl}/terminal/connect#key=${publicKeyBase64}`;
}
