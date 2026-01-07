const {
  createUser,
  getUsers,
  getUserById
} = require("../models/users.model");

function listUsers() {
  return getUsers();
}

function findUser(id) {
  return getUserById(id);
}

function addUser(payload) {
  return createUser(payload || {});
}

module.exports = {
  listUsers,
  findUser,
  addUser
};
