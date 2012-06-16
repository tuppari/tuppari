REPORTER = list

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
					--reporter ${REPORTER} \
					--require should

.PHONY: test
