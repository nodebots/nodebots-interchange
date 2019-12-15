const fs = require('fs');
const tmp = require('tmp');

const Interchange = require('../lib/interchange');

const creators = require('../lib/firmwares.json').creators;
const firmwares = require('../lib/firmwares.json').firmwares;

let interchange;

const interchange_shape = () => describe('1.Shape of the interchange object is correct', () => {
  // Check that all of the lib works properly.
  beforeAll(() => {
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
});

const interchange_utilities = () => describe('2. Utility actions should run correctly', () => {
  // Check that the various utility actions occur properly.
  beforeAll(() => {
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
  beforeAll(() => {
    interchange = new Interchange();
  });

  test('3.1 Throw error if no firmware given to installer', (done) => {
    const install_firmware = () => { interchange.install_firmware(null) };
    expect.assertions(1)
    return interchange.install_firmware(null)
      .catch(err => {
        expect(err.toString()).toMatch(/firmware/);
        done();
      });
    // return expect(install_firmware).rejects.toThrowError(/firmware/);
  });

  test('3.2 Throw error if failure of firmware check', () => {
    const no_firmware_name = () => { interchange.check_firmware(null) };
    const invalid_firmware_name = () => { interchange.check_firmware('test') };

    expect(no_firmware_name).toThrowError(/firmware/);
    expect(invalid_firmware_name).toThrowError(/firmware/);
  });
});

interchange_shape();
interchange_utilities();
interchange_install();
