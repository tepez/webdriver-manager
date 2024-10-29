import * as fs from 'fs';
import * as path from 'path';
import {Config} from '../config';
import {requestBody} from '../http_utils';

import {BinaryUrl} from './binary';
import {IKnownGoodVersionsWithDownloads, ILastGoodVersionWithDownloads} from './chromedriver/types';
import {getChromeDriverPlatform, knownGoodVersionsWithDownloadsUrl, lastKnownGoodVersionsWithDownloadsUrl,} from './chromedriver/utils';
import {XmlConfigSource} from './config_source';

export class ChromeXml extends XmlConfigSource {
  maxVersion = Config.binaryVersions().maxChrome;

  constructor() {
    super('chrome', Config.cdnUrls()['chrome']);
  }

  getUrl(version: string): Promise<BinaryUrl> {
    if (version === 'latest') {
      return this.getLatestChromeDriverVersion();
    } else {
      return this.getSpecificChromeDriverVersion(version);
    }
  }

  /**
   * Get a list of chrome drivers paths available for the configuration OS type and architecture.
   */
  getVersionList(): Promise<string[]> {
    return this.getXml().then(xml => {
      let versionPaths: string[] = [];
      let osType = this.getOsTypeName();

      for (let content of xml.ListBucketResult.Contents) {
        let contentKey: string = content.Key[0];

        if (
            // Filter for 32-bit devices, make sure x64 is not an option
            (this.osarch.includes('64') || !contentKey.includes('64')) &&
            // Filter for x86 macs, make sure m1 is not an option
            ((this.ostype === 'Darwin' && this.osarch === 'arm64') || !contentKey.includes('m1'))) {
          // Filter for only the osType
          if (contentKey.includes(osType)) {
            versionPaths.push(contentKey);
          }
        }
      }
      return versionPaths;
    });
  }

  /**
   * Helper method, gets the ostype and gets the name used by the XML
   */
  getOsTypeName(): string {
    // Get the os type name.
    if (this.ostype === 'Darwin') {
      return 'mac';
    } else if (this.ostype === 'Windows_NT') {
      return 'win';
    } else {
      return 'linux';
    }
  }

  /**
   * Gets the latest item from the XML.
   */
  private async getLatestChromeDriverVersion(): Promise<BinaryUrl> {
    const lastKnownGoodVersionsWithDownloadsRaw =
        await requestBody(lastKnownGoodVersionsWithDownloadsUrl);

    const latestVersionBody =
        (JSON.parse(lastKnownGoodVersionsWithDownloadsRaw) as ILastGoodVersionWithDownloads)
            .channels.Stable;

    const latestVersion = latestVersionBody.version;
    const latestVersionUrl = latestVersionBody.downloads.chromedriver
                                 .find(obj => obj.platform == getChromeDriverPlatform())
                                 .url;

    const latestMajorVersion = latestVersion.split('.')[0];

    const localVersionFileName =
        fs.readdirSync(path.resolve(__dirname, '..', '..', '..', 'selenium'))
            .find(f => f.startsWith(`chromedriver_${latestMajorVersion}`)) ||
        '';

    const localVersion = localVersionFileName.split('_').pop().replace(/\.exe$/, '');
    const localVersion_Url = latestVersionUrl.replace(latestVersion, localVersion);
    const localMajorVersion = localVersion.split('.')[0];

    if (latestMajorVersion == localMajorVersion) {
      return {
        url: localVersion_Url,
        version: localVersion,
      };
    } else {
      return {
        url: latestVersionUrl,
        version: latestVersion,
      };
    }
  }

  /**
   * Gets a specific item from the XML.
   */
  private async getSpecificChromeDriverVersion(inputVersion: string): Promise<BinaryUrl> {
    const knownGoodVersionsWithDownloadsRaw = await requestBody(knownGoodVersionsWithDownloadsUrl);

    const allVersions =
        (JSON.parse(knownGoodVersionsWithDownloadsRaw) as IKnownGoodVersionsWithDownloads).versions

    const version = allVersions.find((itr) => itr.version === inputVersion);
    if (!version)
      throw new Error(`Chrome version ${inputVersion} in ${knownGoodVersionsWithDownloadsUrl}`);

    const download =
        version.downloads.chromedriver.find((itr) => itr.platform === getChromeDriverPlatform());
    if (!download)
      throw new Error(`Can't find download for platform ${getChromeDriverPlatform()} for version ${
          inputVersion} in ${knownGoodVersionsWithDownloadsUrl}`);

    return {
      url: download.url,
      version: inputVersion,
    };
  }
}

/**
 * Chromedriver is the only binary that does not conform to semantic versioning
 * and either has too little number of digits or too many. To get this to be in
 * semver, we will either add a '.0' at the end or chop off the last set of
 * digits. This is so we can compare to find the latest and greatest.
 *
 * Example:
 *   2.46 -> 2.46.0
 *   75.0.3770.8 -> 75.0.3770
 *
 * @param version
 */
export function getValidSemver(version: string): string {
  let lookUpVersion = '';
  // This supports downloading 2.46
  try {
    const oldRegex = /(\d+.\d+)/g;
    const exec = oldRegex.exec(version);
    if (exec) {
      lookUpVersion = exec[1] + '.0';
    }
  } catch (_) {
    // no-op: is this is not valid, do not throw here.
  }
  // This supports downloading 74.0.3729.6
  try {
    const newRegex = /(\d+.\d+.\d+).\d+/g;
    const exec = newRegex.exec(version);
    if (exec) {
      lookUpVersion = exec[1];
    }
  } catch (_) {
    // no-op: if this does not work, use the other regex pattern.
  }
  return lookUpVersion;
}
