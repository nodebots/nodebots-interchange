const avrgirl = require('avrgirl-arduino');
const fs = require('fs');
const tmp = require('tmp');
const Serialport = require('serialport');

const Interchange = require('../lib/interchange');

const creators = require('../lib/firmwares.json').creators;
const firmwares = require('../lib/firmwares.json').firmwares;
const data = require('./config/interchange');

jest.mock('../lib/downloader');
const Downloader = require('../lib/downloader');

jest.mock('avrgirl-arduino');

let interchange;

const interchange_shape = () => describe('1.Shape of the interchange object is correct', () => {
  // Check that all of the lib works properly.
  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('1.1 Can we list the firmwares', () => {
    // console.log(interchange);
    expect(interchange.list_devices()).toBeDefined();
    const f = interchange.list_devices()[0];
    expect(f.name).toBeDefined();
    expect(f.firmata).toBeDefined();
    expect(f.description).toBeDefined();
  });

  test('1.2 can we get the ports', () => {
    // do this as a promise and then execute
    Serialport.list = jest.fn().mockImplementation(() => {
      const ports = [{path: '/dev/to/path'}];
      return Promise.resolve(ports );
    });
    return interchange.get_ports().then(ports => {
      expect(ports).toBeDefined();
    });
  });

  test('1.3 Does list ports return the same as get ports', async() => {
    const list = await interchange.list_ports();
    const get = await interchange.get_ports();
    expect(list).toBeDefined();
    expect(get).toBeDefined();
    expect(get).toEqual(list);
  });

  test('1.4 Does the firwares object exist', () => {
    expect(interchange.firmwares).toBeDefined();
  });

  test('1.5 If there is an error with getting the ports does it get shown', (done) => {
    Serialport.list = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('cannot list serialports'));
    });

    expect.assertions(1);
    return interchange.get_ports()
      .catch(err => {
        expect(err.toString()).toMatch(/serialports/);
        done();
      });
  });
});

const interchange_utilities = () => describe('2. Utility actions should run correctly', () => {
  // Check that the various utility actions occur properly.
  beforeAll(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('2.1 Are temporary directories removed', () => {
    const tmpdir = tmp.dirSync();

    // whilst this doesn't test our lib it does just make sure it's set up right.
    expect(fs.existsSync(tmpdir.name)).toBe(true);

    // now we test if it's worked or not
    interchange.clean_temp_dir(tmpdir);
    expect(fs.existsSync(tmpdir.name)).toBe(false);
  });
});

const interchange_install = () => describe('3. Installation actions should run correctly', () => {
  const check_firmware_mock_pass = jest.fn().mockImplementation((f, o) => {
    // creates a simple passing mock for firmware check
    o['useFirmata'] = true;
    return {fw: f, opts: o};
  });

  const check_firmware_backpack_mock_pass = jest.fn().mockImplementation((f, o) => {
    // returns an object appropriate for a backpack
    o['useFirmata'] = false;
    return {fw: f, opts: o};
  });

  const download_firmware_mock_fail = jest.fn().mockImplementation((f, o) => {
    // creates a rejecting mock for download
    return Promise.reject(new Error('Cannot download firmware'));
  });

  const download_firmware_mock_pass = jest.fn().mockImplementation((f, o) => {
    // creates a resolving mock for download
    return Promise.resolve({hexpath: '/path/to/file', tmpdir: 'data'});
  });

  const download_firmware_mock_pass_no_tmp = jest.fn().mockImplementation((f, o) => {
    // creates a resolving mock for download with no returned tmp file.
    return Promise.resolve({hexpath: '/path/to/file'});
  });

  const flash_firmware_mock_fail = jest.fn().mockImplementation((hp, o) => {
    // creates a rejecting mock for download
    return Promise.reject(new Error('Cannot flash firmware'));
  });

  const flash_firmware_mock_pass = jest.fn().mockImplementation((hp, o) => {
    // creates a resolving mock for download
    return Promise.resolve('/dev/path/to/port');
  });

  const set_firmware_details_mock_fail = jest.fn().mockImplementation((f, o) => {
    // creates a rejecting mock for firmare config
    return Promise.reject(new Error('Cannot configure firmware'));
  });

  const set_firmware_details_mock_pass = jest.fn().mockImplementation((f, o) => {
    // creates a resolving mock for firmare config
    return Promise.resolve(true);
  });

  const clean_temp_dir_mock_pass = jest.fn().mockImplementation((tmpdir) => {
    return true;
  });

  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('3.1 Throw error if no firmware given to installer', (done) => {
    expect.assertions(1)
    return interchange.install_firmware(null)
      .catch(err => {
        expect(err.toString()).toMatch(/firmware/);
        done();
      });
  });

  test('3.2 Install should throw the error if download fails', (done) => {
    const {fw, options} = data;

    interchange.check_firmware = check_firmware_mock_pass;
    interchange.download_firmware = download_firmware_mock_fail;

    expect.assertions(1);
    return interchange.install_firmware(fw, options)
      .catch(err => {
        expect(err.toString()).toMatch(/download/);
        done();
      });
  });

  test('3.3 Install should throw an error if the flash fails', (done) => {
    const {fw, options} = data;

    interchange.check_firmware = check_firmware_mock_pass;
    interchange.download_firmware = download_firmware_mock_pass;
    interchange.flash_firmware = flash_firmware_mock_fail;

    expect.assertions(1);
    return interchange.install_firmware(fw, options)
      .catch(err => {
        expect(err.toString()).toMatch(/flash/);
        done();
      });
  });

  test('3.4 Install should flash and then return the port of the flashed board', (done) => {
    const {fw, options} = data;

    interchange.check_firmware = check_firmware_mock_pass;
    interchange.download_firmware = download_firmware_mock_pass_no_tmp;
    interchange.flash_firmware = flash_firmware_mock_pass;

    // expect.assertions(1);
    return interchange.install_firmware(fw, options)
      .then(() => {
        // only test needed here is that everything returned okay.
        done();
      });
  });

  test('3.5 Install should throw an error if firmware config fails', (done) => {
    const {fw_backpack, options_backpack} = data;

    interchange.clean_temp_dir = clean_temp_dir_mock_pass;
    interchange.check_firmware = check_firmware_backpack_mock_pass;
    interchange.download_firmware = download_firmware_mock_pass;
    interchange.flash_firmware = flash_firmware_mock_pass;
    interchange.set_firmware_details = set_firmware_details_mock_fail;

    expect.assertions(1);
    return interchange.install_firmware('backpack_firmware_test', options_backpack)
      .catch(err => {
        expect(err.toString()).toMatch(/Cannot configure firmware/);
        done();
      });
  });

  test('3.6 Install should return true if firmware config passes', (done) => {
    const {fw_backpack, options_backpack} = data;

    interchange.clean_temp_dir = clean_temp_dir_mock_pass;
    interchange.check_firmware = check_firmware_backpack_mock_pass;
    interchange.download_firmware = download_firmware_mock_pass;
    interchange.flash_firmware = flash_firmware_mock_pass;
    interchange.set_firmware_details = set_firmware_details_mock_pass;

    expect.assertions(1);
    return interchange.install_firmware('backpack_firmware_test', options_backpack)
      .then((result) => {
        expect(result).toBe(true);
        done();
      });
  });
  // TODO Test that the client connection etc all works as necessary to configure
  // interchange client.
});

const interchange_download = () => describe('4. Interchange should set up the download correctly', () => {
  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('4.1 Download fails if no firmware is supplied', () => {
    Downloader.mockImplementation(() => {
      return {
        download: (f, o) => { return Promise.reject(new Error('no firmware provided')) }
      }
    });
    return expect(interchange.download_firmware()).rejects.toThrow(/firmware/);
  });

  test('4.2 Download returns an object that has a hex path and a temp file', (done) => {
    const { fw, options } = data;
    // set up a mock implementation so we don't need to install package via npm
    Downloader.mockImplementation(() => {
      return {
        download: (f, o) => { return Promise.resolve({hexpath: '/path/to/file', tmpdir: 'data'}) }
      }
    });

    expect.assertions(2);
    return interchange.download_firmware(fw, options)
      .then(({hexpath, tmpdir}) => {
        expect(hexpath).toBe('/path/to/file');
        expect(tmpdir).toBe('data');
        done();
      });
  });
});

const interchange_flash = () => describe('5. Flashing of firmware is handled properly', () => {
  // Check that all of the lib works properly.
  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('5.1 If flash fails it should throw an error from the promise', (done) => {
    const { fw, options } = data;
    // set up a mock implementation so we don't need to install package via npm
    avrgirl.mockImplementation(() => {
      return {
        flash: (f, cb) => {
          const err = new Error('cannot write to serialport');
          cb(err);
        }
      }
    });
    expect.assertions(1);
    return interchange.flash_firmware(fw, options)
      .catch(err => {
        expect(err.toString()).toMatch(/write/);
        done();
      });
  });

  test('5.2 If flash works it should return the port that was flashed to', (done) => {
    const {fw, options} = data;
    // set up a mock implementation so we don't need to install package via npm
    // which returns correctly.
    avrgirl.mockImplementation(() => {
      return {
        flash: (f, cb) => {
          cb(null, '');
        }
      }
    });
    expect.assertions(1);
    return interchange.flash_firmware(fw, options)
      .then(port => {
        expect(port).toEqual(options.port);
        done();
      });
  });

  test('5.3 If flash works with empty port it should return the one flashed to', (done) => {
    const {fw, options_no_port} = data;
    avrgirl.mockImplementation(() => {
      return {
        flash: (f, cb) => { cb(null, '/dev/path/to/port') },
        options: {
          port: '/dev/path/to/port'
        }
      }
    });
    expect.assertions(1);
    return interchange.flash_firmware(fw, options_no_port)
      .then(port => {
        expect(port).toEqual('/dev/path/to/port');
        done();
      });
  });
});

const interchange_check = () => describe('6. Preinstallation checks work correctly', () => {
  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();
  });

  test('6.1 Passing in a git repo url should return a firmware object', () => {
    const url = 'git+https://github.com/test/test';
    const {fw,opts} = interchange.check_firmware(url);

    expect(fw).toBeDefined();
    expect(fw.name).toBeDefined();
    expect(fw.repo).toBeDefined();
    expect(fw.name).toEqual(url);
    expect(fw.repo).toEqual(url);
  });

  test('6.2 Throw error if failure of firmware check', () => {
    const no_firmware_name = () => { interchange.check_firmware(null) };
    const invalid_firmware_name = () => { interchange.check_firmware('test') };

    expect(no_firmware_name).toThrowError(/firmware/);
    expect(invalid_firmware_name).toThrowError(/firmware/);
  });
});

interchange_shape();
interchange_utilities();
interchange_install();
interchange_download();
interchange_flash();
interchange_check();
