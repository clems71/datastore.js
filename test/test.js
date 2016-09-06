/* global beforeEach describe it*/

'use strict'

const DataStore = require('..')

beforeEach(function () {
  this.db = new DataStore('test-data')
  this.db.clear()
  this.db.upsert({
    id: 1,
    text: 'text 1',
    prio: 3
  })
  this.db.upsert({
    id: 2,
    text: 'text 2',
    prio: 9
  })
  this.db.metaSet({
    version: 23
  })
})

describe('#meta', function () {
  it('return the whole metadata object if no key passed', function () {
    const meta = this.db.meta()
    meta.version.should.be.equal(23)
  })

  it('return the correct metadata property if key is passed', function () {
    const version = this.db.meta('version')
    version.should.be.equal(23)
  })
})

describe('#metaSet', function () {
  it('add a new property', function () {
    this.db.metaSet({ ops: 678 })
    this.db.meta('ops').should.be.equal(678)
  })

  it('not alter existing properties', function () {
    this.db.metaSet({ ops: 678 })
    this.db.meta('version').should.be.equal(23)
  })

  it('update existing properties', function () {
    this.db.metaSet({ version: 12 })
    this.db.meta('version').should.be.equal(12)
  })
})

describe('#clear', function () {
  it('return the correct number of items', function () {
    this.db.clear()
    this.db.count().should.be.equal(0)
  })

  it('clean metadata', function () {
    this.db.clear()
    this.db.meta().should.be.empty()
  })
})


describe('#find', function () {
  it('return the correct number of items', function () {
    const x = this.db.find()
    x.length.should.be.equal(2)
  })

  it('return the correct number of items if filter is {}', function () {
    const x = this.db.find({})
    x.length.should.be.equal(2)
  })

  it('return the proper items if filter is used', function () {
    const x = this.db.find({ prio: { $gt: 3 } })
    x.length.should.be.equal(1)
    x[0].id.should.be.equal(2)
  })

  it('return immutable values when filter is used', function () {
    const x = this.db.find({ prio: { $gt: 3 } })
    x.forEach(i => Object.isFrozen(i).should.be.ok())
  })

  it('return immutable values', function () {
    const x = this.db.find()
    x.forEach(i => Object.isFrozen(i).should.be.ok())
  })
})


describe('#upsert', function () {
  it('insert a new item if id not set', function () {
    const x = this.db.upsert({
      text: 'another one!'
    })

    x.id.should.be.a.String()
    x.text.should.be.equal('another one!')
    this.db.count().should.be.equal(3)
  })

  it('returned item is always the same', function () {
    const x = this.db.upsert({
      text: 'another one!'
    })
    const x2 = this.db.findOne(x.id);
    (x === x2).should.be.ok()
  })

  it('update an existing item if id is set to existing id', function () {
    const x = this.db.upsert({
      id: 2,
      text: 'another one!'
    })

    x.text.should.be.equal('another one!')
    this.db.count().should.be.equal(2)
  })

  it('insert a new item if id is set to a non-existing id', function () {
    const x = this.db.upsert({
      id: 78,
      text: 'new one!'
    })

    x.id.should.be.equal(78)
    x.text.should.be.equal('new one!')
    this.db.count().should.be.equal(3)
  })
})


describe('#findOne', function () {
  it('return the proper item', function () {
    const x = this.db.findOne(1)
    x.id.should.be.equal(1)
    x.text.should.be.equal('text 1')
    x.prio.should.be.equal(3)
  })

  it('return undefined value if not found', function () {
    const x = this.db.findOne('not existing id'); // <- semicolon is important!
    (x === undefined).should.be.ok()
  })

  it('return an immutable value', function () {
    const x = this.db.findOne(2)
    Object.isFrozen(x).should.be.ok()
  })
})


describe('#delete', function () {
  it('return false if doc does not exist', function () {
    this.db.delete(3).should.not.be.ok()
  })

  it('return true if doc exists', function () {
    this.db.delete(2).should.be.ok()
  })

  it('delete the item properly', function () {
    this.db.delete(2)
    this.db.count().should.be.equal(1)
  })
})
