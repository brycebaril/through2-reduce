module.exports = make
module.exports.ctor = ctor

var through2 = require("through2")

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
