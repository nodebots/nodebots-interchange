
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
    expect(interchange.list_devices().firmwares).toBeDefined();
    const f = interchange.list_devices().firmwares[0];
    expect(f.name).toBeDefined();
    expect(f.firmata).toBeDefined();
    expect(f.description).toBeDefined();
  });

  test('1.2 can we list the ports', () => {
    expect(interchange.list_ports()).toBeDefined();
  });
});

interchange_shape();
