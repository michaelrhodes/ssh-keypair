var fs = require('fs')
var path = require('path')
var test = require('tape')
var series = require('run-series')
var keypair = require('../')
var ssh = path.join(__dirname, '.ssh')

var somehost = {
  private: fs.readFileSync(path.join(ssh, 'somehost'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'somehost.pub'), 'utf8')
}

var subdomain = {
  private: fs.readFileSync(path.join(ssh, 'subdomain'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'subdomain.pub'), 'utf8')
}

var id_rsa = {
  private: fs.readFileSync(path.join(ssh, 'id_rsa'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'id_rsa.pub'), 'utf8')
}

test('it finds keypairs for hosts', function (assert) {
  assert.plan(1)
  keypair('somehost.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, somehost)
  })
})

test('it finds keypairs for hosts with wildcards', function (assert) {
  assert.plan(2)
  keypair('sub.domain.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, subdomain)
  })
  keypair('another.sub.domain.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, id_rsa)
  })
})
