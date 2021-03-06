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

    if (!match && !block.Host) {
      match = block
      return next()
    }

    if (~block.Host.indexOf(host)) {
      match = block
      match.Host = host
      return next()
    }

    var i = 0
    var l = block.Host.length
    var blockHost

    for (; i < l; i++) {
      blockHost = block.Host[i]
      if (wildcard(blockHost, host)) {
        var noHost = !match || !match.Host
        var closerHost = (
          match && match.Host &&
          blockHost.length > match.Host.length
        )
        if (noHost || closerHost) {
          match = block
          match.Host = blockHost
          return next()
        }
      }
    }

    next()
  }

  function end () {
    if (!match) return cb(null, {})
    var identity = untilde(match.IdentityFile)
    handle(path.resolve(ssh, identity))
  }

  function handle (identity) {
    var keys = {}
    var pattern = identity + '@(.pub|.pem)'

    read(identity)(function (err, key) {
      if (err) return cb(err)
      keys.private = key 

      glob(pattern, function (err, files) {
        if (err) return cb(err)

        parallel(files.map(read), function (err, pub) {
          if (err) return cb(err)
          keys.public = pub[0]
          cb(null, keys)
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
