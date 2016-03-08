module.exports = make
module.exports.ctor = ctor
module.exports.objCtor = objCtor
module.exports.obj = obj

var through2 = require("through2")
var xtend = require("xtend")

function ctor(options, fn, initial) {
  if (typeof options == "function") {
    initial = fn
    fn = options
    options = {}
  }

  var Reduce = through2.ctor(options, function (chunk, encoding, callback) {
    var err

    if (this.options.wantStrings) chunk = chunk.toString()

    // First chunk with no initial value set
    if (this._reduction === undefined && this._index == 0) {
      this._reduction = chunk
      return callback()
    }

    var args = [this._reduction, chunk, this._index++]
    if (this.options.noCatch) {
      this._reduction = fn.apply(this, args)
    } else {
      try {
        this._reduction = fn.apply(this, args)
      } catch (e) {
        err = e
      }
    }
    return callback(err)
  }, function (callback) {
    this.push(this._reduction)
    callback()
  })
  Reduce.prototype._index = 0
  Reduce.prototype._reduction = initial
  return Reduce
}

function make(options, fn, initial) {
  return ctor(options, fn, initial)()
}

function objCtor(options, fn, initial) {
  if (typeof options == "function") {
    initial = fn
    fn = options
    options = {}
  }
  options = xtend({objectMode: true, highWaterMark: 16}, options)
  return ctor(options, fn, initial)
}

function obj(options, fn, initial) {
  if (typeof options == "function") {
    initial = fn
    fn = options
    options = {}
  }
  options = xtend({objectMode: true, highWaterMark: 16}, options)
  return make(options, fn, initial)
}
