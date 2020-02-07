# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 2.0.1 (2020-02-07)


### ⚠ BREAKING CHANGES

* Getting downloader functionality working for github end to end
* Refactored the download from npm functionality tobe more async and testable

### Features

* **test:** Added jest test spec for firmwares ([3dc708e](https://github.com/ajfisher/nodebots-interchange/commit/3dc708e4e4676d2772efbb52ad87109c812cd9a6))
* **tests:** Added testing structure ([72f5839](https://github.com/ajfisher/nodebots-interchange/commit/72f5839b101e38aefac482ae3cc4fadd1b9c34a8))
* **tests:** Remove travis for build process ([b4563ee](https://github.com/ajfisher/nodebots-interchange/commit/b4563ee439f155dc757bce087d1843201614d7e7))
* **tests:** Removed old nodeunit tests ([dae49be](https://github.com/ajfisher/nodebots-interchange/commit/dae49beedcb33cfb068627c7ae474491b114b0d2))
* added a new test firmware for gh master branch usage ([369a661](https://github.com/ajfisher/nodebots-interchange/commit/369a6613d46f212a20df6e5551dd3d4f7b1d17ae))
* Added make command to set arduino back to blink ([5dcd1c6](https://github.com/ajfisher/nodebots-interchange/commit/5dcd1c656e85f212a512784caf35b9acc3bc3c20))
* adding further tests for the interchange code ([e700b35](https://github.com/ajfisher/nodebots-interchange/commit/e700b357eb936ad430af299ce7f78121f6d51999))
* beginning refactoring of downloader with tests ([901e198](https://github.com/ajfisher/nodebots-interchange/commit/901e198febe057f330a03cc8a397dfa48d36e1cd))
* new tests added for github downloads and refactoring to suit ([b365b6c](https://github.com/ajfisher/nodebots-interchange/commit/b365b6cec9802d305360cb8b6cd2be86b19dd8ff))
* refactor out firmware requirement of manifest interpretation and tests to suit ([7d21b95](https://github.com/ajfisher/nodebots-interchange/commit/7d21b9515062df53f02aa6e3f1e9508a8e79b8f6))


### Bug Fixes

* **actions:** Updated coverage workflow to trigger on master pushes and PRs ([b0e5006](https://github.com/ajfisher/nodebots-interchange/commit/b0e5006081da371959874c0fbf68d0aa0c85e936))
* **package:** update fs-extra to version 7.0.0 ([22b8bc1](https://github.com/ajfisher/nodebots-interchange/commit/22b8bc10a8324e0e7d866bfea5198a9025aca53b))
* **package:** update serialport to version 7.0.1 ([3de8982](https://github.com/ajfisher/nodebots-interchange/commit/3de898294dbf0b72eb33bba53ba7f19ab8b98752))
* **tests:** Added tests for temp directory removal ([00712ba](https://github.com/ajfisher/nodebots-interchange/commit/00712ba5e37f63bcf4edb04dd56ccd4f8df42790))
* made a test mode variable ([3912786](https://github.com/ajfisher/nodebots-interchange/commit/3912786113139dc5d0fd4a888c546f90313a87a0))
* Made property on ic client to determine if sp is open and tests to support ([6b0d282](https://github.com/ajfisher/nodebots-interchange/commit/6b0d2821cf317432a76dd8a85d9fb96f98050993))
* refactor ports command to use promises ([fb14978](https://github.com/ajfisher/nodebots-interchange/commit/fb14978d5c8a84423729b20a9afb61deecfba422))
* Refactor the firmware listing in cli to be testable and write tests ([a0c23ce](https://github.com/ajfisher/nodebots-interchange/commit/a0c23ceb2a59c4a8d02c4b06b4a7fe49ca7f5c64))
* refactor to return hexpath in object from npm install ([cfd94ea](https://github.com/ajfisher/nodebots-interchange/commit/cfd94ea9fe446c7b62da3fc989fe2dc771e39229))
* Refactored the interchange client to be more testable and moved command line formatting to the cli tool ([94a7fc2](https://github.com/ajfisher/nodebots-interchange/commit/94a7fc27fdd56b687c079c8781d37d12641169a3))
* Resolved .git urls for github package installs. Fixes [#58](https://github.com/ajfisher/nodebots-interchange/issues/58) ([627236b](https://github.com/ajfisher/nodebots-interchange/commit/627236bd726b25f167e48a4680840de1401a7de2))
* starting to refactor the interchange lib to use promises and refactor callbacks into await flow ([5cfa2e5](https://github.com/ajfisher/nodebots-interchange/commit/5cfa2e5b04e9adc3899d6ea85087d79141af7702))
* Tests failed and not picked up in previous commit ([3d23113](https://github.com/ajfisher/nodebots-interchange/commit/3d23113a94b5274477d63ed18a8db1580c1c2895))
* update tests and cli to use new refactored ports ([99ad915](https://github.com/ajfisher/nodebots-interchange/commit/99ad9150589858e9958a96fa3d0d9b6abda9ab8e))
* workflow bugs ([1226fbb](https://github.com/ajfisher/nodebots-interchange/commit/1226fbb9803ba765db0c458c50884f4b26a9942d))
* workflow issues with coverage generation ([56a68f2](https://github.com/ajfisher/nodebots-interchange/commit/56a68f223c762dc8041aa265fa338114b3bab2dd))


* Getting downloader functionality working for github end to end ([39459bb](https://github.com/ajfisher/nodebots-interchange/commit/39459bb820e1fe8d7e18cd0da89cccc05089ed9f))
* Refactored the download from npm functionality tobe more async and testable ([4664bcd](https://github.com/ajfisher/nodebots-interchange/commit/4664bcd46c50ed5035808833d8f2eceb21efda92))

## [2.0.0](https://github.com/ajfisher/nodebots-interchange/compare/v1.2.1...v2.0.0) (2019-12-30)


### ⚠ BREAKING CHANGES

* Getting downloader functionality working for github end to end
* Refactored the download from npm functionality tobe more async and testable

### Features

* added a new test firmware for gh master branch usage ([369a661](https://github.com/ajfisher/nodebots-interchange/commit/369a6613d46f212a20df6e5551dd3d4f7b1d17ae))
* Added make command to set arduino back to blink ([5dcd1c6](https://github.com/ajfisher/nodebots-interchange/commit/5dcd1c656e85f212a512784caf35b9acc3bc3c20))
* adding further tests for the interchange code ([e700b35](https://github.com/ajfisher/nodebots-interchange/commit/e700b357eb936ad430af299ce7f78121f6d51999))
* beginning refactoring of downloader with tests ([901e198](https://github.com/ajfisher/nodebots-interchange/commit/901e198febe057f330a03cc8a397dfa48d36e1cd))
* new tests added for github downloads and refactoring to suit ([b365b6c](https://github.com/ajfisher/nodebots-interchange/commit/b365b6cec9802d305360cb8b6cd2be86b19dd8ff))
* refactor out firmware requirement of manifest interpretation and tests to suit ([7d21b95](https://github.com/ajfisher/nodebots-interchange/commit/7d21b9515062df53f02aa6e3f1e9508a8e79b8f6))
* **test:** Added jest test spec for firmwares ([3dc708e](https://github.com/ajfisher/nodebots-interchange/commit/3dc708e4e4676d2772efbb52ad87109c812cd9a6))
* **tests:** Added testing structure ([72f5839](https://github.com/ajfisher/nodebots-interchange/commit/72f5839b101e38aefac482ae3cc4fadd1b9c34a8))
* **tests:** Remove travis for build process ([b4563ee](https://github.com/ajfisher/nodebots-interchange/commit/b4563ee439f155dc757bce087d1843201614d7e7))
* **tests:** Removed old nodeunit tests ([dae49be](https://github.com/ajfisher/nodebots-interchange/commit/dae49beedcb33cfb068627c7ae474491b114b0d2))


### Bug Fixes

* made a test mode variable ([3912786](https://github.com/ajfisher/nodebots-interchange/commit/3912786113139dc5d0fd4a888c546f90313a87a0))
* Made property on ic client to determine if sp is open and tests to support ([6b0d282](https://github.com/ajfisher/nodebots-interchange/commit/6b0d2821cf317432a76dd8a85d9fb96f98050993))
* refactor ports command to use promises ([fb14978](https://github.com/ajfisher/nodebots-interchange/commit/fb14978d5c8a84423729b20a9afb61deecfba422))
* Refactor the firmware listing in cli to be testable and write tests ([a0c23ce](https://github.com/ajfisher/nodebots-interchange/commit/a0c23ceb2a59c4a8d02c4b06b4a7fe49ca7f5c64))
* refactor to return hexpath in object from npm install ([cfd94ea](https://github.com/ajfisher/nodebots-interchange/commit/cfd94ea9fe446c7b62da3fc989fe2dc771e39229))
* Refactored the interchange client to be more testable and moved command line formatting to the cli tool ([94a7fc2](https://github.com/ajfisher/nodebots-interchange/commit/94a7fc27fdd56b687c079c8781d37d12641169a3))
* starting to refactor the interchange lib to use promises and refactor callbacks into await flow ([5cfa2e5](https://github.com/ajfisher/nodebots-interchange/commit/5cfa2e5b04e9adc3899d6ea85087d79141af7702))
* Tests failed and not picked up in previous commit ([3d23113](https://github.com/ajfisher/nodebots-interchange/commit/3d23113a94b5274477d63ed18a8db1580c1c2895))
* **tests:** Added tests for temp directory removal ([00712ba](https://github.com/ajfisher/nodebots-interchange/commit/00712ba5e37f63bcf4edb04dd56ccd4f8df42790))
* update tests and cli to use new refactored ports ([99ad915](https://github.com/ajfisher/nodebots-interchange/commit/99ad9150589858e9958a96fa3d0d9b6abda9ab8e))
* workflow bugs ([1226fbb](https://github.com/ajfisher/nodebots-interchange/commit/1226fbb9803ba765db0c458c50884f4b26a9942d))
* workflow issues with coverage generation ([56a68f2](https://github.com/ajfisher/nodebots-interchange/commit/56a68f223c762dc8041aa265fa338114b3bab2dd))
* **package:** update serialport to version 7.0.1 ([3de8982](https://github.com/ajfisher/nodebots-interchange/commit/3de898294dbf0b72eb33bba53ba7f19ab8b98752))


* Getting downloader functionality working for github end to end ([39459bb](https://github.com/ajfisher/nodebots-interchange/commit/39459bb820e1fe8d7e18cd0da89cccc05089ed9f))
* Refactored the download from npm functionality tobe more async and testable ([4664bcd](https://github.com/ajfisher/nodebots-interchange/commit/4664bcd46c50ed5035808833d8f2eceb21efda92))

## 1.5.0

* Full serialport version upgrade and updates to reflect new style of calling

## 1.4.0

* Updated considerable number of packages:
* AVR Girl - thanks @noopkat
* Lodash, FS Extras, async, colors, commander, inquirer
* updated all security packages

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
