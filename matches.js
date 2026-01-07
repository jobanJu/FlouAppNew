const matches = [];

function createMatch(data) {
  const match = {
    id: Date.now().toString(),
    name: data.name || "Match",
    createdAt: new Date().toISOString()
  };

  matches.push(match);
  return match;
}

function getMatches() {
  return matches;
}

function getMatchById(id) {
  return matches.find(m => m.id === id);
}

module.exports = {
  createMatch,
  getMatches,
  getMatchById
};


