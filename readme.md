# datastore.js

This project is a basic yet fully functional embedded data storage library.

It features:
- automatic persistence to disk, in JSON : *don't worry if your program crashes*
- a notification system : *get notified if something changes in the datastore*
- fast 'by key' lookups, done in memory : *decent performances for small to medium sized stores*
- MongoDB like query filters : *convenient and easy to use*
- a fully synchronous api
- fully written in modern JavaScript : *no dependency on XXX library*

It acts more like a key-value store than a full-fledged database, as indexation is made on only one field : `id`. As an extra feature, we provide a MongoDB like search interface, that performs linear scan, so this is not optimized for heavy sets of data.

This store is **optimized for read operations**. Write operations are not extremely fast as they imply a full store rewrite to disk for the moment. *This may change in the near future.*

**Note**: we refer to values stored into the store as `documents`, like in MongoDB.

## Basic example

```js
var DataStore = require('datastore.js')

// will save to ./datastore/todo.json, can be changed through extra
// opts usage
var db = new DataStore()
var col = db.getCollection('todo')

// It supports notifications
col.on('updated', () => {
  console.log('store changed!')
})

// id is the `key` (as in key-value) and it can be not specified :
// we'll generate a crypto secure one for you!
var myFirstTodo = col.upsert({
  id: 123,
  done: false,
  what: 'learn how to use datastore.js'
})

// auto-timestamps generation
console.log(myFirstTodo.meta.created)
console.log(myFirstTodo.meta.updated)

// look-up by id (the `key`) - this is FAST
var myFirstTodo2 = col.findOne(123)

// perform a query against the store - this is not optimized as of now
var allUndoneTodos = col.find({ done: false })

// non-existing document, unknownTodo === undefined
var unknownTodo = col.findOne('3233')
```

## DataStore API

`DataStore([opts])` : create a new instance of DataStore.

- `opts` is an optional setting object which supports the following fields:
  - `path` : set the directory where to store data files

`getCollection(name)` : get or create a DataCollection given the collection name.

## DataCollection API

### Document related

`findOne(id)` : return a document, searched by `id`. If not found, returns `undefined`. This is the path of code optimized, so accessing elements with this function is **fast**.

`find([filter])` : find elements matching filter. If `filter` is omitted, it returns all documents. `filter` is a MongoDB compliant query filter. This is a convenience function, and is **not optimized** as of now. Large data sets (10k docs+) can be problematic. It will very soon.

`count()` : return the number of documents in this store.

`clear()` : erase **all** the content of the store.

`delete(id)` : removes a document from the store. Return `true` on success, `false` if the document is not found.

`upsert(doc)` : insert or update a document in store.

- If `id` is **not provided** in `doc`, a crypto secure id will be generated.
- If `id` is provided and **exists** in store, it will perform an update operation. It's an update operation that does not erase fields, ie, it merges new fields with old ones, and overrides existing. It's an *additive* update.
- If `id` is provided and **does not** exist in store, then it will use your user provided id and store your document.

In each case, it returns the inserted document, with `id` filled properly, and with added meta data.

### Metadata related

Extra data can be saved by the end-user in the datastore. It is usually used to store extra data like a schema version number. It can be used to manage migration of data inside the store. You can store arbitrary objects in the metadata, but keep in mind this data is not intended to be large. It's more like companion data (few kBs).

`meta([key])` : return a previously saved metadata property

`metaSet(obj)` : save new metadata properties, or update existing if field already exists in metadata. It works the way upsert work, ie, it only perform **additive** update. It won't delete any existing properties. *We may* provide an API for this though.


## To be documented

- per-doc meta-data....
- event emitter

## Future plans (in no particular order!)

- more possible policies for save to disk
- auto indexation on all fields, 'a la' elastic search
- ...
