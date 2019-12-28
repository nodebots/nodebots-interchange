const firmware_path = '../lib/firmwares.json';

let firmwares;
let creators;

const firmware_library = () => describe('1. Firmware library is correctly formed', () => {
  // Check that all of the firmware lib works properly.
  beforeAll(() => {
    firmwares = require(firmware_path).firmwares;
  });


  test('1.1 Firmware library should not be empty', () => {
    expect(firmwares.length);
  });

  test('1.2 Firmware library should have all required fields populated', () => {
    firmwares.forEach((firmware) => {
      expect(firmware.name).toBeDefined();

      // check if a firmata only or not
      if (firmware.name.indexOf('Firmata') >= 0) {
        expect(firmware.address).not.toBeDefined();
      } else {
        expect(firmware.address).toBeDefined();
      }

      // ensure there is a location to get the firmware from
      expect(firmware.repo || firmware.npm).toBeTruthy();
    });
  });
});

const firmware_creator = () => describe('2. Ensure creators set up correctly', () => {
  // run the creator checks
  beforeAll(() => {
    creators = require(firmware_path).creators;
  });


  test('2.1 Creator list should not be empty', () => {
    expect(creators.length);
  });

  test('2.2 Creator list has required fields', () => {
    creators.forEach((creator) => {
      expect(creator.id).toBeDefined();
      expect(parseInt(creator.id, 16) >= 0).toBe(true); // is a number
      expect(creator.gh).toBeDefined();
      expect(creator.name).toBeDefined();
      expect(creator.name.length > 0).toBe(true);
    });
  });
});

firmware_library();
firmware_creator();

// module.exports.firmware_library = firmware_library;
