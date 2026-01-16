import express from 'express';
import {config} from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './database/dbConnection.js';
import { errorMiddleware } from './middleware/error.js';
import userRoutes from './routes/userRoutes.js';
import { removeUnverifiedAccounts } from './automation/removeUnverifiedAccounts.js';

export const app = express();

config({path :"./config.env"});

app.use(cors({
    origin : [process.env.FRONTEND_URL],
    methods : ["GET","POST","PUT","DELETE"],
    credentials : true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/v1/user',userRoutes);

removeUnverifiedAccounts();

connectDB();





app.use(errorMiddleware);