// tests to make sure devices are ok.

const firmware_path = '../lib/firmwares.json';

exports['Firmwares - Library'] = {
  setUp(done) {
    this.firmware_list = require(firmware_path).firmwares;
    done();
  },

  tearDown(done) {
    done();
  },

  checkRequiredFields(test) {
    // tests for the fields needed in the firmware list
    test.expect(this.firmware_list.length * 5);
    this.firmware_list.forEach(function(firmware) {
      test.notEqual(firmware.name, '', ('Name does not exist'));
      test.notEqual(firmware.name, undefined, 'Name not present');
      test.notEqual(firmware.address, '', 'Default address does not exist: ' + firmware.name);

      if (firmware.address == undefined) {
        // check if we're a firmata
        if (firmware.name.indexOf('Firmata') >= 0) {
          test.ok(true, 'Firmata only, no I2C address');
        } else {
          test.ok(false, 'Address not present ' + firmware.name);
        }
      } else {
        test.ok(true, 'Address present');
      }

      if (firmware.repo !== undefined || firmware.npm !== undefined) {
        test.ok(true, 'Repo or npm present');
      } else {
        test.ok(false, 'Repo or npm not present');
      }
    });

    test.done();
  }

};

exports['Firmwares - Creators'] = {
  setUp(done) {
    this.creator_list = require(firmware_path).creators;
    done();
  },

  tearDown(done) {
    done();
  },

  checkRequiredFields(test) {
    test.expect(this.creator_list.length * 6);
    this.creator_list.forEach(function(creator) {
      test.notEqual(creator.id, undefined, 'Creator ID not present');
      test.notEqual(creator.id, '', 'Creator ID not provided');
      test.notEqual(parseInt(creator.id, 10), NaN, 'Creator ID not a number');
      test.notEqual(creator.gh, undefined, 'Github username not provided');
      test.notEqual(creator.name, undefined, 'Name not present');
      test.notEqual(creator.name, '', 'Name not provided');
    });

    test.done();
  }
};
