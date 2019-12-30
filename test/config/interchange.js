// this module is used to set up the interchange object with different
// configurations

module.exports = {
  fw: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'github',
    'firmata': true
  },
  fw_backpack: {
    'name': 'test_firmware',
    'deviceID': 0x01,
    'creatorID': 0x00,
    'repo': 'github',
    'firmata': false,
    'address': 0x27
  },
  options: {
    board: 'nano',
    port: '/dev/dummy',
    firmata: true,
    i2c_address: undefined,
    useFirmata: true,
    firmataName: ''
  },
  options_no_port: {
    board: 'nano',
    port: '',
    firmata: true,
    i2c_address: undefined,
    useFirmata: true,
    firmataName: ''
  },
  options_backpack: {
    board: 'nano',
    port: '/dev/dummy',
    i2c_address: undefined
  }
}
