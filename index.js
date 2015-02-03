var fs = require('fs')
var path = require('path')
var glob = require('glob')
var through = require('through2')
var filter = require('through2-filter')
var splice = require('stream-splicer')
var parallel = require('run-parallel')
var untilde = require('untildify')
var home = require('user-home')
var parse = require('sshconf/parse')

function keypair (host, opts, cb) {
  if (typeof host == 'function') {
    cb = host
    opts = { fallback: true }
    host = '*'
  }

  if (typeof opts == 'function') {
    cb = opts
    opts = {}
  }

  var ssh = opts.ssh || path.join(home, '.ssh')
  var config = path.join(ssh, 'config')

  var match = null
  var stream = splice([
    fs.createReadStream(config),
    parse()
  ])

  if (host) {
    stream.push(filter.obj(hosts))
  }

  stream.push(through.obj(write, end))
  stream.on('error', cb)

  function hosts (block) {
    var isValidHostBlock = (
      block.Host === host ||
      block.Host === '*'
    )
    var isGlobalIdentityFile = (
      !block.Host &&
      !!block.IdentityFile
    )
    return (
      isValidHostBlock ||
      isGlobalIdentityFile
    )
  }

  function write (block, enc, next) {
    if (!match || block.Host === host)
      match = block
    next()
  }

  function end () {
    if (!match && !opts.fallback) {
      cb(null, {})
      return
    }

    if (match) {
      handle(path.resolve(ssh, untilde(match.IdentityFile)))
      return
    }

    var id_rsa = path.join(ssh, 'id_rsa')
    var id_dsa = path.join(ssh, 'id_dsa')

    parallel([
      exists(id_rsa),
      exists(id_dsa)
    ],
    function (err, results) {
      results = [].concat(results)
      results[0] ? handle(id_rsa) :
      results[1] ? handle(id_dsa) :
      cb(null, {})
    })
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

function exists (file) {
  return function (cb) {
    fs.exists(file, function(exists) {
      cb(null, exists)
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
