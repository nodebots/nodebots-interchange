help:
	@echo "blink [board=nano|uno]	Flashes blink to the board."
	@echo "clean					Clean up any build files etc"
	@echo "install					Install the appropriate packages etc"
	@echo "lint						Lint the code"
	@echo "tests					Run the tests"
	@echo "test-coverage			Run the tests and build coverage data"

blink:
	@echo "Wiping board back to blink state"
	@avrgirl-arduino flash -f node_modules/avrgirl-arduino/junk/hex/$(BOARD)/Blink.cpp.hex -a $(BOARD)
	@echo "Completed"

clean:
	rm -rf ./node_modules

install: clean
	npm install

lint:
	npm run lint

tests:
	npm run test

test-coverage:
	npm run coverage
