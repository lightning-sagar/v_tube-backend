import dotenv from "dotenv";

import mongoose from "mongoose";
import { DB_name } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})


/*
import express from "express";
const app = express();
( async () => {
    try {
        await mongoose.connect(`${process.env.ATLAS_DB}`/{DB_name});
        console.log('MongoDB connected');
        app.listen(3000, () => console.log('Server running on port 3000'));
    } catch (error) {
        console.log(error.message);
    }
})()
*/