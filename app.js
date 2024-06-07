const dotenv = require('dotenv')
dotenv.config();

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

const connect = require('./db/config');
const userRoutes = require('./routes/userroutes');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());
app.use(cors());

app.use(userRoutes);
app.use('/uploads',express.static(path.join(__dirname,'uploads')));
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })
connect();
app.listen(process.env.PORT,()=>{
    console.log(`server running at http://localhost:${process.env.PORT}`)
})