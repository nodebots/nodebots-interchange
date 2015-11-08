#! /usr/bin/env node
var _       = require('lodash');
var argv    = require('minimist')(process.argv.slice(2));
var Avrgirl = require('avrgirl-arduino');
var Serialport = require('serialport');
var child_process = require('child_process');
var colors = require('colors');
var Download= require('download');
var fs      = require('fs');
var fsextra = require('fs-extra');
var http    = require('http');
var path    = require("path");
var tmp     = require('tmp');

var creators = require('../lib/firmwares.json').creators;
var firmwares = require('../lib/firmwares.json').firmwares;
var interchange_client = require('../lib/interchange_client');
var ic_client = new interchange_client.Client();
var version = require('../package.json').version;

var fw = null; // used to hold details of the firmware we want in it.

function clean_temp_dir(tmpdir) {
    // takes a temporary directory and cleans up any files within it and
    // then calls the callback to remove itself.
    if (tmpdir != undefined && tmpdir !== null && tmpdir !== "") {
        fsextra.emptyDirSync(tmpdir.name);
        tmpdir.removeCallback();
    }
}

function display_help() {
    // this function displays the help on this script.

    var usage = "NodeBots Interchange - backpack utilities - Version: " + version + "\n\n" +
                "usage: interchange install [firmware] [arguments]\n" +
                "   or: interchange install StandardFirmata [arguments]\n" +
                "   or: interchange list\n" +
                "   or: interchange ports [--verbose]\n" +
                "   or: interchange read -p [device path]\n" +
                "   or: interchange --help\n" +
                "\n" +
                "Arguments:\n" +
                "  -a --board           Board type [uno|nano|promini] - default nano\n" +
                "  -p --port            Path to serial port / com port (eg. COM1, /dev/ttyUSB0 etc)\n" +
                "  -I --i2c-address     Set I2C address override [NOT IMPLEMENTED]\n" +
                "     --firmata         Use custom firmata if it is present\n" +
                "  -h --help            Prints this message and exits\n" +
                "  -v --version         Print version\n" +
                "\n\n";

    console.info(usage);
}

function list_devices() {
    // this function lists out all of the devices available to have firmware
    // installed.

    console.info("\nFirmwares available for backpacks. (f) denotes a firmata version is available\n");
    _.sortBy(firmwares, "name").forEach(function(firmware) {
        var outstr = "  " + firmware.name +
            (firmware.firmata ? " (f)" : "") + ":  " +
            firmware.description;
        console.info(outstr);
    });
}

function list_ports(verbose) {
    // this function lists out all the ports available to flash firmware

    Serialport.list(function (err, ports) {
        if (err) {
            console.error(err);
            return;
        }

        if (verbose) {
            console.log(ports);
        } else {
            ports.forEach(function (port) {
                console.log(port.comName.cyan);
                console.log(port.manufacturer);
            });
        }
    });
}

function get_firmware_info(port) {
    // attempts to connect to an interchange firmware and get the
    // installed details.

    ic_client.port = port;

    ic_client.on("error", function(err) {
        console.error(err);
        return err;
    });
    ic_client.on("ready", function() {
        this.get_info(function(err, data) {
            // json is returned
            if (err) {
                this.close();
                throw err;
            }

            // look up the details from the various resources
            fw_details = _.find(firmwares, function(f) {
                return ((parseInt(f.creatorID, 16) == data.creatorID) &&
                        (parseInt(f.firmwareID, 16) == data.firmwareID));
            });
            var creator = _.find(creators, {id: fw_details.creatorID});

            // print everything out.
            console.info((fw_details.name + " backpack firmware").bold);
            console.info("Version %s Built %s", data.fw_version, data.compile_date);
            console.info("Creator ID: %s (%s @%s)", fw_details.creatorID, creator.name, creator.gh);
            console.info("Device ID: %s (%s)", fw_details.firmwareID, fw_details.name);
            console.info("I2C Address: 0x%s (%s)", data.i2c_address.toString(16),
                    data.use_custom_addr ? "Using custom" : "Using default");
            console.info(fw_details.description);

            // close it up.
            this.close();
        }.bind(this));
    })
}

function set_firmware_details(port, opts, cb) {
    // sets the firmware details for the specifics

    ic_client.port = port;

    ic_client.on("error", function(err) {
        console.error("Can't configure device. Did you remember to set your backpack into config mode?".red);
        this.close();
        if (cb) {
            cb();
        }
    });
    ic_client.on("ready", function() {

        // use defaults and then check if we need otherwise
        var address = parseInt(fw.address, 16);
        var use_custom = 0;
        if (opts.i2c_address != undefined && opts.i2c_address != 0) {
            // override with the custom one.
            address = opts.i2c_address;
            use_custom = 1;
        }

        this.set_details({
            firmwareID: parseInt(fw.firmwareID, 16),
            creatorID: parseInt(fw.creatorID, 16),
            i2c_address: address,
            use_custom_address: use_custom,
        }, function() {

            this.close();
            if (cb) {
                console.info("Cleaning up. Installation complete.".green);
                cb();
            }
        }.bind(this))
    });
}
function flash_firmware(firmware, opts, cb) {
    // flashes the board with the options provided.

    var board = opts.board || "nano"; // assumes nano if none provided
    var port = opts.port || ""; // will leave empty and sees what happens.
    var usingFirmata = opts.useFirmata || false; // Assumes not unless explicit

    var avrgirl = new Avrgirl({
        board: board,
        port: port,
        debug: true,
    });

    avrgirl.flash(firmware, function(err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        if (port == "") {
            port = avrgirl.options.port;
        }

        if (! usingFirmata) {
            set_firmware_details(port, opts, cb);
        }
    }.bind(this));
}

function download_from_npm(firmware, options, cb) {
    // downloads the firmware from the npm package

    console.info(colors.magenta("Installing " + firmware.name + " from npm"));
    // first try to install the npm package
    var command = "npm install ";

    // test to see if installing from a gh repo as an npm package.
    if (firmware.npm.repo !== undefined) {
        command = command + firmware.npm.repo;
    } else {
        command = command + firmware.npm.package +
            (firmware.npm.version !== "" ? "@" + firmware.npm.version : "");
    }

    try {
        // simply call the command on the command line.
        child_process.execSync(command, {stdio: [0,1,2]});
    } catch (e) {
        console.error(e);
        throw "npm couldn't complete";
    }

    // as we have installed get the manifest file.
    var base_path = path.join(".", "node_modules", firmware.npm.package)
    var manifest_file = path.join(base_path, "manifest.json");
    try {
        var manifest = JSON.parse(fs.readFileSync(manifest_file));
    } catch (e) {
        console.error("Manifest file incorrect");
        throw "Manifest file error"
    }

    var manifest_objects = (options.useFirmata ? manifest.firmata : manifest.backpack);

    if (manifest_objects.hexPath.indexOf("/") != 0) {
        manifest_objects.hexPath = "/" + manifest_objects.hexPath;
    }
    var hex_path = path.join(base_path, manifest_objects.bins, options.board, manifest_objects.hexPath);

    cb(hex_path, null,  options);
}


function download_from_github(firmware, options, cb) {
    // downloads the firmware from the GH repo

    console.info("Retrieving manifest data from GitHub".magenta);
    var manifest_uri = null;
    var base_uri = null;
    if (firmware.repo.indexOf('git+https') == 0) {
        base_uri = "https://raw.githubusercontent.com" + firmware.repo.substring(22) + "/master";
        manifest_uri = base_uri + "/manifest.json?" + (new Date().getTime());
    }

    if (manifest_uri == null) {
        throw "Can't find manifest of " + firmware;
    }
    // download the manifest file and then hand it over to then
    // start getting the hex file.
    var tmp_dir = tmp.dirSync();
    new Download()
        .get(manifest_uri, tmp_dir.name)
        .run(function(err, manifest_files) {

            if (err) {
                console.error(err);
                clean_temp_dir(tmp_dir);
                throw err;
            }

            try {
                var manifest = JSON.parse(fs.readFileSync(manifest_files[0].path));
            } catch (e) {
                console.error("Manifest file incorrect");
                clean_temp_dir(tmp_dir);
                throw "Manifest file error"
            }

            // now we need to download the hex file.

            var manifest_objects = (options.useFirmata ? manifest.firmata : manifest.backpack);

            if (manifest_objects.hexPath.indexOf("/") != 0) {
                manifest_objects.hexPath = "/" + manifest_objects.hexPath;
            }
            var hex_uri = base_uri + manifest_objects.bins + options.board +
                            manifest_objects.hexPath + "?" + (new Date().getTime());

            console.info("Downloading hex file")
            new Download()
                .get(hex_uri, tmp_dir.name)
                .run(function(err, hex_files) {
                    if (err) {
                        console.error(err);
                        clean_temp_dir(tmp_dir);
                        throw err;
                    }
                    cb(hex_files[0].path, tmp_dir, options);
                });
        });
}

function check_firmware(firmware, options, cb) {
    // checks if the firmware makes sense and downloads the hex file
    // to a temporary location

    var board = options.board || "nano"; // assumes nano if none provided
    var useFirmata = (firmware.indexOf('Firmata') > 0) || (options.firmata != null) || false;

    // see if the firmware is in the directory
    fw = _.find(firmwares, function(f) {
        return f.name == firmware;
    });

    if (fw == undefined) {

        if (firmware.indexOf('git+https') >= 0) {
            // command has been passed with a git repo so make a temp object for
            // fw with appropriate stuff in it.
            fw = {
              "name": firmware,
              "deviceID": 0x01,
              "creatorID": 0x00,
              "repo": firmware,
              "firmata": useFirmata
            };

        } else {
            throw "No firmware found: " + firmware;
        }
    }

    // we have a firmware - check if we need firmata
    if (useFirmata) {
        if (! fw.firmata) {
            throw "Firmware " + fw.name + "  doesn't support custom firmata"
        }
    }

    var opts = options || {};

    opts["useFirmata"] = useFirmata;

    // now check if the firmware is in npm or github.
    if (fw.npm == undefined) {
        // use git repo
        download_from_github(fw, opts, cb);

    } else {
        // get from npm now
        download_from_npm(fw, opts, cb);
    }
}

if (argv.h || argv.help) {
    display_help();
    process.exit(0);
}

if (argv.v || argv.version) {
    console.log("NodeBots Interchange version: " + version);
    process.exit(0);
}

if (argv._[0] == "list") {
    list_devices();
    process.exit(0);

} else if (argv._[0] == "ports") {

    list_ports(argv.verbose);

} else if (argv._[0] == "install") {

    if (argv._[1] == undefined) {
        console.error("Please supply a firmware to install");
        process.exit(1);
    }

    var opts = {
        board: argv.a || argv.board || process.env.INTERCHANGE_BOARD || "nano",
        port: argv.p || argv.port || process.env.INTERCHANGE_PORT || "",
        firmata: argv.firmata || null,
        i2c_address: argv.i || null,
    };

    try {
        check_firmware(argv._[1], opts, function(hex_path, tmp_dir, options) {

            flash_firmware(hex_path, options, function() {
                // once complete destory the tmp_dir.
                if (tmp_dir) {
                    clean_temp_dir(tmp_dir);
                }
            });
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
} else if (argv._[0] == "read") {

    var port = argv.p || argv.port || undefined;

    if (port == undefined) {
        console.error("Please provide a device path");
        process.exit(1);
    }

    get_firmware_info(port);
}
