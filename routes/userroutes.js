const express=require('express');
const router=express.Router();
const Usercontroller = require('../contoller/Usercontoller')

router.post('/signup',Usercontroller.signup);
router.post('/signin',Usercontroller.signin);
router.post('/addProduct',Usercontroller.addproduct);
router.get('/getProducts', Usercontroller.getProducts);
router.post('/removeProduct', Usercontroller.removeProduct);
router.get('/newCollection',Usercontroller.newCollection); 
module.exports=router;