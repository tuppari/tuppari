var util = require('util');

module.exports = function (program) {

  program
    .command('app:create <appname>')
    .description('  Create a new application')
    .action(function (appname) {
      var path = '/apps';
      var requestBody = {
        applicationName: appname,
        credentials: program.credentials.id
      };
      var uri = program.signedUrl('POST', path, requestBody);

      program.post(uri, requestBody, function (res, body) {
        program.print('Create a new application named "%s" success.', appname);
        program.print('Make a note of following application infomation to access from your code.');
        program.printJson(body);
      });
    });

};