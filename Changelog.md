# Interchange Changelog

## 1.3.0

* Updated FS Extras package to newer version that is a major update.


## 1.2.0

* Updated serialport and avrgirl dependencies to use a newer version of
node serialport
* Added eslint and rules for this. Refactor codebase to use the linter

### 1.1.5

* Routing nits on documentation

### 1.1.4

* Removed some artefacts introduced for debugging
* Updated dependencies across the board

### 1.1.3

* Fixed error when version not supplied for npm installs.

### 1.1.2

* Better error handling for firmata situations.

### 1.1.1

* Updated readme file with new example

## 1.1.0

* Refactor on serialport to use new module requires.
* Added ability to now install from a github branch using
git+https://github.com/<user>/<repo>#<branchname>

### 1.0.2

* Updates to bring packages into line with upstream dependencies
* Small refactor to inquirer to make it promise based per current standard
* Refactor to the download from repo code to make it work with Download npm
package and promise based design
* Update serialport package to use v4

### 1.0.1

* Use of inquirer to create an interactive shell prompt
* Release to 1.0 stable as a result of wide usage without any majors.

## 1.0.0-alpha

* alpha release of V1.

## 0.5.0

* Refactor of the minimist CLI interface to use commander and better help system.
Thanks to Frxnz for the refactor.


### 0.4.1

* Updated outdated packages including avrgirl with upstream mods

## 0.4.0

* Modified firmata behaviour to allow named firmatas to be installed if one
is supplied using `--firmata=<name>`. No named supply will attempt to install a
default if one exists.

## 0.3.0

* Added ability to list the ports available on the machine + docs
* Added Frxnz as a contributor - thanks for the PR!
* Added Noopkat as contributor - avrgirl has provided a heap of heavy lifting
and she has made mods to help interchange too as well as very sage advice.
* Modifications to docs to provide instructions to install globally.
* Updated docs to ensure understanding of port usage
* Patches to use the same port avrgirl discovers for flashing if none supplied.

### 0.2.1

* Added documentation for the usage examples.

## 0.2.0

* Added ability to install from an npm package
* Added ability to install from git URL directly using git+https://path
* Can now set backpack details directly without recompiling firmware. This happens
automatically when a backpack is detected through configuration mode and the
interchange client.
* Can dump the details of a backpack that has been plugged in to show you
what Interchange thinks is on it use `interchange read -p /device/path`
* Added creator directory

### 0.1.4

* Added capability to load standard firmata directly with `install StandardFirmata`
* updated docs, fixed paths for the manifest file
* Updated hex and manifest download to put a timestamp on end of the request
because github raw has a very long cache.

### 0.1.3

* refactored code to allow for different ways to get the code to download the
files for flashing to the board.

### 0.1.2

* Fixed manifest bug that was present from error checking
* Migrated to new manifest style
* Included ability to use `--firmata` to indicate installation of custom firmata
if it is available.
* updates to readme to bring back in line
* changed npm structure in devices to reflect installation using npm versions
correctly.
* refactored to be firmware_list not devices so it makes more sense.

### 0.1.1

* Removed some dependencies and rationalised that to Download
* Put better error handling on download steps
* Added facility to clean up the temp directory after being finished within it
so as not to litter peep's filesystem

## 0.1.0

* End to end test capable on hc-sr04 device
* added core of the interchange file that glues everything together

### 0.0.3

* brought in AVRGirl by the wonderful [@noopkat](http://github.com/noopkat) and
made it command line only at this point.
* added list option to interchange to get devices
* refined a couple of tests on the device.json file
* Defined manifest requirements for compliant firmware
* Updated dev documentation to reflect this.

### 0.0.3

* brought in AVRGirl by the wonderful [@noopkat](http://github.com/noopkat) and
built a scaffold to test a single build with.

### 0.0.2

* Definition of structure of how to build a compatible interchange system.
* Started the repository of interchange packages with node-pixel.
* Started dependencies for npm.

### 0.0.1

* Initial idea with some discussion in various channels see background documentation.
