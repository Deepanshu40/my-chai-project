import mongoConnect from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

// Event listener for app-level errors (e.g., server errors)
app.on("error", (error) => {
  console.error("App-level error occurred:", error);
});

// connecting mongodb and express app
(async () => {
  try {
    await mongoConnect();

    // Start the Express Server
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`app is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
})();

// mongoConnect()
// .then(() => {
//     try {
//         app.listen(process.env.PORT || 8080, () => {
//             console.log(`app is listening on port ${process.env.PORT}`);
//         })
//     } catch(error) {
//         console.log(`express app connection error`, error)
//     }
// })
