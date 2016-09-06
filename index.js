'use strict'

let _ = require('lodash')
let crypto = require('crypto')
let EventEmitter = require('events')
let fs = require('fs')
let mkdirp = require('mkdirp')
let pjoin = require('path').join
let sift = require('sift')

class DataStore extends EventEmitter {
  // `name` is the datastore name, it'll be used to infer the filename for
  // disk persistence.
  constructor (name, opts) {
    super()

    // !!! clone is absolutely necessary, as the user might use the same opts twice
    opts = _.defaults(_.cloneDeep(opts), {
      path: __dirname + '/datastore',
      filename: _.kebabCase(name) + '.json'
    })

    // helper vars
    this._name = name
    this._dirname = opts.path
    this._filename = opts.filename
    this._fullpath = pjoin(opts.path, opts.filename)
    this._fullpathTmp = pjoin(opts.path, '~' + opts.filename)

    // data containers
    this._store = {}
    this._meta = {}

    // load all data
    this._load()

    const ids = _.keys(this._store)

    // defered so that all subsequent sync code that registered on 'updated'
    // event will be notified of first update
    _.defer(() => this.emit('updated', { op: 'loaded', ids }))
  }

  // Load all store content + metadata from disk to in-memory data-structures
  _load () {
    try {
      const json = JSON.parse(fs.readFileSync(this._fullpath, 'utf8'))
      const fileVersion = json.__version__ || 0

      let storeData = {}
      let metaData = {}

      if (fileVersion === 0) {
        storeData = json
      } else if (fileVersion === 1) {
        storeData = json.storeData
        metaData = json.metaData
      }

      // we freeze objects so that no one can write changes behind our back!
      // if they want to, they have to clone, so they know nothing changes in
      // the store. They have to `upsert` to perform a persistent change.
      this._store = _.mapValues(storeData, Object.freeze)
      this._meta = Object.freeze(metaData)
    } catch (e) {}
  }

  // Write all store content + metadata to disk
  _dump () {
    const jsonData = {
      __version__: 1,
      storeData: this._store,
      metaData: this._meta
    }

    mkdirp.sync(this._dirname)
    fs.writeFileSync(this._fullpathTmp, JSON.stringify(jsonData, null, 2))
    fs.renameSync(this._fullpathTmp, this._fullpath)
  }

  // Return store metadata - contains user related data
  meta (key) {
    return key ? _.get(this._meta, key) : this._meta
  }

  metaSet (val) {
    this._meta = Object.freeze(_.assign({}, this._meta, val))
    _.defer(this._dump.bind(this))
    return this._meta
  }

  // Return all documents
  find (filter) {
    const docs = _.values(this._store)
    if (!filter) return docs
    return sift(filter, docs)
  }

  // Return the number of items in this store
  count () {
    return _.size(this._store)
  }

  // Return one document of given id or undefined if not found
  findOne (id) {
    return this._store[id]
  }

  clear () {
    const ids = _.keys(this._store)
    this._store = {}
    this._meta = {}
    _.defer(this._dump.bind(this))
    this.emit('updated', { op: 'deleted', ids })
    return true
  }

  // Delete one document given its id
  delete (id) {
    if (!this._store[id]) return false

    delete this._store[id]
    _.defer(this._dump.bind(this))
    this.emit('updated', { op: 'deleted', ids: [id] })
    return true
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

    this._store[newDoc.id] = newDoc
    _.defer(this._dump.bind(this))
    const op = prevDoc ? 'updated' : 'created'
    this.emit('updated', { op: op, ids: [newDoc.id] })
    return newDoc
  }
}

module.exports = DataStore
