const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_NAME = process.env.MONGODB_NAME;

async function connect(){
    await mongoose.connect(`${MONGODB_URI}/${MONGODB_NAME}`)
    .then((message)=>{
        console.log("Database connection established");
    })
    .catch((error)=>{
        console.log("database not connected",error);
    })
}
module.exports=connect