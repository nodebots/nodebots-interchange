#! /usr/bin/env node
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var Avrgirl = require('avrgirl-arduino');
var Download = require('download');
var fs = require('fs');
var http = require('http');
var path = require("path");
var request = require('request');
var tmp = require('tmp');

var version = require('../package.json').version;
var devices = require('../lib/devices.json').devices;

function display_help() {
    // this function displays the help on this script.
    
    var usage = "NodeBots Interchange - backpack utilities - Version: " + version + "\n\n" +
                "usage: interchange install [firmware] [arguments]\n" +
                "   or: interchange list\n" +
                "   or: interchange --help\n" +
                "\n" +
                "Arguments:\n" +
                "  -a --board           Board type [uno|nano|promini] - default nano\n" +
                "  -p --port            Path to serial port / com port (eg. COM1, /dev/ttyUSB0 etc)\n" +
                "  -I --i2c-address     Set I2C address override [NOT IMPLEMENTED]\n" +
                "  -h --help            Prints this message and exits\n" +
                "  -v --version         Print version\n" +
                "\n\n";

    console.log(usage);
}

function list_devices() {
    // this function lists out all of the devices available to have firmware
    // installed.
    devices.forEach(function(firmware) {
        console.log(firmware.name + ": " + firmware.description);
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

function check_firmware(firmware, options, cb) {
    // checks if the firmware makes sense and downloads the hex file
    // to a temporary location

    var boardtype = options.board || "nano"; // assumes nano if none provided

    // see if the firmware is in the directory
    var fw = _.find(devices, function(device) {
        return device.name == firmware;
    });

    if (fw == undefined) {
        throw "No firmware found: " + firmware;
    }

    // now check if the firmware is in npm or github.
    var manifest_uri = null;
    var base_uri = null;
    if (fw.npm == undefined) {
        // use git repo
        console.info("GH repo - retrieving manifest data");

        if (fw.repo.indexOf('git') == 0) {
            base_uri = "https://raw.githubusercontent.com" + fw.repo.substring(22) + "/master";
            manifest_uri = base_uri + "/manifest.json";
        }
    } else {
        // do npm check here TODO
    }
   
    if (manifest_uri == null) {
        throw "Can't find manifest of " + firmware;
    }
   
    // return the manifest file here as a loader and then hand it over to then
    // start getting the hex file.
    //

    request(manifest_uri, function(err, resp, body) {
        if (! err && resp.statusCode == 200) {
            var manifest = JSON.parse(body);

            // now we need to download the hex file. 
            var hex_uri = base_uri + manifest.bins + boardtype + manifest.hexPath;

            var tmp_dir = tmp.dirSync();
            
            console.info("Downloading hex file")
            new Download()
                .get(hex_uri, tmp_dir.name)
                .run(function(err, files) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }

                    cb(files[0].path, tmp_dir);
                });

        } else {
            throw "Can't find manifest file";
        }
    });
}

if (argv.h || argv.help) {
    display_help();
    process.exit(1);
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
    };

    try {
        check_firmware(argv._[1], opts, function(hex_path, tmp_dir) {

            flash_firmware(hex_path, opts, function() {
                // once complete destory the tmp_dir.
                fs.unlinkSync(hex_path);
                tmp_dir.removeCallback();
            });
            
        });
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
    
}

