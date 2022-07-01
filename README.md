# GraphQL Mongoose Pagination

- [GraphQL Mongoose Pagination](#graphql-mongoose-pagination)
  - [Why This Plugin](#why-this-plugin)
  - [Install](#install)
  - [Usage](#usage)
    - [Sample Usage](#sample-usage)
      - [Model User](#model-user)
      - [Example 1 : Get list User, don't used cursor](#example-1--get-list-user-dont-used-cursor)
      - [Example 2: Get list User, used cursor](#example-2-get-list-user-used-cursor)
    - [Parameters in Pagination](#parameters-in-pagination)
    - [Return value](#return-value)
      - [Example](#example)

## Why This Plugin

There are many libraries can do the same function. However, still not support filter containing condition `$or` and multiple `cursor`

## Install

```sh
npm install graphql-mongoose-pagination
```

## Usage

Please see the following examples support with `Graphql` and `Simple`

### Sample Usage

Given the following query

#### Model User

```js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  photo: String,
  dateOfBirth: { type: Date, index: -1 },
  activity: { type: Number, index: -1 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('user', UserSchema);

```

> Because `sortFields` only support the schema type `ID,Number,Date` therefore only one of the following 3 fields `_id`,`dateOfBirth`,`activity`

#### Example 1 : Get list User, don't used cursor

```js
const Pagination = require('graphql-mongoose-pagination')


const paginated = new Pagination(
  User,
   {
      criteria,
      sort: { field: "asc", order: "_id"},
      pagination: { limit:10 , skip: 100},
      select,
    },
  );

```

#### Example 2: Get list User, used cursor

```js
const Pagination = require('graphql-mongoose-pagination')

const {cursor } = input

const paginated = new Pagination(
  User,
   {
      criteria,
      sort: { field: "asc", order: "_id"},
      pagination: { limit:10, cursor },
      select,
    },
  );

```

### Parameters in Pagination

- `[criteria]` {Object} - The filter of `model`
- `[pagination]` {Object}
  - `[limit]` { Number}: Limit that was used
  - `[cursor]` { String}: The cursor used compare with record
  - `[skip]` { Number}: The number skip record
- `[sort]` {Object}:
  - `[order]`[Object] : Sort order only support `asc|desc`. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-sort)
  - `[fields]`[String] : Sort field with typeof `ID,Number,Date`
- `[select]` {String || Array} : Fields to return (by default returns all fields). [Documentation](http://mongoosejs.com/docs/api.html#query_Query-select)

### Return value

- `[getDocs]` {Promise} - Array of documents
- `[getCursor]` {String} - The cursor to used query next page

#### Example

```js
const Pagination = require('graphql-mongoose-pagination')

const {cursor } = input

const paginated = new Pagination(
  User,
   {
      criteria,
      sort: { field: "asc", order: "_id"},
      pagination: { limit:10, cursor },
      select,
    },
  );

  // get list data
await paginated.getDocs();

//  Get cursor
paginated.getCursor()

```
