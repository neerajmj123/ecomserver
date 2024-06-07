const mongoose = require('mongoose')
const users = new mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
        unique:true,
    },
    role:String,
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})
module.exports=mongoose.model("users",users);