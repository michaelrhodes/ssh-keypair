var keypair = require('./')
var host = process.argv[2]
var cb = function (err, pair) {
  console.log(err ? err.message : pair)
}

host ? keypair(host, cb) : keypair(cb)
