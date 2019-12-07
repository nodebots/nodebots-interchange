const Downloader = require('../lib/downloader');

let downloader;
const fw = {
  'name': 'test_firmware',
  'deviceID': 0x01,
  'creatorID': 0x00,
  'repo': 'github',
  'firmata': false
};

const npm_fw = {
  'name': 'test_firmware',
  'deviceID': 0x01,
  'creatorID': 0x00,
  'npm': {
    'package': 'test-pkg'
  },
  'firmata': false
};


const download_actions = () => describe('1. Download options return hex files', () => {
  test('1.1 Pass in a firmware and it stays set', () => {
    downloader = new Downloader({fw});
    expect(downloader.fw.name).toBe(fw.name);
    expect(downloader.fw.firmata).toBe(false);
    expect(downloader.fw.repo).toBe(fw.repo);
  });

  test('1.2 No firmware set if not in constructor', () => {
    const dl = new Downloader();
    expect(dl.fw).toBeUndefined();
  });

  test('1.3 call download with no firmware set throws an error', () => {
    const dl = new Downloader();
    expect.assertions(1);
    expect(dl.download()).rejects.toThrow(/no firmware/);
  });

  test('1.4 Firmware in NPM chooses NPM download method', () => {
    const dl = new Downloader(npm_fw);
  });

  test('1.5 Firmware in Github chooses Github download method', () => {
  });
});

download_actions();
