import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const mongoConnect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `\nmongoDb connection established successfully ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("mongo db connection error", error);
    process.exit(1);
  }
};

export default mongoConnect;
