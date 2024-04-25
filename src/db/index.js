import mongoose from "mongoose";
import { DB_name } from "../constants.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.ATLAS_DB, {
            dbName: DB_name,
        });
        console.log(`MongoDB connected: ${connection.connection.host}`);

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB