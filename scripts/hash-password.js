#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Password provided as command line argument
    const password = args[0];
    const hashedPassword = hashPassword(password);
    console.log('Hashed password:');
    console.log(hashedPassword);
    process.exit(0);
  } else {
    // Interactive mode - hide password input
    console.log('Password Hasher Tool');
    console.log('===================');
    console.log('This tool will generate a bcrypt hash of your password.');
    console.log('');
    
    // Hide password input
    process.stdout.write('Enter password: ');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          console.log(''); // New line after hidden input
          
          if (password.length === 0) {
            console.log('No password entered. Exiting.');
            process.exit(1);
          }
          
          const hashedPassword = hashPassword(password);
          console.log('');
          console.log('Hashed password:');
          console.log(hashedPassword);
          console.log('');
          console.log('You can use this hash to manually insert users into the database.');
          process.exit(0);
          break;
          
        case '\u0003': // Ctrl+C
          console.log('\nCancelled.');
          process.exit(1);
          break;
          
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
          
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { hashPassword };
