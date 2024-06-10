// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';

import connectDB from './db/index.js';

dotenv.config({
    path: './env'
})

connectDB();

// APPROACH 1   
/*import express from 'express';
const app = express();

( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("error not able to listen to db :",error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listening on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.log("ERROR: ", error)
        throw error;
    }
})() // immediate execute karne ke liye
*/