// This test spec is used specifically to test the configuration scenarios
// of the interchange lib.
const Events = require('events');
// const SerialPort = require('serialport');
// const MockBinding = require('@serialport/binding-mock');

const Interchange = require('../lib/interchange');

jest.mock('../lib/interchange_client');
const interchange_client = require('../lib/interchange_client');

const interchange_get_info = () => describe('1. Firmware reading works correctly', () => {
  beforeAll(() => {
  });

  afterAll(() => {
  });

  beforeEach(() => {
    jest.resetModules();

    // mock up the interchange client key events.
    interchange_client.Client.mockImplementation(() => {
      // need to extend this off the EventEmitter class.
      const self = new Events.EventEmitter();

      let port = null; // use port to determine the behaviour of get info

      self.get_info = jest.fn().mockImplementation((cb) => {
        // note no creatorID as we assign it when we need it.
        const fw = {
          fw_version: '0.1.3',
          ic_version: '0.2.4',
          compile_date: '22 June, 2019',
          i2c_address: 0x27,
          use_custom_addr: 1
        };
        const firmwareID = 0x02;

        if (port === '/dev/dummy_gi_pass') {
          // here we should write dump to the serialport and then
          // get a firmware object back
          cb(null, {...fw, firmwareID, creatorID: 0x05});
        } else if (port === '/dev/dummy_gi_json_error') {
          // here we throw a syntax error because the JSON is malformed
          cb(new Error('SyntaxError: Cannot parse JSON'));
        } else if (port === '/dev/dummy_gi_pass_creator_undefined') {
          // here we send back a firmware object with a bad creator
          cb(null, {...fw, firmwareID, creatorID: undefined});
        } else if (port === '/dev/dummy_gi_pass_creator_fw_undefined') {
          // here we send back a firmware object with a bad creator
          cb(null, {...fw, creatorID: 'undefined'});
        }
      })

      self.close = () => {
        return;
      };

      Object.defineProperties(self, {
        'port': {
          set(p) {
            // use this to throw an error on the port set up
            if (p == '/dev/dummy_port_open_error') {
              setImmediate(() => {
                self.emit('error', new Error('Cannot open /dev/dummy_port_open_error'));
              });
            } else {
              setImmediate(() => {
                // set the port for the get_info behaviours.
                port = p;
                self.emit('ready');
              });
            }
          }
        }
      });
      return self;
    });

    interchange = new Interchange();
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
    return interchange.get_firmware_info('/dev/dummy_port_open_error')
      .catch(err => {
        expect(err.toString()).toMatch(/Cannot open \/dev\/dummy_port_open_error/);
        done();
      });
  });

  test('7.3 .get_firmware_info() returns an object from the client', (done) => {
    expect.assertions(6);
    return interchange.get_firmware_info('/dev/dummy_gi_pass')
      .then(fw => {
        expect(fw.creatorID).toBe('0x05');
        expect(fw.firmwareID).toBe('0x02');
        expect(fw.i2c_address).toBe(0x27);
        expect(fw.firmware_version).toBe('0.1.3');
        expect(fw.interchange_version).toBe('0.2.4');
        expect(fw.use_custom_addr).toBe(1);
        done();
      });
  });

  test('7.4 .get_firmware_info() should reject if client cannot process dumped data', (done) => {
    expect.assertions(1);
    return interchange.get_firmware_info('/dev/dummy_gi_json_error')
      .catch(err => {
        expect(err.toString()).toMatch(/SyntaxError/);
        done();
      });
  });

  test('7.5 .get_firmware_info() should still return a firmware object if creator not found', (done) => {
    expect.assertions(4);
    return interchange.get_firmware_info('/dev/dummy_gi_pass_creator_undefined')
      .then(fw => {
        expect(fw.name).toBe('Unknown');
        expect(fw.creatorID).toBe('0x00');
        expect(fw.creator).toBeDefined();
        expect(fw.creator.name).toBe('Unknown creator');
        done();
      });
  });

  test('7.6 .get_firmware_info() should still return a firmware object if creator undef and fw invalid', (done) => {
    expect.assertions(6);
    return interchange.get_firmware_info('/dev/dummy_gi_pass_creator_fw_undefined')
      .then(fw => {
        expect(fw.name).toBe('Unknown');
        expect(fw.creatorID).toBe('0x00');
        expect(fw.creator).toBeDefined();
        expect(fw.creator.name).toBe('Unknown creator');
        expect(fw.firmwareID).toBeDefined();
        expect(fw.firmwareID).toBe(0);
        done();
      });
  });
});


const interchange_set_details = () => describe('2. Setting the firmware details', () => {
  let mock_hook; // use this to be able to access the mock implementation later.

  afterEach(() => {
    mock_hook = undefined; // clean up any references
  });

  beforeEach(() => {
    jest.resetModules();

    // mock up the interchange client key events.
    interchange_client.Client.mockImplementation(() => {
      // need to extend this off the EventEmitter class.
      const self = new Events.EventEmitter();

      let port = null; // use port to determine the behaviour of get info

      self.set_details = jest.fn().mockImplementation((settings, cb) => {
        if (port === '/dev/dummy_sd_pass') {
          cb();
        }
      });

      mock_hook = self.set_details;

      self.close = () => {
        return;
      };

      Object.defineProperties(self, {
        'port': {
          set(p) {
            // use this to throw an error on the port set up
            if (p == '/dev/dummy_port_open_error') {
              setImmediate(() => {
                self.emit('error', new Error('Cannot open /dev/dummy_port_open_error'));
              });
            } else {
              setImmediate(() => {
                // set the port for the get_info behaviours.
                port = p;
                self.emit('ready');
              });
            }
          }
        }
      });
      return self;
    });

    interchange = new Interchange();
  });

  test('2.1 If no port is set then .set_details should reject', (done) => {
    expect.assertions(1);
    return interchange.set_firmware_details()
      .catch(err => {
        expect(err.toString()).toMatch(/No port specified/);
        done();
      });
  });

  test('2.2 Error during port opening .set_firmware_details() should emit error and reject', (done) => {
    expect.assertions(1);
    // this needs options
    const opts = {address: 0x27, firmwareID: 0x01, creatorID: 0x02};
    return interchange.set_firmware_details('/dev/dummy_port_open_error', opts)
      .catch(err => {
        expect(err.toString()).toMatch(/Cannot open \/dev\/dummy_port_open_error/);
        done();
      });
  });

  test('2.3 .set_firmware_details should reject if supplied opts are missing details', (done) => {
    expect.assertions(3);
    // first check no address supplied
    const port = '/dev/dummy_options_error';
    return interchange.set_firmware_details(port, {firmwareID: 0x01, creatorID: 0x02})
      .catch(err => {
        expect(err.toString()).toMatch(/No default address supplied/);

        // now check no firmware ID
        return interchange.set_firmware_details(port, {address: 0x27, creatorID: 0x02})
          .catch(err2 => {
            expect(err2.toString()).toMatch(/No firmware ID supplied/);

            // now last check no creator ID
            return interchange.set_firmware_details(port, {address: 0x27, firmwareID: 0x01})
              .catch(err3 => {
                expect(err3.toString()).toMatch(/No creator ID supplied/);
                done();
              });
          });
      });
  });

  test('2.4 .set_firmware_details() should pass a correct settings object to ic.set_info', (done) => {
    expect.assertions(9);
    const port = '/dev/dummy_sd_pass';
    const opts = {address: '0x27', firmwareID: '0x01', creatorID: '0x02'};
    return interchange.set_firmware_details(port, opts)
      .then(() => {
        const args = mock_hook.mock.calls[0];
        expect(args[0]).toBeDefined();
        expect(args[0].firmwareID).toBeDefined();
        expect(args[0].creatorID).toBeDefined();
        expect(args[0].i2c_address).toBeDefined();
        expect(args[0].use_custom_address).toBeDefined();
        expect(args[0].firmwareID).toBe(0x01);
        expect(args[0].creatorID).toBe(0x02);
        expect(args[0].i2c_address).toBe(0x27);
        expect(args[0].use_custom_address).toBe(0);
        done();
      });
  });

  test('2.5 .set_firmware_details() should pass a correct settings object when custom i2c address set', (done) => {
    expect.assertions(5);
    const port = '/dev/dummy_sd_pass';
    const opts = {address: '0x27', i2c_address: '0x42', firmwareID: '0x01', creatorID: '0x02'};
    return interchange.set_firmware_details(port, opts)
      .then(() => {
        const args = mock_hook.mock.calls[0];
        expect(args[0]).toBeDefined();
        expect(args[0].i2c_address).toBeDefined();
        expect(args[0].use_custom_address).toBeDefined();
        expect(args[0].i2c_address).toBe(0x42);
        expect(args[0].use_custom_address).toBe(1);
        done();
      });
  });
});

interchange_get_info();
interchange_set_details();
