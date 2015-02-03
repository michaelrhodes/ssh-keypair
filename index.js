var fs = require('fs')
var path = require('path')
var glob = require('glob')
var through = require('through2')
var filter = require('through2-filter')
var splice = require('stream-splicer')
var parallel = require('run-parallel')
var untilde = require('untildify')
var wildcard = require('wildcard')
var home = require('user-home')
var parse = require('sshconf/parse')

function keypair (host, opts, cb) {
  if (typeof host == 'function') {
    cb = host
    opts = {}
    host = '*'
  }

  if (typeof opts == 'function') {
    cb = opts
    opts = {}
  }

  var ssh = opts.dir || path.join(home, '.ssh')
  var config = path.join(ssh, 'config')

  var match = null
  var stream = splice([
    fs.createReadStream(config),
    parse(),
    filter.obj(valid),
    through.obj(write, end)
  ])

  stream.on('error', cb)

  function valid (block) {
    return !!block.IdentityFile
  }

  function write (block, enc, next) {
    if (match && match.Host && !/\*/.test(match.Host)) {
      return next()
    }

    if (block.Host === host) {
      match = block
      return next()
    }

    if (wildcard(block.Host, host)) {
      var noHost = !match || !match.Host
      var closerHost = (
        match && match.Host &&
        block.Host.length > match.Host.length
      )
      if (noHost || closerHost) {
        match = block
        return next()
      }
    }

    if (!match && !block.Host) {
      match = block
    }

    next()
  }

  function end () {
    if (!match) return cb(null, {})
    var identity = untilde(match.IdentityFile)
    handle(path.resolve(ssh, identity))
  }

  function handle (identity) {
    var pattern = identity + '*(.pub|.pem)'

    glob(pattern, function (err, files) {
      if (err) return cb(err)

      parallel(files.map(read), function (err, keys) {
        err ? cb(err) :
        cb(null, {
          private: keys[0],
          public: keys[1]
        })
      })
    })
  }
}

function read (file) {
  return function (cb) {
    fs.readFile(file, 'utf8', function (err, data) {
      cb(null, data)
    })
  }
}

module.exports = keypair
