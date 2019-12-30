const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');

const interchange_client = require('../lib/interchange_client');

let ic_client;
const returned_fw = {
  fw_version: '0.1.0',
  creatorID: 0,
  firmwareID: 0,
  ic_version: '0.2.1',
  compile_date: '28 Dec 2019',
  i2c_address: 39,
  use_custom_addr: 0
};

const client_shape = () => describe('1. Client Shape is correct', () => {
  // look at the set up etc and make sure everything looks correct.
  beforeEach(() => {
    ic_client = new interchange_client.Client();
  });

  test('1.1 Constructor returns an object with appropriate properties', () => {
    expect(ic_client.port).toBeDefined();
    expect(typeof(ic_client.get_info)).toBe('function');
    expect(typeof(ic_client.set_details)).toBe('function');
    expect(typeof(ic_client.close)).toBe('function');
  });
});

const client_connect = () => describe('2. Client should open and close correctly', () => {
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

  afterEach(() => {
    ic_client.close();
  });

  test('2.1 Client should call the connected event when opened with a valid port', (done) => {
    ic_client.on('connected', () => {
      expect(ic_client.serialport.path).toBe('/dev/dummy');
      expect(ic_client.serialport.binding.isOpen).toBe(true);
      done();
    });

    ic_client.port = '/dev/dummy';
  });

  test('2.2 Client should emit an error event when opened with an invalid port', (done) => {
    ic_client.on('error', (err) => {
      expect(err).toBeDefined();
      expect(err.toString()).toMatch(/Port does not exist/);
      done();
    });

    ic_client.port = '/dev/not_valid';
  });

  test('2.3 Client should emit ready event after receiving the interchange banner', (done) => {
    ic_client.on('ready', () => {
      done();
    });

    ic_client.on('connected', () => {
      // send the data through the mock binding to simulate what it would receive
      ic_client.serialport.binding.emitData('Interchange ver: 0.x.y\r\n');
      ic_client.serialport.binding.emitData('Enter command, followed by NL. Type HELP for more.\r\n');
      ic_client.serialport.binding.emitData('>>\r\n');
    });

    ic_client.port = '/dev/dummy';
  });

  test('2.4 Client should close the serialport correctly', (done) => {
    ic_client.on('connected', () => {
      expect(ic_client.open).toBe(true);
      ic_client.close();
      expect(ic_client.open).toBe(false);
      done();
    });

    expect(ic_client.open).toBe(false);
    ic_client.port = '/dev/dummy';
  });

  /**
  test.only('1.4 get info should return an error if it cannot retrive JSON from firmware', (done) => {
    ic_client.on('error', (err) => {
      console.log('error', err);
    });

    ic_client.on('ready', () => {
      console.log('in the ready event');
      ic_client.get_info(() => {
        console.log('in the get info callback');
      });
    });
  });
  **/
});

const client_data = () => describe('3. Client data operations', () => {
  beforeAll(() => {
    // make a temporary serialport
    MockBinding.createPort('/dev/dummy.data', {echo: true, record: true});
    SerialPort.Binding = MockBinding;
  });

  afterAll(() => {
    MockBinding.close();
  });

  beforeEach(() => {
    jest.resetModules();
    ic_client = new interchange_client.Client();
  });

  afterEach(() => {
    ic_client.close();
  });

  test('3.1 Client emits data events when it receives data from firmware', (done) => {
    ic_client.on('connected', () => {
      ic_client.serialport.binding.emitData('>>\r\n');
    });

    ic_client.on('ready', () => {
      ic_client.serialport.binding.emitData('FIRMWARE DATA SENT\r\n');
    });

    ic_client.on('data', (data) => {
      expect(data).toMatch(/FIRMWARE DATA SENT/);
      done();
    });

    ic_client.port = '/dev/dummy.data';
  });
});

const client_info = () => describe('4. Get Info related actions', () => {
  let ic_client_info;

  beforeAll(() => {
    // make a temporary serialport
    MockBinding.createPort('/dev/dummy.info', {echo: false, record: true});
    SerialPort.Binding = MockBinding;
  });

  afterAll(() => {
    MockBinding.close();
  });

  beforeEach(() => {
    jest.resetModules();

    ic_client_info = new interchange_client.Client();

    // set up the base handlers to help coordinate the connection
    ic_client_info.on('connected', () => {
      ic_client_info.serialport.binding.emitData('>>\r\n');
    });

    // trigger connection with
    // ic_client.port = '/dev/dummy.info';
    // in the actual test when you're ready to go
  });

  afterEach(() => {
    ic_client_info.close();
  });

  test('4.1 Get info should send DUMP command to serialport', (done) => {
    ic_client_info.on('ready', () => {
      ic_client_info.get_info(() => {});

      setImmediate(() => {
        // Check we sent the right command
        expect(ic_client_info.serialport.binding.lastWrite.toString()).toBe('DUMP\n');
        done();
      });
    });

    ic_client_info.port = '/dev/dummy.info';
  });

  test('4.2 Get info should return an error if it cannot return a JSON object', (done) => {
    ic_client_info.on('ready', () => {
      ic_client_info.get_info((err) => {
        if (err) {
          expect(err.toString()).toMatch(/SyntaxError/);
          done();
        }
      });

      setImmediate(() => {
        if (ic_client_info.serialport.binding.lastWrite.toString() == 'DUMP\n') {
          ic_client_info.serialport.binding.emitData("{name:'test', invalid_key:}\r\n");
        }
      });
    });

    ic_client_info.port = '/dev/dummy.info';
  });

  test('4.3 Get info should return a proper object', (done) => {
    ic_client_info.on('ready', () => {
      ic_client_info.get_info((err, dump) => {
        if (err) {
          throw err;
        }

        expect(dump).toBeDefined();
        expect(dump.fw_version).toBeDefined();
        expect(dump.fw_version).toBe('0.1.0');
        expect(dump.ic_version).toBeDefined();
        expect(dump.ic_version).toBe('0.2.1');
        expect(dump.i2c_address).toBeDefined();
        expect(dump.i2c_address).toBe(39);
        expect(dump.use_custom_addr).toBeDefined();
        expect(dump.use_custom_addr).toBeFalsy();
        done();
      });
      setImmediate(() => {
        if (ic_client_info.serialport.binding.lastWrite.toString() == 'DUMP\n') {
          ic_client_info.serialport.binding.emitData(JSON.stringify(returned_fw) + '\r\n');
        }
      });
    });

    ic_client_info.port = '/dev/dummy.info';
  });
});

const client_set_details = () => describe('5. Setting the firmware details works correctly', () => {
  let ic_client_set;

  beforeAll(() => {
    // make a temporary serialport
    MockBinding.createPort('/dev/dummy.set', {echo: false, record: true});
    SerialPort.Binding = MockBinding;
  });

  afterAll(() => {
    MockBinding.close();
  });

  beforeEach(() => {
    jest.resetModules();

    ic_client_set = new interchange_client.Client();

    // set up the base handlers to help coordinate the connection
    ic_client_set.on('connected', () => {
      ic_client_set.serialport.binding.emitData('>>\r\n');
    });

    ic_client_set.on('data', (data) => {
      console.log('Here is data', data);
    });

    // trigger connection with
    // ic_client.port = '/dev/dummy.set';
    // in the actual test when you're ready to go
  });

  afterEach(() => {
    ic_client_set.close();
  });

  test('5.1 .set_details() calls the right serial commands', (done) => {
    ic_client_set.on('ready', () => {
      const fw = {
        firmwareID: 0x02,
        creatorID: 0x05,
        i2c_address: 0x27,
        use_custom_address: 0
      };

      ic_client_set.set_details(fw, () => {
        // check in here that the data has been written appropriately
        // we need to effect a pause here so the serial port mock binding
        // can catch up. setImmediate is fine though as it just waits a tick
        setImmediate(() => {
          const cmds = ic_client_set.serialport.binding.recording.toString().split('\n');
          expect(cmds[0]).toBe('CLR');
          expect(cmds).toContain('FID 2');
          expect(cmds).toContain('CID 5');
          expect(cmds).toContain('I2C 39 0');
          done();
        });
      });
    });

    ic_client_set.on('error', (err) => {
      console.log('there was an error', err);
    });

    ic_client_set.port = '/dev/dummy.set';
  });
});

client_shape();
client_connect();
client_data();
client_info();
client_set_details();
