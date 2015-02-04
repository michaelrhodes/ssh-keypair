var fs = require('fs')
var path = require('path')
var test = require('tape')
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

var id_dsa = {
  private: fs.readFileSync(path.join(ssh, 'id_dsa'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'id_dsa.pub'), 'utf8')
}

var bike = {
  private: fs.readFileSync(path.join(ssh, 'bike'), 'utf8'),
  public: fs.readFileSync(path.join(ssh, 'bike.pub'), 'utf8')
}

test('it finds keypairs for hosts', function (assert) {
  assert.plan(1)
  keypair('somehost.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, somehost)
  })
})

test('it finds keypairs for hosts with wildcards', function (assert) {
  assert.plan(5)
  keypair('sub.domain.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, subdomain)
  })
  keypair('another.domain.com', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, id_rsa)
  })
  keypair('explicit.xxx', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, id_rsa)
  })
  keypair('any.bike', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, bike)
  })
  keypair('default', { dir: ssh }, function (err, key) {
    assert.deepEqual(key, id_dsa)
  })
})
