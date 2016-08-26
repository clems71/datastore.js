'use strict'

let _ = require('lodash')
let crypto = require('crypto')
let EventEmitter = require('events')
let fs = require('fs')
let mkdirp = require('mkdirp')
let pjoin = require('path').join

class DataStore extends EventEmitter {
  constructor (name, opts) {
    super()

    // !!! clone is absolutely necessary, as the user might use the same opts twice
    opts = _.defaults(_.cloneDeep(opts), {
      path: __dirname + '/datastore',
      filename: _.kebabCase(name) + '.json'
    })

    this._name = name
    this._dirname = opts.path
    this._filename = opts.filename
    this._fullpath = pjoin(opts.path, opts.filename)
    this._fullpathTmp = pjoin(opts.path, '~' + opts.filename)
    this._store = {}
    this._load()

    // defered so that all subsequent sync code that registered on 'updated'
    // event will be notified of first update
    _.defer(() => this.emit('updated'))
  }

  _load () {
    try {
      const json = fs.readFileSync(this._fullpath, 'utf8')

      // we freeze objects so that no one can write changes behind our back!
      // if they want to, they have to clone
      this._store = _.mapValues(JSON.parse(json), Object.freeze)
    } catch (e) {}
  }

  _dump () {
    mkdirp.sync(this._dirname)
    fs.writeFileSync(this._fullpathTmp, JSON.stringify(this._store, null, 2))
    fs.renameSync(this._fullpathTmp, this._fullpath)
  }

  // Return all documents
  find () {
    return _.values(this._store)
  }

  count () {
    return _.size(this._store)
  }

  // Return one document of given id or undefined if not found
  findOne (id) {
    return this._store[id]
  }

  clear () {
    this._store = {}
    _.defer(this._dump.bind(this))
    this.emit('updated')
    return true
  }

  // Delete one document given its id
  delete (id) {
    if (this._store[id]) {
      delete this._store[id]
      _.defer(this._dump.bind(this))
      this.emit('updated')
      return true
    }
  }

  genId () {
    return crypto.randomBytes(16).toString('hex')
  }

  // Insert or update one document - if no id set, will create a new doc with a new id
  upsert (doc) {
    // TODO: check auto-id doesn't exist in collection

    const prevDoc = this._store[doc.id]
    const now = _.now()

    // Auto attribute an ID if not set
    doc.id = doc.id || this.genId()

    // Set extra meta data (timestamps)
    doc.meta = {
      created: _.get(prevDoc, 'meta.created', now),
      updated: now,
      version: _.get(prevDoc, 'meta.version', -1) + 1
    }

    const newDoc = Object.freeze(_.assign({}, prevDoc, doc))

    this._store[doc.id] = newDoc
    _.defer(this._dump.bind(this))
    this.emit('updated')
    return newDoc
  }
}

module.exports = DataStore
