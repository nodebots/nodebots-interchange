// This module executes the downloading of the files properly.
const axios         = require('axios');
const child_process = require('child_process');
const colors        = require('colors');
const fs            = require('fs');
const fsextra       = require('fs-extra');
const path          = require('path');
const tmp           = require('tmp');
const util          = require('util');

class Downloader {
  constructor(opts) {
    // set up the defaults

    this.fw = undefined;

    if (typeof(opts) === 'undefined') {
      this.fw = undefined;
    } else {
      this.fw = opts.fw || undefined;
    }
  }


  get_path_from_manifest(manifest, options) {
    // takes the manifest data and returns the path to the hex file

    // TODO - put in the bits here around installing from GH and having
    // multiple options.
    if (typeof(manifest) === 'undefined') {
      throw new Error('No manifest data provided');
    }

    if (typeof(options) === 'undefined') {
      throw new Error('No options provided');
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

    const hex_path = path.join(manifest_objects.bins, options.board, manifest_objects.hexPath);

    return (hex_path);
  }

  get_manifest_from_npm(firmware) {
    // gets the manifest file and returns the content

    if (typeof(firmware) === 'undefined') {
      throw new Error('No firmware details provided');
    }

    // as we have installed get the manifest file.
    const base_path = this.get_npm_basepath(firmware);
    const manifest_file = path.join(base_path, 'manifest.json');
    let manifest = null;

    try {
      manifest = JSON.parse(fs.readFileSync(manifest_file));
    } catch (e) {
      throw new Error('Manifest file incorrect');
    }

    return manifest;
  }

  get_npm_basepath(firmware) {
    // returns the base path of the folder when using npm installs
    if (typeof(firmware) === 'undefined') {
      throw new Error('No firmware details provided');
    }

    if (typeof(firmware.npm.package) === 'undefined') {
      throw new Error('No npm package provided');
    }

    return path.join('.', 'node_modules', firmware.npm.package);
  }

  async get_file_from_github(uri) {
    // gets the manifest file from github and returns it.
    return await axios.get(uri)
      .then((response) => {
        if (response.status == '200') {
          // got the data
          return response.data;
        }
      })
      .catch(err => {
        throw new Error('Unable to retrieve file')
      });
  }

  normalise_gh_repo_path(repo_uri) {
    // takes a github repo path and make sure it's in the right form to be
    // able to download files from it. IE removes the .git off the end.
    // returns a string.

    let repo_str = repo_uri;
    if (repo_str.endsWith('/')) {
      repo_str = repo_str.substring(0, repo_str.length -1);
    }

    if (repo_str.endsWith('.git')) {
      repo_str = repo_str.substring(0, repo_str.length - 4);
    }

    return repo_str;
  }

  download_from_github(firmware, options) {
    // downloads the file from github and returns the path to the hex file
    // as well as the temp directory it exists in to clean it up
    let base_uri = null;
    return new Promise((resolve, reject) => { // need to try and reolve this async out
      // setup GH

      if (firmware === undefined) {
        reject(new Error('No firmware provided'));
      }

      /* istanbul ignore next */
      if (!process.env.TEST) {
        console.info(colors.magenta(`Installing ${firmware.name} from github`));
      }
      // work out where the manifest file is
      if (firmware.repo === undefined) {
        reject(new Error('No github repo specified'));
      }

      let manifest_uri = null;
      let branch = 'master';
      let repo = '';

      // console.log(firmware);
      if (firmware.repo.indexOf('git+https') == 0) {
        if (firmware.repo.indexOf('#') > 0 ) {
          // we want a branch so get that out of the URL
          branch = '/' + firmware.repo.substring(firmware.repo.indexOf('#') + 1);
          repo = firmware.repo.substring(22, firmware.repo.indexOf('#'));
        } else {
          repo = firmware.repo.substring(22);
          branch = '/master';
        }

        repo = this.normalise_gh_repo_path(repo);
        base_uri = `https://raw.githubusercontent.com${repo}${branch}`;
        manifest_uri = `${base_uri}/manifest.json?${(new Date().getTime())}`;
      } else {
        reject(new Error('Wrong protocol used for github'));
      }

      this.get_file_from_github(manifest_uri)
        .then((manifest) => resolve(manifest))
        .catch(err => reject(err));
    }).then((manifest) => {
      // now we process the manifest file, download the hex binary and then
      // save it and return a path to it.
      const bin_path = this.get_path_from_manifest(manifest, options);
      const bin_uri = `${base_uri}${bin_path}?${(new Date().getTime())}`;

      // save the hex file
      return this.get_file_from_github(bin_uri)
        .then(hexdata => {
          const tmpdir = tmp.dirSync();
          const hexpath = `${tmpdir.name}/bin.hex`;

          // turn the write file into a promise.
          const writeFile = util.promisify(fs.writeFile);

          // now write the file back.
          return writeFile(hexpath, hexdata)
            .then(() => {
              return {hexpath, tmpdir};
            })
            .catch(err => {
              fsextra.removeSync(tmpdir.name);
              tmpdir.removeCallback();
              throw err;
            });
        })
        .catch(err => {
          throw err;
        });
    });
  }

  download_from_npm(firmware, options) {
    // downloads the file from npm and returns the path to the hex file.
    return new Promise((resolve, reject) => {
      // Set up NPM.
      /* istanbul ignore next */
      if (!process.env.TEST) {
        console.info(colors.magenta('Installing ' + firmware.name + ' from npm'));
      }

      // first try to install the npm package
      let command = 'npm install --no-save ';

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
        reject(e);
      }

      const manifest = this.get_manifest_from_npm(firmware, options);

      let hexpath;
      try {
        hexpath = path.join(
          this.get_npm_basepath(firmware),
          this.get_path_from_manifest(manifest, options)
        );
      } catch (e) {
        reject(new Error('Cannot get path to hex file', e));
      }

      resolve({hexpath});
    });
  }

  download(firmware, options) {
    // manages the download of the firmware
    return new Promise((resolve, reject) => {
      // check and see if firmware is specified
      if (typeof(firmware) === 'undefined') {
        // set it to the constructor value
        firmware = this.fw;
      }

      // if we're still undefined then throw an error.
      if (typeof(firmware) === 'undefined') {
        const err = new Error('There is no firmware supplied');
        reject(err);
      }

      // now we choose what way to download the file
      // now check if the firmware is in npm or github.
      let downloader_to_use;
      if (firmware.npm == undefined) {
        // use git repo
        downloader_to_use = this.download_from_github.bind(this);
      } else {
        // get from npm now
        downloader_to_use = this.download_from_npm.bind(this);
      }

      downloader_to_use(firmware, options)
        .then((values) => {
          resolve(values);
        })
        .catch(err => reject(err));
    });
  }
}

module.exports = Downloader;
