const {
  createMatch,
  getMatches,
  getMatchById
} = require("../models/matches.model");

function listMatches() {
  return getMatches();
}

function findMatch(id) {
  return getMatchById(id);
}

function addMatch(payload) {
  return createMatch(payload || {});
}

module.exports = {
  listMatches,
  findMatch,
  addMatch
};
