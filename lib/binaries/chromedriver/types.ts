// Created using https://app.quicktype.io/

export interface ILastGoodVersionWithDownloads {
  timestamp: Date;
  channels: Channels;
}

export interface IKnownGoodVersionsWithDownloads {
  timestamp: Date;
  versions: Version[];
}

export interface Version {
  version: string;
  revision: string;
  downloads: Downloads;
}

export interface Channels {
  Stable: Beta;
  Beta: Beta;
  Dev: Beta;
  Canary: Beta;
}

export interface Beta {
  channel: string;
  version: string;
  revision: string;
  downloads: Downloads;
}

export interface Downloads {
  chrome: Chrome[];
  chromedriver: Chrome[];
  'chrome-headless-shell': Chrome[];
}

export interface Chrome {
  platform: ChromeDriverPlatform;
  url: string;
}

export type ChromeDriverPlatform =|'linux64'|'mac-arm64'|'mac-x64'|'win32'|'win64';
