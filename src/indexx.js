console.clear();
const cluster = require('cluster');
const path = require('path');
const fs = require('fs');
const CFonts = require('cfonts');
const Readline = require('readline');
const yargs = require('yargs/yargs');
const rl = Readline.createInterface(process.stdin, process.stdout);

const {say} = CFonts
say(`BUGGY-BOT V5`, {
    font: 'shade',
    align: 'center',
    gradient: ['#12c2e9', '#c471ed'],
    transitionGradient: true,
    letterSpacing: 3
});
say(`BUGGY V5 Coded By COSMICBUG`, {
	font: 'tiny',
	align: 'center',
	gradient: ['#DCE35B', '#45B649'],
	transitionGradient: true,
    letterSpacing: 2
});

var isRunning = false
/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
  if (isRunning) return
  isRunning = true
  let args = [path.join(__dirname, file), ...process.argv.slice(2)]

  cluster.setupMaster({
    exec: path.join(__dirname, file),
    args: args.slice(1),
  })
  let p = cluster.fork()
  p.on('message', data => {
    console.log('[RECEIVED]', data)
    switch (data) {
        case 'reset':
            p.kill()
            isRunning = false
            start.apply(this, arguments)
        break
        case 'uptime':
            p.send(process.uptime())
        break
    }
  })
  p.on('exit', code => {
    isRunning = false
    console.error('Exited with code:', code)
    if (code === 0) return
    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0])
      start(file)
    })
  })
  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  if (!opts['test'])
    if (!rl.listenerCount()) rl.on('line', line => {
      p.emit('message', line.trim())
    })
}

start('index.js');