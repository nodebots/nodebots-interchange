const stdin = require('mock-stdin').stdin();

const Inquire = require('../lib/inquire');

let inquire;

const inquirer_tests = () => describe('1. CLI for Interchange', () => {
  beforeAll(() => {
    // io = stdin();
  });

  afterAll(() => {
    // io.restore();
  });

  beforeEach(async() => {
    inquire = await new Inquire((firmware, options) => {
      // console.log('Calling back from constructor', firmware, options);
    });
  });

  test('1.1 No callback to Inquire constructor should throw an error', () => {
    return expect(() => {new Inquire()}).toThrow(/No callback defined/);
  });

  test('1.2 No ports provided should throw an error', () => {
    return expect(() => { inquire.promptQuestions() }).toThrow(/No ports/);
  });

  test('1.3 Questions with no ports should throw an error', () => {
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

  test('1.8 If ports are not discovered .prompt() should throw an error', () => {
    // fake the ports not being set
    inquire.ports = null;

    expect(() => { inquire.prompt() }).toThrow(/No ports/);
  });

  // TODO: mock the inquirer.prompt call and then in the callback function
  // test that the firmware is set appropriately etc.
  // Also mock the get ports call and then return appropriate esponses including
  // that it throws an error if there is one
});

inquirer_tests();
