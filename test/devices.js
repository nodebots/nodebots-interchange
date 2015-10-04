// tests to make sure devices are ok.

var device_path = "../lib/devices.json";

exports["Devices - Library"] = {
    setUp: function(done) {
        this.device_list = require(device_path).devices;
        done();
    },

    tearDown: function(done) {
        done();
    },

    checkRequiredFields: function(test) {

        test.expect(this.device_list.length * 5);
        this.device_list.forEach(function(device) {
            test.notEqual(device.name, "", ("Name does not exist"));
            test.notEqual(device.name, undefined, "Name not present");
            test.notEqual(device.address, "", "Default address does not exist: " + device.name);
            test.notEqual(device.address, undefined, "Address not present");

            if (device.repo !== undefined || device.npm !== undefined) {
                test.ok(true, "Repo or npm present");
            } else {
                test.ok(false, "Repo and npm not present");
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
