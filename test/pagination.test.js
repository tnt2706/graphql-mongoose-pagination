const assert = require('assert');

const { User } = require('./models');

const { connectDatabase, disconnectDatabase } = require('./helpers');
const { Pagination } = require('../src');
const { createUser } = require('./seeds');

describe('Testing Pagination', () => {
  let queriesUser = [];
  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeAll(async () => {
    await connectDatabase();
    queriesUser = await createUser({ number: 100 });
  });

  test('test 1', async () => {
    const selectFields = ['email', 'firstName', 'lastName'];
    const criteria = {};

    const paginated = new Pagination(
      User,
      {
        criteria,
        sort: { field: '_id', order: 'desc' },
        pagination: { limit: 10, cursor: null },
        select: selectFields,
      },
    );

    const users = await paginated.getDocs();

    assert.strictEqual(users.length, 10);
  });

  test('test 2', async () => {
    const selectFields = 'email firstName lastName';
    const criteria = {};

    const paginated = new Pagination(
      User,
      {
        criteria,
        sort: { field: 'dateOfBirth', order: 'asc' },
        pagination: { limit: 10, cursor: null },
        select: selectFields,
      },
    );

    const users = await paginated.getDocs();

    assert.strictEqual(users.length, 10);
  });
});
