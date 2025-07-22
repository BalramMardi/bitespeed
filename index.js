import express from "express";
import contactRoutes from "./routes/contact.routes.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use("/", contactRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
