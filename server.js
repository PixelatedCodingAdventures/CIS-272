require("dotenv").config();

const app = require("./app");

const PORT = process.env.WEB_SERVER_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});