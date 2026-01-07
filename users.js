const users = [];

function createUser(data) {
  if (!data.gender) {
    throw new Error("Champ 'gender' requis");
  }
  if (!data.orientation) {
    throw new Error("Champ 'orientation' requis");
  }

  const user = {
    id: Date.now().toString(),
    gender: data.gender,
    orientation: data.orientation,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return user;
}

function getUsers() {
  return users;
}

function getUserById(id) {
  return users.find(u => u.id === id);
}

module.exports = {
  createUser,
  getUsers,
  getUserById
};


