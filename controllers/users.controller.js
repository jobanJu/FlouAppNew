module.exports = (req, res) => {
  res.writeHead(501, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Users module not implemented yet" }));
  return true;
};
