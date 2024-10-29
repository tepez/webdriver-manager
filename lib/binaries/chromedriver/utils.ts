import * as os from 'os';
import {ChromeDriverPlatform} from './types';

export function getChromeDriverPlatform(): ChromeDriverPlatform {
  const arch = os.arch()

  switch (os.platform()) {
    case 'darwin':
      return arch === 'x64' ? 'mac-x64' : 'mac-arm64';
    case 'win32':
      return arch === 'x64' ? 'win64' : 'win32';
    default:
      return 'linux64';
  }
}


/**
 * Source:
 * https://github.com/GoogleChromeLabs/chrome-for-testing?tab=readme-ov-file#json-api-endpoints
 */
export const lastKnownGoodVersionsWithDownloadsUrl =
    'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json';

export const knownGoodVersionsWithDownloadsUrl =
    'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';