module.exports = function (program) {

  /*
   * info command
   */

  program
    .command('info')
    .description('  Show target server information')
    .action(function () {
      program.get({ path: '/info' }, function (res, body) {
        program.print('url: %s', program.getTargetUrl());
        program.print('information:');
        program.printJson(body);
      });
    });

};