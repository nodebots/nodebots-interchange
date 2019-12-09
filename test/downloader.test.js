const child_process = require('child_process');
jest.mock('child_process');

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

const gh_fw = {
  'name': 'test_firmware',
  'deviceID': 0x01,
  'creatorID': 0x00,
  'repo': 'git+https://github.com/test/test-package',
  'firmata': false
};

const gh_fw2 = {
  'name': 'test_firmware2',
  'deviceID': 0x01,
  'creatorID': 0x00,
  'firmata': false
};

const gh_fw3 = {
  'name': 'test_firmware3',
  'deviceID': 0x01,
  'creatorID': 0x00,
  'repo': 'https://github.com/test/test-package',
  'firmata': false
};

const manifest = {
  'backpack': {
    'bins': '/firmware/bin/backpack/',
    'hexPath': '/backpack.ino.hex'
  },
  'firmata': {
    'bins': '/firmware/bin/firmata/',
    'hexPath': '/firmata.ino.hex'
  }
};

const options = {
  board: 'nano',
  port: '/dev/dummy',
  firmata: true,
  i2c_address: undefined,
  useFirmata: true,
  firmataName: ''
};


const download_actions = () => describe('1. Download options return hex files', () => {
  beforeEach(() => jest.resetModules());

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

  test('1.4 Firmware in NPM chooses NPM download method', async() => {
    const dl = new Downloader({fw: npm_fw});

    // set up a mock implementation for the download instance which passes and fails
    const mock_download = jest.fn()
      .mockResolvedValue('mock/filepath')
      .mockResolvedValueOnce('mock-firstpath')
      .mockRejectedValueOnce(new Error('not downloadable'));

    dl.download_from_npm = mock_download;

    const hexfile = await dl.download();
    expect(mock_download).toBeCalled();
    // test rejection form
    expect(dl.download()).rejects.toThrow(/not downloadable/);
  });

  test('1.5 Firmware in Github chooses Github download method', async() => {
    const dl = new Downloader({fw: gh_fw});

    // set up a mock implementation for the download instance which passes and fails
    const mock_download = jest.fn()
      .mockResolvedValue('mock/filepath')
      .mockResolvedValueOnce('mock-firstpath')
      .mockRejectedValueOnce(new Error('not downloadable'));

    dl.download_from_github = mock_download;

    const hexfile = await dl.download();
    expect(mock_download).toBeCalled();
    // test rejection form
    expect(dl.download()).rejects.toThrow(/not downloadable/);
  });


  test('1.8 Reading manifest file fails if no firmware or manifest data', () => {
    const dl = new Downloader();
    const no_manifest = () => { dl.get_path_from_manifest(undefined, npm_fw) };
    const no_firmware = () => { dl.get_path_from_manifest(manifest, undefined) };
    const no_options = () => { dl.get_path_from_manifest(manifest, npm_fw, undefined) };

    expect(no_manifest).toThrow(/manifest/);
    expect(no_firmware).toThrow(/firmware/);
    expect(no_options).toThrow(/options/);
  });

  test('1.8 Get hex path from manifest', () => {
    const dl = new Downloader();

    // try standard form which gets firmata
    const hexpath = dl.get_path_from_manifest(manifest, npm_fw, options);
    expect(hexpath).toBe('/firmware/bin/firmata/nano/firmata.ino.hex');

    // now try and get a backpack
    const o2 = options;
    o2.board = 'uno';
    o2.useFirmata = false;
    const hp2 = dl.get_path_from_manifest(manifest, npm_fw, o2);
    expect(hp2).toBe('/firmware/bin/backpack/uno/backpack.ino.hex');
  });
});

const download_utilities = () => describe('2. Utilities to help download', () => {
  test('2.1 Basepath for npm fails if no firmware provided', () => {
    const dl = new Downloader();

    const no_firmware = () => { dl.get_npm_basepath() };
    expect(no_firmware).toThrow(/firmware/);
  });

  test('2.2 Basepath for npm fails if no npm package provided', () => {
    const dl = new Downloader();

    const no_npm = () => { dl.get_npm_basepath({npm: { repo: 'test'}}) };
    expect(no_npm).toThrow(/npm/);
  });

  test('2.3 Basepath for npm is properly formed', () => {
    const dl = new Downloader();
    expect(dl.get_npm_basepath(npm_fw)).toBe('node_modules/test-pkg');
  });
});

const npm_actions = () => describe('3. NPM related actions for the downloader', () => {
  // test actions related to the NPM method of downloading things.

  test('3.1 Getting NPM manifest fails if no firmware supplied', () => {
    const dl = new Downloader();
    expect(dl.get_manifest_from_npm).toThrow(/firmware/);
  });

  test('3.2 Getting NPM manifest', async() => {
    const dl = new Downloader();

    // set up a mock implementation so we don't need to install package via npm
    child_process.execSync.mockReturnValue(true);
    const mock_npm_get_manifest = jest.fn()
      .mockReturnValue(manifest)

    dl.get_manifest_from_npm = mock_npm_get_manifest;

    const hexpath = await dl.download_from_npm(npm_fw, options);
    expect(hexpath).toBe('node_modules/test-pkg/firmware/bin/backpack/uno/backpack.ino.hex');
  });
});

const github_actions = () => describe('4. Github related actions for the downloader', () => {
  // test actions relating to the GH way of getting the files
  test('4.1 Getting GH manifest fails if no repo supplied', () => {
    const dl = new Downloader();
    expect(dl.download_from_github()).rejects.toThrow(/firmware/);
  });

  test('4.2 getting GH manifest fails if GH configuration is wrong', () => {
    const dl = new Downloader();
    expect(dl.download_from_github(gh_fw2)).rejects.toThrow(/github/);
    expect(dl.download_from_github(gh_fw3)).rejects.toThrow(/protocol/);
  });
});


download_actions();
download_utilities();
npm_actions();
github_actions();
