#! /usr/bin/env node
var _       = require('lodash');
var argv    = require('minimist')(process.argv.slice(2));
var Avrgirl = require('avrgirl-arduino');
var child_process = require('child_process');
var Download= require('download');
var fs      = require('fs');
var fsextra = require('fs-extra');
var http    = require('http');
var path    = require("path");
var tmp     = require('tmp');

var version = require('../package.json').version;
var firmwares = require('../lib/firmwares.json').firmwares;

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

    console.log(usage);
}

function list_devices() {
    // this function lists out all of the devices available to have firmware
    // installed.

    console.log("\nFirmwares available for backpacks. (f) denotes a firmata version is available\n");
    _.sortBy(firmwares, "name").forEach(function(firmware) {
        var outstr = "  " + firmware.name + 
            (firmware.firmata ? " (f)" : "") + ":  " +
            firmware.description;
        console.log(outstr);
    });
}

function flash_firmware(firmware, opts, cb) {
    // flashes the board with the options provided.

    var boardtype = opts.board || "nano"; // assumes nano if none provided
    var port = opts.port || ""; // will leave empty and sees what happens.

    var avrgirl = new Avrgirl({
        board: boardtype,
        port: port,
        debug: true,
    });

    avrgirl.flash(firmware, function(err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        console.info("flashed");
        cb();
    });
}

function download_from_npm(firmware, options, cb) {
    // downloads the firmware from the npm package

    console.info("Installing " + firmware.name + " from npm");
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
    var hex_path = path.join(base_path, manifest_objects.bins, options.boardtype, manifest_objects.hexPath);
    console.log(hex_path);

    cb(hex_path);
}


function download_from_github(firmware, options, cb) {
    // downloads the firmware from the GH repo

    console.info("GH repo - retrieving manifest data");
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
            var hex_uri = base_uri + manifest_objects.bins + options.boardtype + 
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
                    cb(hex_files[0].path, tmp_dir);
                });
        });
}

function check_firmware(firmware, options, cb) {
    // checks if the firmware makes sense and downloads the hex file
    // to a temporary location

    var boardtype = options.board || "nano"; // assumes nano if none provided
    var useFirmata = (firmware.indexOf('Firmata') > 0) || (options.firmata != null) || false;

    // see if the firmware is in the directory
    var fw = _.find(firmwares, function(f) {
        return f.name == firmware;
    });

    if (fw == undefined) {
        throw "No firmware found: " + firmware;
    } else {
        // we have a firmware - check if we need firmata 
        if (useFirmata) {
            if (! fw.firmata) {
                throw "Firmware " + fw.name + "  doesn't support custom firmata"
            }
        }
    }

    var opts = {
        useFirmata: useFirmata,
        boardtype: boardtype,
    };
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

} else if (argv._[0] == "install") {

    if (argv._[1] == undefined) {
        console.error("Please supply a firmware to install");
        process.exit(1);
    }

    var opts = {
        board: argv.a || argv.board || process.env.INTERCHANGE_BOARD || "nano",
        port: argv.p || argv.port || process.env.INTERCHANGE_PORT || "",
        firmata: argv.firmata || null,
    };

    try {
        check_firmware(argv._[1], opts, function(hex_path, tmp_dir) {

            flash_firmware(hex_path, opts, function() {
                // once complete destory the tmp_dir.
                clean_temp_dir(tmp_dir);
            });            
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }   
}
