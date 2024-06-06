//ALWAYS USE TRY-CATCH AND ASYNC-AWAIT DURING CREATING DB CONNECTION 

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    //created a variable which holds our db connection
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );

    //To make sure wether you're connected with correct host.
    console.log(`Mongodb connected !! DB HOST : 
    ${connectionInstance.connection.host}`);

    //please check the value of connectionInstance in console , you will get to know something.
  } catch (error) {
    console.log("Mongodb connection FAILED", error);
    process.exit(1);
  }
};

export default connectDB
