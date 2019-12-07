// This module executes the downloading of the files properly.
const child_process = require('child_process');
const Download      = require('download');
const fs            = require('fs');
const fsextra       = require('fs-extra');
const http          = require('http');
const path          = require('path');
const tmp           = require('tmp');

class Downloader {
  constructor(opts) {
    // set up the defaults

    if (typeof(opts) === 'undefined') {
      this.fw = undefined;
    } else {
      this.fw = opts.fw || undefined;
    }
  }

  download(firmware) {
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
    });
  }

  download_from_github(firmware) {
  }

  download_from_npm(firmware) {
  }
}

module.exports = Downloader;
