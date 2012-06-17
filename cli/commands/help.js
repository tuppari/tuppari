module.exports = function (program) {

  program
    .command('help [command]')
    .description('# Get general help or help on a specific command')
    .action(function (command) {
      if (command) {
        console.log(program.commandHelpInformation(command));
      } else {
        console.log(program.helpInformation());
      }
    });

};