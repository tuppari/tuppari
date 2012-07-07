module.exports = function (program) {

  /*
   * register command
   */

  program
    .command('register <accountName>')
    .description('  Regist a new account')
    .action(function (accountName) {
      program.password('Password: ', '*', function (passwd) {
        program.print('');
        program.post({
            path: '/accounts/register',
            body: {
              accountName: accountName,
              password: passwd
            },
            operation: 'CreateAccount'
          },
          function (res, body) {
            program.print('Create a new account name "%s" success.', accountName);
          }
        );
      });
    });

  /*
   * login command
   */

  program
    .command('login')
    .description('  Login with your credentials to target server')
    .action(function () {
      program.prompt('Account Name: ', function (accountName) {
        program.password('Password: ', '*', function(passwd){
          program.print('');
          program.post({
              path: '/accounts/auth',
              body: {
                accountName: accountName,
                password: passwd
              },
              operation: 'GetAccountCredentials'
            },
            function (res, body) {
              program.updateCredentials(body.credentials);
              program.print('Login success.');
            }
          );
        });
      });
    });

  /*
   * logout command
   */

  program
    .command('logout')
    .description('  Clear local authentication credentials')
    .action(function () {
      program.updateCredentials('{}');
      program.print('Logout success.');
    });

};