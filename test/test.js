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
})

describe('#clear', function () {
  it('return the correct number of items', function () {
    this.db.clear()
    this.db.count().should.be.equal(0)
  })
})


describe('#find', function () {
  it('return the correct number of items', function () {
    const x = this.db.find()
    x.length.should.be.equal(2)
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
