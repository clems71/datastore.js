# datastore.js

This project is a basic yet fully functional embedded data storage library.

It features:
- automatic persistence to disk, in JSON : *don't worry if your program crashes*
- a notification system : *get notified if something changes in the datastore*
- fast lookups, done in memory : *decent performances for small to medium sized stores*
- a fully synchronous api
- fully written in modern JavaScript : *no dependency on XXX library*

It acts more like a key-value store than a full-fledged database, as indexation is made on only one field : `id`, and search is limited to this field.

This store is **optimized for read operations**. Write operations are not extremely fast as they imply a full store rewrite to disk for the moment. *This may change in the near future.*

**Note**: we refer to values stored into the store as `documents`, like in MongoDB.

## Basic example

```js
var DataStore = require('datastore.js')

// will save to ./datastore/todo.json, can be changed through extra
// opts usage
var kvStore = new DataStore('todo')

// It supports notifications
kvStore.on('updated', () => {
  console.log('store changed!')
})

// id is the `key` (as in key-value) and it can be not specified :
// we'll generate a crypto secure one for you!
var myFirstTodo = kvStore.upsert({
  id: 123,
  what: 'learn how to use datastore.js'
})

// auto-timestamps generation
console.log(myFirstTodo.meta.created)
console.log(myFirstTodo.meta.updated)

// look-up by id (the `key`)
var myFirstTodo2 = kvStore.findOne(123)

// return all documents in the store
var allTodos = kvStore.find()

// non-existing document, unknownTodo === undefined
var unknownTodo = kvStore.findOne('3233')
```

## API

`DataStore(name [, opts])` : create a new instance of DataStore.

- `name` is the datastore name, it'll be used to infer the filename for disk persistence.
- `opts` is an optional setting object which supports the following fields:
  - `path` : set the directory where to store data files
  - `filename` : you can override the filename for this store with this setting

`findOne(id)` : return a document, searched by `id`. If not found, returns `undefined`.

`find()` : find all elements, return all documents in store.

`count()` : return the number of documents in this store.

`clear()` : erase **all** the content of the store.

`delete(id)` : removes a document from the store. Return `true` on success, `false` if the document is not found.

`upsert(doc)` : insert or update a document in store.

- If `id` is **not provided** in `doc`, a crypto secure id will be generated.
- If `id` is provided and **exists** in store, it will perform an update operation. It's an update operation that does not erase fields, ie, it merges new fields with old ones, and overrides existing. It's an *additive* update.
- If `id` is provided and **does not** exist in store, then it will use your user provided id and store your document.

In each case, it returns the inserted document, with `id` filled properly, and with added meta data.

## To be documented

- meta....
- event emitter


## Future plans (in no particular order!)

- more possible policies for save to disk
- indexation on multiple fields
- more search possibilities
- ...
