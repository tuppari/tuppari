var util = require('util');

module.exports = function (program) {

  program
    .command('create <appname>')
    .description('  Create a new application')
    .action(function (appname) {
      if (!program.credentials.id) {
        program.print('You must login to create a new application');
        return;
      }

      program.post({
          path: '/applications',
          body: {
            applicationName: appname
          },
          authRequired: true,
          operation: 'CreateApplication'
        },
        function (res, body) {
          program.print('Create a new application named "%s" success.', appname);
          program.print('Make a note of following application infomation to access from your code.');
          program.printJson(body);
        }
      );
    });

  program
    .command('delete <appname>')
    .description('  Delete specified application')
    .action(function (appname) {
      if (!program.credentials.id) {
        program.print('You must login to delete any application');
        return;
      }

      program.post({
          path: '/applications',
          body: {
            applicationName: appname
          },
          authRequired: true,
          operation: 'DeleteApplication'
        },
        function (res, body) {
          program.print('Create a new application named "%s" success.', appname);
          program.print('Make a note of following application infomation to access from your code.');
          program.printJson(body);
        }
      );
    });

  program
    .command('list')
    .description('  List owned applications')
    .action(function () {
      if (!program.credentials.id) {
        program.print('You must login to delete any application');
        return;
      }

      program.post({
          path: '/applications',
          body: {},
          authRequired: true,
          operation: 'ListApplication'
        },
        function (res, body) {
          var apps = JSON.parse(body);
          program.print('You have %d applications', Object.keys(apps).length);
          program.printJson(body);
        }
      );
    });

};