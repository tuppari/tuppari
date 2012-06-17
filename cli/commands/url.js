module.exports = function (program) {

  /*
   * target command
   */

  program
    .command('target [url]')
    .description('  Report current target URL or sets a new target URL')
    .action(function (uri) {
      if (uri) {
        program.print('set target URL = %s', uri);
        program.updateTargetUrl(uri);
      } else {
        program.print('target URL = %s', program.getTargetUrl());
      }
    });

};