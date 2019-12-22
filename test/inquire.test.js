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
});

inquirer_tests();
