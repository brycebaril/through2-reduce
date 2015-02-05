through2-reduce
===============

[![NPM](https://nodei.co/npm/through2-reduce.png)](https://nodei.co/npm/through2-reduce/)

`through2-reduce` is a thin wrapper around [through2](http://npm.im/through2) that works like `Array.prototype.reduce` but for streams.

This is a *much* less common use-case with streams, but it can occasionally be useful to do a Reduce function on a stream.

**EXPERIMENTAL** This is a bit of a bizarre one, so I wouldn't be surprised if there are some dangerous edge cases around flushing and pausing and such. Use at your own risk.

This stream will only ever emit a *single* chunk. For more traditional `stream.Transform` filters or transforms, consider `through2` `through2-filter` or `through2-map`.

Also, if your stream never ends, Reduce will never end.

```js

var reduce = require("through2-reduce")

var sum = reduce({objectMode: true}, function (previous, current) { return previous + current })

// vs. with through2:
function combine (value, encoding, callback) {
  if (this.total == undefined) {
    this.total = value
    return callback()
  }
  this.total += value
}
function flush (callback) {
  this.push(this.value)
  return callback()
}
var sum = through2({objectMode: true}, combine, flush)

// Then use your reduce: (e.g. source is an objectMode stream of numbers)
source.pipe(sum).pipe(sink)

// Works like `Array.prototype.reduce` meaning you can specify a function that
// takes up to three* arguments: fn(previous, current, index) AND you can specify
// an initial value
var mean = reduce({objectMode: true}, function (prev, curr, index) {
  return prev - (prev - curr) / (index + 1)
}, 0)

```

*Differences from `Array.prototype.reduce`:
  * No fourth `array` callback argument. That would require realizing the entire stream, which is generally counter-productive to stream operations.
  * `Array.prototype.reduce` doesn't modify the source Array, which is somewhat nonsensical when applied to streams.

API
----

`reduce([options,] fn [,initial])`

Create a Reduce *instance*

`reduce.ctor([options,] fn [,initial])`

Create a Reduce *class*


Options
-------

  * wantStrings: Automatically call chunk.toString() for the super lazy.
  * all other through2 options

LICENSE
=======

MIT
