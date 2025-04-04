const express = require("express");
const app = express();
const orderRoutes = require("./routes/orderRoutes");
const basicAuth = require("express-basic-auth");

app.use(express.json());
app.use(express.json());
app.use(
  basicAuth({
    users: {
      admin: "password123",
    },
    challenge: true,
    unauthorizedResponse: "Unauthorized",
  })
);
app.use("/api", orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
