var fs = require('fs')
var path = require('path')
var test = require('tape')
var series = require('run-series')
var keypair = require('../')
var ssh = path.join(__dirname, '.ssh')

var id_rsa = {
  private: fs.readFileSync(path.join(ssh, 'id_rsa'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'id_rsa.pub'), 'utf8')
}
var id_dsa = {
  private: fs.readFileSync(path.join(ssh, 'id_dsa'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'id_dsa.pub'), 'utf8')
}
var somehost = {
  private: fs.readFileSync(path.join(ssh, 'somehost'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'somehost.pub'), 'utf8')
}

test('it finds keypairs for hosts', function (assert) {
  assert.plan(1)
  keypair('somehost.com', { ssh: ssh }, function (err, key) {
    assert.deepEqual(key, somehost)
  })
})

test('it can fall back to .ssh/(id_rsa|id_dsa)', function (assert) {
  var host = 'unknownhost.org'
  var opts = { ssh: ssh, fallback: true }
  var rsa = {
    path: path.join(ssh, 'id_rsa'),
    moved: path.join(ssh, '_id_rsa')
  }

  series([
    function (next) {
      keypair(host, opts, function (err, key) {
        assert.deepEqual(key, id_rsa, 'provided id_rsa')
        fs.renameSync(rsa.path, rsa.moved)
        process.nextTick(next)
      })
   },
   function (next) {
      keypair(host, opts, function (err, key) {
        assert.deepEqual(key, id_dsa, 'provided id_dsa')
        fs.renameSync(rsa.moved, rsa.path)
        process.nextTick(next)
      })
   }],
   function (err) {
     assert.end() 
   })
})
