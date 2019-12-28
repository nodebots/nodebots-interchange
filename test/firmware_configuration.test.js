// This test spec is used specifically to test the configuration scenarios
// of the interchange lib.
const SerialPort = require('serialport');
// const MockBinding = require('@serialport/binding-mock');

const Interchange = require('../lib/interchange');

const interchange_get_info = () => describe('1. Firmware reading works correctly', () => {
  beforeAll(() => {
    // make a temporary serialport
    // MockBinding.createPort('/dev/dummy', {echo: true, record: true});
    // SerialPort.Binding = MockBinding;
  });

  afterAll(() => {
    // MockBinding.close();
  });

  beforeEach(() => {
    jest.resetModules();
    interchange = new Interchange();

    /**
    interchange_client.mockImplementation(() => {
      return {
        port: {
          set(p) {


    });
    **/
  });

  test('7.1 .get_firmware_info() rejects if no port supplied', (done) => {
    expect.assertions(1);
    return interchange.get_firmware_info()
      .catch(err => {
        expect(err.toString()).toMatch(/No port specified/);
        done();
      });
  });

  test('7.2 .get_firmware_info() rejects if there is a client error', (done) => {
    expect.assertions(1);
    return interchange.get_firmware_info('/dev/dummy2')
      .catch(err => {
        expect(err.toString()).toMatch(/cannot open \/dev\/dummy2/);
        done();
      });
  });
});

interchange_get_info();
