const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');

const interchange_client = require('../lib/interchange_client');

let ic_client;

const client_shape = () => describe('1. Client Shape is correct', () => {
  // look at the set up etc and make sure everything looks correct.
  beforeAll(() => {
    // make a temporary serialport
    MockBinding.createPort('/dev/dummy', {echo: true, record: true});
    SerialPort.Binding = MockBinding;
  });

  afterAll(() => {
    MockBinding.close();
  });

  beforeEach(() => {
    jest.resetModules();
    ic_client = new interchange_client.Client();
  });

  test('1.1 Constructor returns an object with appropriate properties', () => {
    expect(ic_client.port).toBeDefined();
    expect(typeof(ic_client.get_info)).toBe('function');
    expect(typeof(ic_client.set_details)).toBe('function');
    expect(typeof(ic_client.close)).toBe('function');
  });

  test('1.2 Client should call the connected event when opened with a valid port', (done) => {
    ic_client.on('connected', () => {
      expect(ic_client.serialport.path).toBe('/dev/dummy');
      expect(ic_client.serialport.binding.isOpen).toBe(true);
      done();
    });

    ic_client.port = '/dev/dummy';
  });

  test('1.3 Client should emit an error event when opened with an invalid port', (done) => {
    ic_client.on('error', (err) => {
      expect(err).toBeDefined();
      expect(err.toString()).toMatch(/Port does not exist/);
      done();
    });

    ic_client.port = '/dev/not_valid';
  });
});

client_shape();
