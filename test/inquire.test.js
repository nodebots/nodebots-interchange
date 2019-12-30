const SerialPort = require('serialport');
const MockBinding = require('@serialport/binding-mock');
const Inquire = require('../lib/inquire');
const inquirer = require('inquirer');

const inquirer_tests = () => describe('1. CLI for Interchange', () => {
  beforeAll(() => {
  });

  afterAll(() => {
    jest.resetModules();
  });

  beforeEach(async() => {
    jest.resetModules();
  });

  test('1.1 No callback to Inquire constructor should throw an error', () => {
    return expect(() => {new Inquire()}).toThrow(/No callback defined/);
  });

  test('1.2 No ports provided should throw an error', async() => {
    const inquire = await new Inquire((firmware, options) => {});
    return expect(() => { inquire.promptQuestions() }).toThrow(/No ports/);
  });

  test('1.3 Questions with no ports should throw an error', async() => {
    const inquire = await new Inquire((firmware, options) => {});
    expect(() => { inquire.questions() }).toThrow(/No ports/);
  });

  test('1.4 Check shape of questions', async() => {
    const ports = [{path:'/dev/dummy'}];
    const inq = await new Inquire(()=>{});
    const questions = inq.questions(ports);

    expect(questions[0].choices).toBeDefined();
    expect(questions[0].choices.length).toBeGreaterThan(0);
  });

  test('1.5 Firmata questions should return correct values', async() => {
    const ports = [{path:'/dev/dummy'}];
    const inq = await new Inquire(() => {});
    const questions = inq.questions(ports);

    expect(questions[1].default({firmware: 'StandardFirmata'})).toBe(true);
    expect(questions[1].default({firmware: 'Nothing'})).toBe(false);
    // if firmware contains a firmata version then this should be asked
    expect(questions[1].when({firmware: 'node-pixel'})).toBe(true);
    // if firmware is a firmata then this should not be asked as it's implied
    expect(questions[1].when({firmware: 'StandardFirmata'})).toBe(false);
  });

  test('1.6 Ask for type of firmata if needed', async() => {
    const ports = [{path:'/dev/dummy'}];
    const inq = await new Inquire(()=>{});
    const questions = inq.questions(ports);

    // ask for the name even if we don't prompt for firmata type
    expect(questions[2].when({firmware: 'StandardFirmata', firmata: true})).toBe(true);
    // don't ask if we don't want the firmata
    expect(questions[2].when({firmware: 'node-pixel', firmata: false})).toBe(false);
  });

  test('1.7 Ask for I2C address if firmware is backpack', async() => {
    const ports = [{path:'/dev/dummy'}];
    const inq = await new Inquire(()=>{});
    const questions = inq.questions(ports);

    // ask if it's a backpack
    expect(questions[5].when({firmware: 'node-pixel', firmata: false})).toBe(true);
    // and don't ask if it's a firmata.
    expect(questions[5].when({firmware: 'node-pixel', firmata: true})).toBe(false);
  });

  test('1.8 If ports are not discovered .prompt() should throw an error', async() => {
    // fake the ports not being set
    const inquire = await new Inquire((firmware, options) => {});
    inquire.ports = null;

    expect(() => { inquire.prompt() }).toThrow(/No ports/);
  });

  test('1.9 If .get_ports() fails then constructor should reject', (done) => {
    // make a temporary serialport
    MockBinding.createPort('/dev/dummy', {echo: true, record: true});
    SerialPort.Binding = MockBinding;

    // set up low level regection for the SP
    const backup = SerialPort.Binding.list;
    SerialPort.Binding.list = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Cannot find ports'));
    });

    expect.assertions(1);
    return new Inquire(()=>{})
      .catch(err => {
        expect(err.toString()).toMatch(/Cannot find ports/);
        // reset the binding mock.
        SerialPort.Binding.list = backup;
        done();
      });
  });

  test('1.10 .promptQuestions() calls the inquire callback with answers filled', (done) => {
    MockBinding.createPort('/dev/dummy', {echo: true, record: true});
    SerialPort.Binding = MockBinding;

    inquirer.prompt = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        firmware: 'test_firmware',
        avr: 'nano',
        port: '/dev/dummy',
        firmata: false,
        address: '0x27'
      });
    });

    expect.assertions(6);
    return new Inquire((fw, opts) => {
      expect(fw).toBe('test_firmware');
      expect(opts).toBeDefined();
      expect(opts.board).toBe('nano');
      expect(opts.port).toBe('/dev/dummy');
      expect(opts.address).toBe('0x27');
      expect(opts.firmata).toBe(false);
      done();
    }).then((inquire) => {
      inquire.prompt();
    });
  });
});

inquirer_tests();
