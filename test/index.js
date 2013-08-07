var test = require("tape").test

var reduce = require("../")
var spigot = require("stream-spigot")
var concat = require("concat-stream")

test("ctor", function (t) {
  t.plan(2)

  var Sum = reduce.ctor(function (prev, curr) {
    return prev + curr
  })

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.equals(result[0], 40, "Summed")
  }

  spigot([2, 4, 8, 2, 6, 8, 10], {objectMode: true})
    .pipe(new Sum({objectMode: true}))
    .pipe(concat(combine))
})

test("ctor initial value", function (t) {
  t.plan(2)

  var Sum = reduce.ctor(function (prev, curr) {
    return prev + curr
  }, 5)

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.equals(result[0], 45, "Summed")
  }

  spigot([2, 4, 8, 2, 6, 8, 10], {objectMode: true})
    .pipe(new Sum({objectMode: true}))
    .pipe(concat(combine))
})

test("ctor options initial value", function (t) {
  t.plan(2)

  var Sum = reduce.ctor({objectMode: true}, function (prev, curr) {
    return prev + curr
  }, 5)

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.equals(result[0], 45, "Summed")
  }

  spigot([2, 4, 8, 2, 6, 8, 10], {objectMode: true})
    .pipe(new Sum())
    .pipe(concat(combine))
})

test("use index & initial", function (t) {
  t.plan(10)

  var mean = reduce({objectMode: true, foo: "bar"}, function (prev, curr, index) {
    t.equals(this.options.foo, "bar", "can see options")
    return prev - (prev - curr) / (index + 1)
  }, 0)

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.equals(result[0], 5.25, "Averaged")
  }

  spigot([2, 4, 8, 2, 6, 8, 10, 2], {objectMode: true})
    .pipe(mean)
    .pipe(concat(combine))
})

test("object", function (t) {
  t.plan(2)

  var mean = reduce({objectMode: true}, function (prev, curr, index) {
    var meanWidgets = prev.widgets - (prev.widgets - curr.widgets) / (index + 1)
    prev.widgets = meanWidgets
    prev.time = curr.time
    return prev
  }, {time: 0, widgets: 0})

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.deepEquals(result[0], {time: 8, widgets: 5.25}, "Averaged")
  }

  spigot([
    {time: 1, widgets: 2},
    {time: 2, widgets: 4},
    {time: 3, widgets: 8},
    {time: 4, widgets: 2},
    {time: 5, widgets: 6},
    {time: 6, widgets: 8},
    {time: 7, widgets: 10},
    {time: 8, widgets: 2},
    ], {objectMode: true})
    .pipe(mean)
    .pipe(concat(combine))
})

test("wantStrings", function (t) {
  t.plan(1)

  var Sort = reduce.ctor({wantStrings: true}, function (prev, curr) {
    if (prev < curr) return prev
    return curr
  })

  function combine(result) {
    t.equals(result.toString(), "Bird", "First word alphabetically")
  }

  spigot(["Cat", "Dog", "Bird", "Rabbit", "Elephant"])
    .pipe(new Sort())
    .pipe(concat(combine))
})