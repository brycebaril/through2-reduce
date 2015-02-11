var test = require("tape").test

var reduce = require("../")
var spigot = require("stream-spigot")
var concat = require("terminus").concat
var isnumber = require("isnumber")

test("ctor", function (t) {
  t.plan(2)

  var Sum = reduce.ctor(function (prev, curr) {
    return prev + curr
  })

  function combine(result) {
    t.equals(result.length, 1, "Only one record passed")
    t.equals(result[0], 40, "Summed")
  }

  spigot({objectMode: true}, [2, 4, 8, 2, 6, 8, 10])
    .pipe(new Sum({objectMode: true}))
    .pipe(concat({objectMode: true},combine))
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

  spigot({objectMode: true}, [2, 4, 8, 2, 6, 8, 10])
    .pipe(new Sum({objectMode: true}))
    .pipe(concat({objectMode: true},combine))
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

  spigot({objectMode: true}, [2, 4, 8, 2, 6, 8, 10])
    .pipe(new Sum())
    .pipe(concat({objectMode: true},combine))
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

  spigot({objectMode: true}, [2, 4, 8, 2, 6, 8, 10, 2])
    .pipe(mean)
    .pipe(concat({objectMode: true},combine))
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

  spigot({objectMode: true}, [
    {time: 1, widgets: 2},
    {time: 2, widgets: 4},
    {time: 3, widgets: 8},
    {time: 4, widgets: 2},
    {time: 5, widgets: 6},
    {time: 6, widgets: 8},
    {time: 7, widgets: 10},
    {time: 8, widgets: 2},
    ])
    .pipe(mean)
    .pipe(concat({objectMode: true},combine))
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
    .pipe(concat({objectMode: true},combine))
})

test("error", function (t) {
  t.plan(2)

  var Sum = reduce.ctor(function (prev, curr) {
    if (!isnumber(curr)) {
      this.emit("error", new Error("Values must be numeric"))
    }
    return prev + parseFloat(curr)
  })

  function combine(result) {
    t.notOk(1, "Should not complete pipeline when error")
  }

  var summer = new Sum({objectMode: true})
  summer.on("error", function (err) {
    t.ok(err)
    t.equals(err.message, "Values must be numeric")
  })

  spigot({objectMode: true}, [2, 4, 8, 2, "cat", 8, 10])
    .pipe(summer)
    .pipe(concat({objectMode: true},combine))
})

test("throw", function (t) {
  t.plan(2)

  var Sum = reduce.ctor(function (prev, curr) {
    if (!isnumber(curr)) {
      throw new Error("Values must be numeric")
    }
    return prev + parseFloat(curr)
  })

  function combine(result) {
    t.notOk(1, "Should not complete pipeline when error")
  }

  var summer = new Sum({objectMode: true})
  summer.on("error", function (err) {
    t.ok(err)
    t.equals(err.message, "Values must be numeric")
  })

  spigot({objectMode: true}, [2, 4, 8, 2, "cat", 8, 10])
    .pipe(summer)
    .pipe(concat({objectMode: true},combine))
})

test("noCatch", function (t) {
  // Can't think of a way to test this. An error thrown from a stream seems uncatchable. To run this
  // test please uncomment the two following comments, in the definitions of Sum and combine. If you
  // see an uncaught exception in the output, everything works as it should.
  t.end()

  var Sum = reduce.ctor(function (prev, curr) {
    // if (!isnumber(curr)) throw new Error("Values must be numeric")
    return prev + parseFloat(curr)
  })

  function combine(result) {
    // t.fail("Should not complete pipeline when error")
  }

  var summer = new Sum({objectMode: true, noCatch: true})
  summer.on("error", function (err) {
    t.fail("Should not emit an error event")
  })

  spigot({objectMode: true}, [2, 4, 8, 2, "cat", 8, 10])
    .pipe(summer)
    .pipe(concat({objectMode: true},combine))
})
