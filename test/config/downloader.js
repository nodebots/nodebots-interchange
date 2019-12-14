// This file is used to set up the various configs to use in the tests for
// firmwares and the like

module.exports = {
  fw: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'github',
    'firmata': false
  },

  npm_fw: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'npm': {
      'package': 'test-pkg'
    },
    'firmata': false
  },

  npm_fw_ver: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'npm': {
      'package': 'test-pkg',
      'version': '2.7.3'
    },
    'firmata': false
  },

  npm_fw_repo: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'npm': {
      'repo': 'git+https://www.github.com/test/test-package',
      'package': 'test-pkg'
    },
    'firmata': false
  },

  gh_fw: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'git+https://github.com/test/test-package',
    'firmata': false
  },

  gh_fw2: {
    'name': 'test_firmware2',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'firmata': false
  },

  gh_fw3: {
    'name': 'test_firmware3',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'https://github.com/test/test-package',
    'firmata': false
  },

  gh_branch_fw: {
    'name': 'test_firmware4',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'git+https://github.com/test/test-package#dev-branch',
    'firmata': false
  },

  gh_master_branch_fw: {
    'name': 'test_firmware5',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'git+https://github.com/test/test-package',
    'firmata': false
  },

  manifest: {
    'backpack': {
      'bins': '/firmware/bin/backpack/',
      'hexPath': 'backpack.ino.hex'
    },
    'firmata': {
      'bins': '/firmware/bin/firmata/',
      'hexPath': '/firmata.ino.hex'
    }
  },

  multi_manifest: {
    'firmata': {
      'multi': true,
      'firmata1': {
        'bins': '/firmware/bin/firmata1/',
        'hexPath': '/firmata.ino.hex'
      },
      'firmata2': {
        'bins': '/firmware/bin/firmata2/',
        'hexPath': '/firmata.ino.hex'
      }
    }
  },

  options: {
    board: 'nano',
    port: '/dev/dummy',
    firmata: true,
    i2c_address: undefined,
    useFirmata: true,
    firmataName: ''
  },

  named_firmata_options: {
    board: 'nano',
    port: '/dev/dummy',
    firmata: true,
    i2c_address: undefined,
    useFirmata: true,
    firmataName: 'firmata2'
  },

  no_named_firmata_options: {
    board: 'nano',
    port: '/dev/dummy',
    firmata: true,
    i2c_address: undefined,
    useFirmata: true
  },

  backpack_options: {
    board: 'uno',
    port: '/dev/dummy',
    firmata: false,
    i2c_address: undefined,
    useFirmata: false
  }
}
