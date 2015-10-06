// tests to make sure devices are ok.

var firmware_path = "../lib/firmwares.json";

exports["Devices - Library"] = {
    setUp: function(done) {
        this.firmware_list = require(firmware_path).firmwares;
        done();
    },

    tearDown: function(done) {
        done();
    },

    checkRequiredFields: function(test) {
        // tests for the fields needed in the firmware list
        test.expect(this.firmware_list.length * 5);
        this.firmware_list.forEach(function(firmware) {
            test.notEqual(firmware.name, "", ("Name does not exist"));
            test.notEqual(firmware.name, undefined, "Name not present");
            test.notEqual(firmware.address, "", "Default address does not exist: " + firmware.name);
            test.notEqual(firmware.address, undefined, "Address not present");

            if (firmware.repo !== undefined || firmware.npm !== undefined) {
                test.ok(true, "Repo or npm present");
            } else {
                test.ok(false, "Repo or npm not present");
            }
        });

        test.done();
    },

    checkManifestFiles: function(test) {
        test.expect(1);

        test.ok(false, "No manifest files found");
        test.done();
    },
};
