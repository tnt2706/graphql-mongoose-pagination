const assert = require('assert');

const { User } = require('./models');

const { Pagination } = require('../src');
const { createUser } = require('./seeds');
const { connectDatabase, disconnectDatabase } = require('./helpers');

describe('Testing Pagination', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeAll(async () => {
    await connectDatabase();
    await createUser({ number: 100 });
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
    console.log(users);

    const expected = {
      id: 1,
      user: 1,
    };
  });
});
