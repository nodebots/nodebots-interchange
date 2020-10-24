const _ = require('lodash');
const Avrgirl = require('avrgirl-arduino');
const Serialport = require('serialport');
const child_process = require('child_process');
const colors = require('colors');
const fsextra = require('fs-extra');

const interchange_client = require('./interchange_client');
const Downloader = require('./downloader');

const creators = require('./firmwares.json').creators;
const firmwares = require('./firmwares.json').firmwares;
const version = require('../package.json').version;

// I think this can be refactored to be purely in the function where it is needed
let ic_client;//  = new interchange_client.Client();

const Interchange = function() {
  this.firmwares = firmwares;
  ic_client = new interchange_client.Client();
};

Interchange.prototype.clean_temp_dir = function(tmpdir) {
  // takes a temporary directory and cleans up any files within it and
  // then calls the callback to remove itself.
  if (tmpdir != undefined && tmpdir !== null && tmpdir !== '') {
    fsextra.removeSync(tmpdir.name);
  }
};

Interchange.prototype.list_devices = function() {
  // this method returns the list of available firmwares as a JSON object

  const fws = [];
  firmwares.forEach((firmware) => {
    fws.push({
      name: firmware.name,
      firmata: (firmware.firmata ? true : false),
      description: firmware.description
    });
  });

  return (fws);
};

Interchange.prototype.get_ports = function(cb) {
  return new Promise((resolve, reject) => {
    Serialport.list()
      .then((ports) => {
        resolve(ports);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

Interchange.prototype.list_ports = function() {
  // this function lists out all the ports available to flash firmware
  // this function  is now deprecated
  /* istanbul ignore next */
  if (!process.env.TEST) {
    console.warn('list_ports method deprecated - use get_ports instead');
  }
  return this.get_ports();
};

Interchange.prototype.check_firmware = (firmware, options = {}) => {
  // checks if the firmware makes sense and downloads the hex file
  // to a temporary location

  if (firmware == undefined || firmware == null) {
    throw new Error('Must define a firmware to flash');
  }

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
  // this is not currently an issue as all firmwares provide firmata support
  if (useFirmata) {
    if (! fw.firmata) {
      throw new Error(`Firmware ${fw.name} does not support custom firmata`);
    }
  }

  const opts = options || {};

  opts['useFirmata'] = useFirmata;
  opts['firmataName'] = firmataName;

  return {fw, opts};
};

Interchange.prototype.download_firmware = (fw, opts) => {
  // Figure out how to download and locate the appropriate firmware
  // then return the path to the file and optionally the temporary directory
  // returns the promise to download which will fulfill later.
  const dl = new Downloader({fw});
  return dl.download(fw, opts)
    .then(({hexpath, tmpdir}) => {
      return ({hexpath, tmpdir});
    })
    .catch((err) => { throw err });
};

Interchange.prototype.flash_firmware = function(firmware, opts) {
  // flashes the board with the options provided.

  const board = opts.board || 'nano'; // assumes nano if none provided
  let port = opts.port || ''; // will leave empty and sees what happens.

  return new Promise((resolve, reject) => {
    // wrap this in a promise to handle the callback flow a bit better.
    const avrgirl = new Avrgirl({
      board,
      port,
      debug: () => {}
    });

    avrgirl.flash(firmware, (err) => {
      if (err) {
        reject(err);
      }

      //  send the port back to be able to configure it.
      if (port == '') {
        port = avrgirl.options.port;
      }
      resolve(port);
    });
  });
};

Interchange.prototype.install_firmware = async function(firmware, options = {}) {
  // manages the firmware installation process

  if (!firmware) {
    throw new Error('Please supply a firmware to install');
  }

  const settings = {
    board: options.board || process.env.INTERCHANGE_BOARD || 'nano',
    port: options.port || process.env.INTERCHANGE_PORT,
    firmata: options.firmata,
    i2c_address: options.address
  };

  // check firmware
  // download firmware
  // flash firmware to device
  // optionally do interchange client configuration

  try {
    // check the firmware
    const {fw, opts} = await this.check_firmware(firmware, settings);
    const usingFirmata = opts.useFirmata || false; // Assumes not unless explicit

    /* istanbul ignore next */
    if (!process.env.TEST) {
      console.log('Downloading firmware');
    }
    const {hexpath, tmpdir} = await this.download_firmware(fw, opts);

    /* istanbul ignore next */
    if (!process.env.TEST) {
      console.log('Flashing firmware to board');
    }
    const port = await this.flash_firmware(hexpath, options)
      .then((serport) => {
        if (tmpdir) {
          this.clean_temp_dir(tmpdir);
        }
        return serport;
      })
      .catch((err) => {
        throw err;
      });

    // now we should configure it if required.
    if (!usingFirmata) {
      /* istanbul ignore next */
      if (!process.env.TEST) {
        console.log('Configuring the firmware'.magenta);
      }
      // combine options and firmware details together and pass across
      return this.set_firmware_details(port, {...opts, ...fw})
        .then(() => { return true })
        .catch(err => { throw err });
    }
  } catch (e) {
    throw e;
  }
};

Interchange.prototype.get_firmware_info = function(port) {
  // attempts to connect to an interchange firmware and get the
  // installed details.

  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port specified'));
    }

    ic_client.port = port;

    ic_client.on('error', (err) => {
      reject(err);
    });

    ic_client.on('ready', () => {
      ic_client.get_info((err, data) => {
        // json is returned
        if (err) {
          ic_client.close();
          // emit this as we're inside the handler and need to pass it
          // back outwards appropriately due to context
          ic_client.emit('error', err);
        } else {
          // look up the details from the various resources
          let fw_details = _.find(firmwares, (f) => {
            return ((parseInt(f.creatorID, 16) == data.creatorID) &&
                            (parseInt(f.firmwareID, 16) == data.firmwareID));
          });

          if (typeof(fw_details) === 'undefined') {
            // Cannot find firmware match from library. Best guess follows
            if (data.creatorID == undefined || data.creatorID == 'undefined') data.creatorID = '0x00';
            fw_details = {
              name: 'Unknown',
              firmwareID: data.firmwareID || 0,
              creatorID: data.creatorID,
              description: 'This is an unknown backpack firmware'
            };
          }

          const creator = _.find(creators, {id: fw_details.creatorID});

          fw_details.creator = creator;
          fw_details.firmware_version = data.fw_version;
          fw_details.interchange_version = data.ic_version;
          fw_details.compile_date = data.compile_date;
          fw_details.i2c_address = data.i2c_address;
          fw_details.use_custom_addr = data.use_custom_addr;

          // close the serial port.
          ic_client.close();

          // send the data back.
          resolve(fw_details);
        }
      });
    })
  })
};

Interchange.prototype.set_firmware_details = (port, opts) => {
  // sets the firmware details on the hardware as needed
  // opts has values set as hex strings

  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port specified'));
    } else {
      // check that the shape of the opts is correct.
      if (typeof(opts.address) === 'undefined') {
        return reject(new Error('No default address supplied'));
      }
      if (typeof(opts.firmwareID) === 'undefined') {
        return reject(new Error('No firmware ID supplied'));
      }
      if (typeof(opts.creatorID) === 'undefined') {
        return reject(new Error('No creator ID supplied'));
      }

      // now the shape of the object is checked then we can proceed
      ic_client.port = port;

      ic_client.on('error', (err) => {
        ic_client.close();
        reject(err);
      });

      ic_client.on('ready', () => {
        // use defaults and then check if we need otherwise
        let address = parseInt(opts.address, 16);
        let use_custom = 0;
        if (opts.i2c_address != undefined && opts.i2c_address != 0) {
          // override with the custom one.
          address = parseInt(opts.i2c_address, 16);
          use_custom = 1;
        }

        const settings = {
          firmwareID: parseInt(opts.firmwareID, 16),
          creatorID: parseInt(opts.creatorID, 16),
          i2c_address: address,
          use_custom_address: use_custom
        };

        ic_client.set_details(settings, () => {
          ic_client.close();
          resolve();
        });
      });
    }
  });
};

/**
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
**/


module.exports = Interchange;
