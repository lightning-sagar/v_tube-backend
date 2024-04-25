import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: `http://localhost:${process.env.CORS_ORIGIN}`,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));//url se aayega
app.use(cookieParser());
app.use(express.static('public'));//to store img and other files


//routes impor

import userRouter from './routers/user.routers.js';

//route declare
app.use("/api/v1/users", userRouter)

export {app};