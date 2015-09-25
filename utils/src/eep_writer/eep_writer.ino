/** 

Name:       EEPROM Writer
Author:     Andrew fisher
version:    0.1
Description:

This application is used to set certain eeprom values on an arduino in order to
override the defaults supplied by a particular firmware. In particular this allows
a binary firmware to be shipped for a backpack without the end user having to
compile things but allows the end user to configure an I2C address in the advent
of a clash.

**/


/**

* Establish comms with serial connection.
* Read value reads the EEPROM and then outputs this value to the serial connection
* write value takes a value from the serial connection and writes this to the eeprom

* Keep this generic so that it basically reads and writes a given number of 
bytes to a specific address space and that's all it does and then leave the 
configuration aspect of this to the JS side.

**/
