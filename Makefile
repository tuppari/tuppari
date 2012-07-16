REPORTER = list

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
					--reporter ${REPORTER} \
					--require should

minify:
	uglifyjs -o ./client/tuppari.min.js ./client/tuppari.js

.PHONY: test minify
