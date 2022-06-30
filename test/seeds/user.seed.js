const _ = require('lodash');
const faker = require('faker');

const { User } = require('../models');

async function createUser({ number }) {
  const users = await User.insertMany(
    _.range(0, number)
      .map(() => ({
        email: faker.internet.email(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        photo: faker.datatype.string(),
        height: faker.datatype.number(),
        weight: faker.datatype.number(),
        dateOfBirth: faker.date.past(),
        activity: faker.datatype.number(),
      })),
  );
  return users;
}

module.exports = {
  createUser,
};
