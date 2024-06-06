//you can do it using require , but it break your consistency of code, some are using import but why some will use require.
// require('dotenv').config({path : './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Application is unable to connect with database", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.process}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connectin FAILED !!", error);
  });

//you can write database connection here in index.js also.
//we've used try-catch and async-await , which is important.
/*

import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("Application is unable to connect with database", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("index :: databaseConnection : Error", error);
    throw error;
  }
})();

*/
