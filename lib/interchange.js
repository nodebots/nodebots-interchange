const _ = require('lodash');
const program = require('commander');
const Avrgirl = require('avrgirl-arduino');
const Serialport = require('serialport');
const child_process = require('child_process');
const colors = require('colors');
const Download= require('download');
const fs      = require('fs');
const fsextra = require('fs-extra');
const http    = require('http');
const path    = require('path');
const tmp     = require('tmp');

const creators = require('./firmwares.json').creators;
const firmwares = require('./firmwares.json').firmwares;
const interchange_client = require('./interchange_client');
const ic_client = new interchange_client.Client();
const version = require('../package.json').version;

let fw = null; // used to hold details of the firmware we want in it.

const Interchange = function() {
  this.firmwares = firmwares;
};

Interchange.prototype.clean_temp_dir = function(tmpdir) {
  // takes a temporary directory and cleans up any files within it and
  // then calls the callback to remove itself.
  if (tmpdir != undefined && tmpdir !== null && tmpdir !== '') {
    fsextra.emptyDirSync(tmpdir.name);
    tmpdir.removeCallback();
  }
};

Interchange.prototype.list_devices = function() {
  // this function lists out all of the firmwares available to be installed.

  console.info('\nFirmwares available for backpacks. (f) denotes a firmata version is available\n');
  _.sortBy(firmwares, 'name').forEach(function(firmware) {
    const outstr = '  ' + firmware.name +
            (firmware.firmata ? ' (f)' : '') + ':  ' +
            firmware.description;
    console.info(outstr);
  });
};

Interchange.prototype.get_ports = function(cb) {
  Serialport.list(function(err, ports) {
    cb(err, ports);
  });
};

Interchange.prototype.list_ports = function(opts) {
  // this function lists out all the ports available to flash firmware

  const verbose = opts.verbose;

  this.get_ports(function(err, ports) {
    if (err) {
      console.error(err);
      return;
    }

    if (verbose) {
      console.info(ports);
    } else {
      ports.forEach(function(port) {
        console.info(port.comName.cyan);
        console.info(port.manufacturer);
      });
    }
  });
};

Interchange.prototype.get_firmware_info = function(port) {
  // attempts to connect to an interchange firmware and get the
  // installed details.

  if (!port) {
    console.error('Please provide a device path'.red);
    return;
  }

  ic_client.port = port;

  ic_client.on('error', function(err) {
    console.error(err);
    return err;
  });
  ic_client.on('ready', function() {
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
      const creator = _.find(creators, {id: fw_details.creatorID});

      // print everything out.
      console.info((fw_details.name + ' backpack firmware').bold);
      console.info('Version %s Built %s', data.fw_version, data.compile_date);
      console.info('Creator ID: %s (%s @%s)', fw_details.creatorID, creator.name, creator.gh);
      console.info('Device ID: %s (%s)', fw_details.firmwareID, fw_details.name);
      console.info('I2C Address: 0x%s (%s)', data.i2c_address.toString(16),
        data.use_custom_addr ? 'Using custom' : 'Using default');
      console.info(fw_details.description);

      // close it up.
      this.close();
    }.bind(this));
  })
};

Interchange.prototype.install_firmware = function(firmware, opts) {
  if (!firmware) {
    console.error('Please supply a firmware to install'.red);
    return;
  }

  const settings = {
    board: opts.board || process.env.INTERCHANGE_BOARD || 'nano',
    port: opts.port || process.env.INTERCHANGE_PORT,
    firmata: opts.firmata,
    i2c_address: opts.address
  };

  try {
    this.check_firmware(firmware, settings, function(hex_path, tmp_dir, options) {
      this.flash_firmware(hex_path, options, function() {
        // once complete destory the tmp_dir.
        if (tmp_dir) {
          this.clean_temp_dir(tmp_dir);
        }
      }.bind(this));
    }.bind(this));
  } catch (e) {
    console.error(e);
    return;
  }
};

Interchange.prototype.set_firmware_details = function(port, opts, cb) {
  // sets the firmware details for the specifics

  ic_client.port = port;

  ic_client.on('error', function(err) {
    console.error("Can't configure device. Did you remember to set your backpack into config mode?".red);
    this.close();
    if (cb) {
      cb();
    }
  });
  ic_client.on('ready', function() {
    // use defaults and then check if we need otherwise
    let address = parseInt(fw.address, 16);
    let use_custom = 0;
    if (opts.i2c_address != undefined && opts.i2c_address != 0) {
      // override with the custom one.
      address = opts.i2c_address;
      use_custom = 1;
    }

    this.set_details({
      firmwareID: parseInt(fw.firmwareID, 16),
      creatorID: parseInt(fw.creatorID, 16),
      i2c_address: address,
      use_custom_address: use_custom
    }, function() {
      this.close();
      if (cb) {
        console.info('Cleaning up. Installation complete.'.green);
        cb();
      }
    }.bind(this))
  });
};

Interchange.prototype.flash_firmware = function(firmware, opts, cb) {
  // flashes the board with the options provided.

  const board = opts.board || 'nano'; // assumes nano if none provided
  let port = opts.port || ''; // will leave empty and sees what happens.
  const usingFirmata = opts.useFirmata || false; // Assumes not unless explicit

  const avrgirl = new Avrgirl({
    board,
    port,
    debug: true
  });

  avrgirl.flash(firmware, function(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    if (port == '') {
      port = avrgirl.options.port;
    }

    if (!usingFirmata) {
      this.set_firmware_details(port, opts, cb);
    }
  }.bind(this));
};

Interchange.prototype.download_from_npm = function(firmware, options, cb) {
  // downloads the firmware from the npm package

  console.info(colors.magenta('Installing ' + firmware.name + ' from npm'));
  // first try to install the npm package
  let command = 'npm install ';

  // test to see if installing from a gh repo as an npm package.
  if (firmware.npm.repo !== undefined) {
    command = command + firmware.npm.repo;
  } else {
    if (typeof(firmware.npm.version) == 'undefined') {
      // just use "latest" from npm
      command = command + firmware.npm.package;
    } else {
      command = command + firmware.npm.package + '@' + firmware.npm.version;
    }
  }

  try {
    // simply call the command on the command line.
    child_process.execSync(command, {stdio: [0,1,2]});
  } catch (e) {
    console.error('npm could not complete');
    throw e;
  }

  // as we have installed get the manifest file.
  const base_path = path.join('.', 'node_modules', firmware.npm.package)
  const manifest_file = path.join(base_path, 'manifest.json');

  try {
    const manifest = JSON.parse(fs.readFileSync(manifest_file));
  } catch (e) {
    console.error('Manifest file incorrect');
    throw e;
  }

  let manifest_objects = (options.useFirmata ? manifest.firmata : manifest.backpack);
  // this deals with a firmata object supplied that isn't the default
  // one in order to grab the right hex file.
  if (options.useFirmata && options.firmataName != '') {
    manifest_objects = manifest.firmata[options.firmataName];
  } else if (options.useFirmata && options.firmataName == '' && manifest.firmata.multi != undefined) {
    // we have multiple firmatas and none have been supplied.
    throw new Error('Multiple firmatas are available, please supply a name');
  }

  if (manifest_objects.hexPath.indexOf('/') != 0) {
    manifest_objects.hexPath = '/' + manifest_objects.hexPath;
  }

  const hex_path = path.join(base_path, manifest_objects.bins, options.board, manifest_objects.hexPath);

  cb(hex_path, null,  options);
};


Interchange.prototype.download_from_github = function(firmware, options, cb) {
  // downloads the firmware from the GH repo

  const self = this;
  let manifest_uri = null;
  let base_uri = null;
  let branch = 'master';
  let repo = '';

  console.info('Retrieving manifest data from GitHub'.magenta);

  if (firmware.repo.indexOf('git+https') == 0) {
    if (firmware.repo.indexOf('#') > 0 ) {
      // we want a branch so get that detail.
      branch = '/' + firmware.repo.substring(firmware.repo.indexOf('#') + 1);
      repo = firmware.repo.substring(22, firmware.repo.indexOf('#'));
    } else {
      repo = firmware.repo.substring(22);
      branch = '/master';
    }

    base_uri = 'https://raw.githubusercontent.com' + repo + branch;
    manifest_uri = base_uri + '/manifest.json?' + (new Date().getTime());
  }

  if (manifest_uri == null) {
    throw new Error('Cannot find manifest of ' + firmware);
  }
  // download the manifest file and then hand it over to then
  // download the hex file ready to be written to the board
  const tmp_dir = tmp.dirSync();
  const manifest_file_path = tmp_dir.name + '/manifest.json';

  Download(manifest_uri).then(data => {
    let manifest = null;
    try {
      manifest = JSON.parse(data);
    } catch (e) {
      console.error('Manifest file incorrect');
      self.clean_temp_dir(tmp_dir);
      throw new Error('Manifest file error');
    }

    // now we need to download the hex file.
    let manifest_objects = (options.useFirmata ? manifest.firmata : manifest.backpack);

    if (manifest_objects == undefined) {
      console.error("An appropriate bin can't be found to flash in the manifest file.".red);
      console.error("This is likely because either the maintainer hasn't provided the right " +
                "path to the hex file or because you've passed in an innapropriate selector " +
                'on the --firmata= switch');
      console.log('Firmware types available from this manifest file:');
      if (manifest.firmata) {
        console.log('FIRMATA:'.blue);
        if (manifest.firmata.multi) {
          Object.keys(manifest.firmata).forEach(function(key) {
            if (key != 'multi') {
              console.log('\t "' + key + '" use --firmata=' + key);
            }
          });
        } else {
          console.log('\t default use --firmata');
        }
      }
      if (manifest.backpack) {
        console.log('I2C BACKPACK'.blue);
      }
      throw new Error("Can't find binary to flash");
    }

    // this deals with a firmata object supplied that isn't the default
    // one in order to grab the right hex file.
    if (options.useFirmata && options.firmataName != '') {
      manifest_objects = manifest.firmata[options.firmataName];
    } else if (options.useFirmata && options.firmataName == '' && manifest.firmata.multi != undefined) {
      // we have multiple firmatas and none have been supplied.
      throw new Error('Multiple firmatas are available, please supply a name');
    }

    if (manifest_objects.hexPath == undefined) {
      console.error(manifest_objects);
      self.clean_tmp_dir(tmp_dir);
      throw new Error('Hex path cannot be found');
    }

    if (manifest_objects.hexPath.indexOf('/') != 0) {
      manifest_objects.hexPath = '/' + manifest_objects.hexPath;
    }
    const hex_uri = base_uri + manifest_objects.bins + options.board +
                        manifest_objects.hexPath + '?' + (new Date().getTime());

    console.info('Downloading hex file')

    Download(hex_uri).then(hex_data => {
      const hex_path = tmp_dir.name + '/bin.hex';
      try {
        fs.writeFileSync(hex_path, hex_data);
      } catch (e) {
        console.error("Can't write hex file to file system".red);
        self.clean_tmp_dir(tmp_dir);
        throw new Error('HexWriteError');
      }

      // about to call the writer.
      cb(hex_path, tmp_dir, options);
    }).catch(function() {
      console.error("Can't download the hex file (%s)".red, hex_uri);
      self.clean_tmp_dir(tmp_dir);
      throw new Error('HexDownloadError');
    });
  }).catch(function(err) {
    console.error('There was an error downloading or processing the the manifest file.'.red);
    console.log(err);
  });
};

Interchange.prototype.check_firmware = function(firmware, options, cb) {
  // checks if the firmware makes sense and downloads the hex file
  // to a temporary location

  const board = options.board || 'nano'; // assumes nano if none provided
  const useFirmata = (firmware.indexOf('Firmata') > 0) || options.firmata || false;
  let firmataName = options.firmata || '';
  // check for default where no firmata name is supplied or default is implied.
  if (firmataName === true) {
    // set it to empty string
    firmataName = '';
  }

  // see if the firmware is in the directory
  fw = _.find(firmwares, function(f) {
    return f.name == firmware;
  });

  if (fw == undefined) {
    if (firmware.indexOf('git+https') >= 0) {
      // command has been passed with a git repo so make a temp object for
      // fw with appropriate stuff in it.
      fw = {
        'name': firmware,
        'deviceID': 0x01,
        'creatorID': 0x00,
        'repo': firmware,
        'firmata': useFirmata
      };
    } else {
      throw new Error('No firmware found: ' + firmware);
    }
  }

  // we have a firmware - check if we need firmata
  if (useFirmata) {
    if (! fw.firmata) {
      throw new Error(`Firmware ${fw.name} does not support custom firmata`);
    }
  }

  const opts = options || {};

  opts['useFirmata'] = useFirmata;
  opts['firmataName'] = firmataName;

  // now check if the firmware is in npm or github.
  if (fw.npm == undefined) {
    // use git repo
    this.download_from_github(fw, opts, cb);
  } else {
    // get from npm now
    this.download_from_npm(fw, opts, cb);
  }
};

module.exports = Interchange;
