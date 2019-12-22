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

  beforeEach(() => {
    inquire = new Inquire((firmware, options) => {
      // console.log('Calling back from constructor', firmware, options);
    });
  });

  test('1.1 No callback to Inquire constructor should throw an error', () => {
    expect(() => {new Inquire()}).toThrow(/No callback defined/);
  });

  test('1.2 No ports provided should throw an error', () => {
    expect(() => { inquire.promptQuestions() }).toThrow(/No ports/);
  });

  test('1.3 Questions with no ports should throw an error', () => {
    expect(() => { inquire.questions() }).toThrow(/No ports/);
  });

  test('1.4 Check shape of questions', (done) => {
    const ports = [{path:'/dev/dummy'}];
    const questions = new Inquire(()=>{}).questions(ports);

    expect(questions[0].choices).toBeDefined();
    expect(questions[0].choices.length).toBeGreaterThan(0);
    console.log(questions);
    done();
  });

  test('1.5 Firmata questions should return correct values', () => {
    const ports = [{path:'/dev/dummy'}];
    const questions = new Inquire(()=>{}).questions(ports);

    expect(questions[1].default({firmware: 'StandardFirmata'})).toBe(true);
    expect(questions[1].default({firmware: 'Nothing'})).toBe(false);
    // if firmware contains a firmata version then this should be asked
    expect(questions[1].when({firmware: 'node-pixel'})).toBe(true);
    // if firmware is a firmata then this should not be asked as it's implied
    expect(questions[1].when({firmware: 'StandardFirmata'})).toBe(false);
  });

  test('1.6 Ask for type of firmata if needed', () => {
    const ports = [{path:'/dev/dummy'}];
    const questions = new Inquire(()=>{}).questions(ports);

    // ask for the name even if we don't prompt for firmata type
    expect(questions[2].when({firmware: 'StandardFirmata', firmata: true})).toBe(true);
    // don't ask if we don't want the firmata
    expect(questions[2].when({firmware: 'node-pixel', firmata: false})).toBe(false);
  });

  test('1.7 Ask for I2C address if firmware is backpack', () => {
    const ports = [{path:'/dev/dummy'}];
    const questions = new Inquire(()=>{}).questions(ports);

    // ask if it's a backpack
    expect(questions[5].when({firmware: 'node-pixel', firmata: false})).toBe(true);
    // and don't ask if it's a firmata.
    expect(questions[5].when({firmware: 'node-pixel', firmata: true})).toBe(false);
  });
});

inquirer_tests();
