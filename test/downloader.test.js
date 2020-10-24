const axios         = require('axios');
const fs            = require('fs');
const fsextra       = require('fs-extra');
const child_process = require('child_process');
jest.mock('child_process');


const Downloader = require('../lib/downloader');
const data = require('./config/downloader');

const download_actions = () => describe('1. Download options return hex files', () => {
  let dl;

  beforeEach(() => {
    jest.resetModules();
    dl = new Downloader();
  });

  test('1.1 Pass in a firmware and it stays set', () => {
    const {fw} = data;
    const downloader = new Downloader({fw});
    expect(downloader.fw.name).toBe(fw.name);
    expect(downloader.fw.firmata).toBe(false);
    expect(downloader.fw.repo).toBe(fw.repo);
  });

  test('1.2 No firmware set if not in constructor', () => {
    expect(dl.fw).toBeUndefined();
  });

  test('1.3 call download with no firmware set throws an error', () => {
    expect.assertions(1);
    expect(dl.download()).rejects.toThrow(/no firmware/);
  });

  test('1.4 Firmware in NPM chooses NPM download method', async() => {
    const {npm_fw} = data;
    const dl2 = new Downloader({fw: npm_fw});

    // set up a mock implementation for the download instance which passes and fails
    const mock_download = jest.fn()
      .mockResolvedValue('mock/filepath')
      .mockResolvedValueOnce('mock-firstpath')
      .mockRejectedValueOnce(new Error('not downloadable'));

    dl2.download_from_npm = mock_download;

    const hexfile = await dl2.download();
    expect(mock_download).toBeCalled();
    // test rejection form
    expect(dl2.download()).rejects.toThrow(/not downloadable/);
  });

  test('1.5 Firmware in Github chooses Github download method', async() => {
    const {gh_fw} = data;
    const dl3 = new Downloader({fw: gh_fw});

    // set up a mock implementation for the download instance which passes and fails
    const mock_download = jest.fn()
      .mockResolvedValue('mock/filepath')
      .mockResolvedValueOnce('mock-firstpath')
      .mockRejectedValueOnce(new Error('not downloadable'));

    dl3.download_from_github = mock_download;

    const hexfile = await dl3.download();
    expect(mock_download).toBeCalled();
    // test rejection form
    expect(dl3.download()).rejects.toThrow(/not downloadable/);
  });

  test('1.6 Reading manifest file fails if no firmware or manifest data', () => {
    const {npm_fw, manifest} = data;
    const no_manifest = () => { dl.get_path_from_manifest(undefined) };
    const no_options = () => { dl.get_path_from_manifest(manifest, undefined) };

    expect(no_manifest).toThrow(/manifest/);
    expect(no_options).toThrow(/options/);
  });

  test('1.7 Get hex path from manifest', () => {
    const {npm_fw, manifest, options, backpack_options} = data;

    // try standard form which gets firmata
    const hexpath = dl.get_path_from_manifest(manifest, options);
    expect(hexpath).toBe('/firmware/bin/firmata/nano/firmata.ino.hex');

    // now try and get a backpack
    const hp2 = dl.get_path_from_manifest(manifest, backpack_options);
    expect(hp2).toBe('/firmware/bin/backpack/uno/backpack.ino.hex');
  });

  test('1.8 Manifest HexPath no leading / resolves correctly', () => {
    const {npm_fw, manifest, backpack_options} = data;
    const hexpath = dl.get_path_from_manifest(manifest, backpack_options);
    expect(hexpath).toBe('/firmware/bin/backpack/uno/backpack.ino.hex');
  });

  test('1.9 No firmata name with a multi-firmata manifest should throw an error', () => {
    const {npm_fw, multi_manifest, options} = data;
    const no_name = () => { dl.get_path_from_manifest(multi_manifest, options) };
    expect(no_name).toThrow(/Multiple firmatas/);
  });

  test('1.10 Using a named firmata should return it from the manifest', () => {
    const {npm_fw, multi_manifest, named_firmata_options} = data;
    const hexpath = dl.get_path_from_manifest(multi_manifest, named_firmata_options);

    const expectedpath = `${multi_manifest.firmata.firmata2.bins}${named_firmata_options.board}${multi_manifest.firmata.firmata2.hexPath}`;
    expect(hexpath).toBe(expectedpath);
  });
});

const download_utilities = () => describe('2. Utilities to help download', () => {
  // test the various utility functions
  let dl;

  beforeEach(() => {
    jest.resetModules();
    dl = new Downloader();
  });

  test('2.1 Basepath for npm fails if no is firmware provided', () => {
    const no_firmware = () => { dl.get_npm_basepath() };
    expect(no_firmware).toThrow(/firmware/);
  });

  test('2.2 Basepath for npm fails if no npm package provided', () => {
    const no_npm = () => { dl.get_npm_basepath({npm: { repo: 'test'}}) };
    expect(no_npm).toThrow(/npm/);
  });

  test('2.3 Basepath for npm is properly formed', () => {
    const {npm_fw} = data;
    expect(dl.get_npm_basepath(npm_fw)).toBe('node_modules/test-pkg');
  });
});

const npm_actions = () => describe('3. NPM related actions for the downloader', () => {
  // test actions related to the NPM method of downloading things.
  let dl;

  beforeEach(() => {
    jest.resetModules();
    dl = new Downloader();
  });

  test('3.1 Getting NPM manifest fails if no firmware supplied', () => {
    expect(dl.get_manifest_from_npm).toThrow(/firmware/);
  });

  test('3.2 Get an NPM installed manifest and return the path to the hex file', async() => {
    const {npm_fw, options, manifest} = data;

    // set up a mock implementation so we don't need to install package via npm
    child_process.execSync.mockReturnValue(true);
    const mock_npm_get_manifest = jest.fn()
      .mockReturnValue(manifest)

    dl.get_manifest_from_npm = mock_npm_get_manifest;

    const {hexpath} = await dl.download_from_npm(npm_fw, options);
    expect(hexpath).toBe('node_modules/test-pkg/firmware/bin/firmata/nano/firmata.ino.hex');
  });

  test('3.3 If the npm installation process fails, it should return an error', (done) => {
    const {npm_fw, options, manifest} = data;

    // set up a mock implementation so we don't need to install package via npm
    child_process.execSync
      .mockImplementation(() => {
        throw new Error('Installation failed')
      });

    const mock_npm_get_manifest = jest.fn()
      .mockReturnValue(manifest)

    dl.get_manifest_from_npm = mock_npm_get_manifest;

    expect.assertions(1);
    return dl.download_from_npm(npm_fw, options)
      .catch(err => {
        expect(err.toString()).toMatch(/Installation failed/);
        done();
      });
  });

  test('3.4 Installing via npm using a github repo should implement correct npm command', () => {
    const {npm_fw_repo, options, manifest} = data;

    // set up a mock implementation of the child process to be able to
    // introspect the command parameter
    child_process.execSync
      .mockImplementation((command) => {
        expect(command).toBe(`npm install --no-save ${npm_fw_repo.npm.repo}`);
        return true;
      });

    const mock_npm_get_manifest = jest.fn()
      .mockReturnValue(manifest)

    dl.get_manifest_from_npm = mock_npm_get_manifest;

    expect.assertions(1);
    return dl.download_from_npm(npm_fw_repo, options);
  });

  test('3.4 Installing package with a version should set the right npm command', () => {
    const {npm_fw_ver, options, manifest} = data;

    // set up a mock implementation of the child process to be able to
    // introspect the command parameter
    child_process.execSync
      .mockImplementation((command) => {
        expect(command).toBe(`npm install --no-save ${npm_fw_ver.npm.package}@${npm_fw_ver.npm.version}`);
        return true;
      });

    const mock_npm_get_manifest = jest.fn()
      .mockReturnValue(manifest)

    dl.get_manifest_from_npm = mock_npm_get_manifest;

    expect.assertions(1);
    return dl.download_from_npm(npm_fw_ver, options);
  });

  test('3.5 .get_manifest_from_npm() should return a manifest file from the node_modules folder', () => {
    const {manifest, npm_fw} = data;

    const backup = fs.readFileSync;

    fs.readFileSync = jest.fn().mockImplementation((path) => {
      return JSON.stringify(manifest);
    });

    const m = dl.get_manifest_from_npm(npm_fw);
    fs.readFileSync = backup;

    expect(m).toBeDefined();
    expect(m.backpack).toBeDefined();
    expect(m.firmata).toBeDefined();
  });

  test('3.6 .get_manifest_from_npm() should throw an error if manifest file is incorrect', () => {
    const {manifest, npm_fw} = data;

    const backup = fs.readFileSync;

    fs.readFileSync = jest.fn().mockImplementation((path) => {
      return 'This is some non json data';
    });

    const get_manifest_error = () => {dl.get_manifest_from_npm(npm_fw)};
    expect(get_manifest_error).toThrow(/Manifest file incorrect/);
    fs.readFileSync = backup;
  });
});

const github_actions = () => describe('4. Github related actions for the downloader', () => {
  // test actions relating to the GH way of getting the files
  let dl;
  let temppath;
  beforeEach(() => {
    jest.resetModules();
    dl = new Downloader();
  });

  afterEach(() => {
    // clean up temp path if it's been set
    if (temppath) {
      fsextra.removeSync(temppath.name);
      temppath = null;
    }
  });

  test('4.1 Getting GH manifest fails if no repo supplied', () => {
    // const dl = new Downloader();
    expect(dl.download_from_github()).rejects.toThrow(/firmware/);
  });

  test('4.2 getting GH manifest fails if GH configuration is wrong', () => {
    // tests no repo provided and no git+ssh on path
    const {gh_fw2, gh_fw3} = data;
    // const dl = new Downloader();
    expect(dl.download_from_github(gh_fw2)).rejects.toThrow(/github/);
    expect(dl.download_from_github(gh_fw3)).rejects.toThrow(/protocol/);
  });

  test('4.3 Resolve manifest from GitHub if git branch is supplied', (done) => {
    // const dl4 = new Downloader();
    const {manifest, gh_branch_fw, options} = data;

    const mock_download = jest.fn()
      .mockResolvedValue(manifest)
      .mockResolvedValueOnce(manifest)
      .mockResolvedValueOnce('data');

    dl.get_file_from_github = mock_download;

    expect.assertions(3);
    return dl.download_from_github(gh_branch_fw, options)
      .then((m) => {
        expect(dl.get_file_from_github).toHaveBeenCalled();
        expect(m.hexpath).toBeDefined();
        expect(m.tmpdir).toBeDefined();
        // clean up tmp files
        temppath = m.tmpdir;
        done();
      });
  });

  test('4.4 Resolve manifest file if branch not supplied', (done) => {
    // this tests using master branch.
    const {manifest, gh_master_branch_fw, options} = data;

    const mock_download = jest.fn()
      .mockResolvedValue(manifest)
      .mockResolvedValueOnce(manifest)
      .mockResolvedValueOnce('data');

    dl.get_file_from_github = mock_download;

    expect.assertions(3);
    return dl.download_from_github(gh_master_branch_fw, options)
      .then((m) => {
        expect(dl.get_file_from_github).toHaveBeenCalled();
        expect(m.hexpath).toBeDefined();
        expect(m.tmpdir).toBeDefined();
        // clean up tmp files
        temppath = m.tmpdir;
        done();
      });
  });

  test('4.5 Handle not receiving the hex file from download', (done) => {
    // this tests using master branch.
    const {manifest, gh_master_branch_fw, options} = data;

    const mock_download = jest.fn()
      .mockResolvedValue(manifest)
      .mockResolvedValueOnce(manifest)
      .mockRejectedValueOnce(new Error('Bin download error'));

    dl.get_file_from_github = mock_download;

    expect.assertions(2);
    return dl.download_from_github(gh_master_branch_fw, options)
      .catch(err => {
        expect(dl.get_file_from_github).toHaveBeenCalled();
        expect(err.toString()).toMatch(/download/);
        done();
      });
  });

  test('4.6 get_file_from_github() handles downloads correctly', (done) => {
    // test axios passing then failing.
    jest.mock('axios');
    // set up twp mocks one that passes and the other that fails.
    axios.get = jest.fn().mockImplementationOnce((uri) => {
      return Promise.resolve({status: '200', data: 'filedata'});
    }).mockImplementationOnce((uri) => {
      return Promise.reject(new Error('404'));
    });

    expect.assertions(2);
    // call this the first time with a pass
    return dl.get_file_from_github('passfile')
      .then(file => {
        expect(file).toBe('filedata');

        // now we call it a second time to check failure condition
        return dl.get_file_from_github('failfile')
          .catch(err => {
            expect(err.toString()).toMatch(/Unable to retrieve file/);
            done();
          });
      });
  });

  test('4.7 normalise_gh_repo_path() processes urls correctly', () => {
    // detemrine if we put in the right repo paths we get the right reponses.
    expect(dl.normalise_gh_repo_path('/test/test-package')).toBe('/test/test-package');
    expect(dl.normalise_gh_repo_path('/test/test-package.git')).toBe('/test/test-package');
    expect(dl.normalise_gh_repo_path('/test/test-package/')).toBe('/test/test-package');
  });
});


download_actions();
download_utilities();
npm_actions();
github_actions();
