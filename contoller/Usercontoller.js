const error_function = require('../util/response-handlers').error_function
const success_function = require('../util/response-handlers').success_function
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const users = require('../db/users')
const Product = require('../db/product');
const fs = require('fs');
const path = require('path');


exports.signup = async function (req, res) {
    try {
        const { name, email, password, role } = req.body;
        const userExist = await users.findOne({ email });
        if (userExist) {
            let response = error_function({
                statusCode: 400,
                message: 'User already exists'
            });
            return res.status(response.statusCode).json(response);
        } else {
            const salt = bcrypt.genSaltSync(10);
            const hashed_password = bcrypt.hashSync(password, salt);
            console.log("Hashed password: ", hashed_password);
            
            let cart = {};
            for (let i = 0; i < 300; i++) {
                cart[i] = 0;
            }

            const newUser = await users.create({
                name,
                email,
                role,
                password: hashed_password,
                cartData: cart,
            });

            if (newUser) {
                const data = {
                    user: {
                        id: newUser.id
                    }
                };
                const token = jwt.sign(data, process.env.PRIVATE_KEY, { expiresIn: '1d' });
                console.log("Generated Token: ", token);
                
                let response = success_function({
                    statusCode: 200,
                    message: "User created successfully",
                    data: {
                        token: token,
                        role: newUser.role,
                        email: newUser.email
                    }
                });
                return res.status(response.statusCode).json(response);
            } else {
                let response = error_function({
                    statusCode: 400,
                    message: 'User creation failed'
                });
                return res.status(response.statusCode).json(response);
            }
        }
    } catch (error) {
        console.error("Signup error:", error);
        let response = error_function({
            statusCode: 500,
            message: 'Something went wrong'
        });
        return res.status(response.statusCode).json(response);
    }
};

exports.signin = async function (req, res) {
    try {
        const { email, password } = req.body;

        const user = await users.findOne({ email });

        if (!user) {
            let response = error_function({
                statusCode: 401,
                message: "No user found"
            });
            return res.status(response.statusCode).json(response);
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const data = {
                user: {
                    id: user.id
                }
            };
            const token = jwt.sign(data, process.env.PRIVATE_KEY, { expiresIn: "1d" });

            let response = success_function({
                statusCode: 200,
                message: "Login successful",
                data: {
                    token: token,
                    role: user.role,
                    email: email
                }
            });
            return res.status(response.statusCode).json(response);
        } else {
            let response = error_function({
                statusCode: 401,
                message: "Invalid credentials"
            });
            return res.status(response.statusCode).json(response);
        }
    } catch (error) {
        console.error("Signin error:", error);
        let response = error_function({
            statusCode: 500,
            message: "Internal Server Error"
        });
        return res.status(response.statusCode).json(response);
    }
};

exports.addproduct = async function (req, res) {
    try {

        
        const {name, imageBase64, category, new_price, old_price } = req.body;

        // Validate required fields
        if (!name || !imageBase64 || !category || !new_price || !old_price) {
            let response = error_function({
                statusCode: 400,
                message: 'All fields are required'
            });
            return res.status(response.statusCode).json(response);
        }
        let products = await Product.find({})
        let id;
        if (products.length > 0) {
            let last_product_array = products.slice(-1);
            let last_product = last_product_array[0]
            id = last_product.id + 1;
        } else {
            id = 1;
        }
        // Decode Base64 image and save it to a file
        const Image = imageBase64.split(';base64,').pop();
        const binaryImage = Buffer.from(Image, "base64");
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        const filename = `${Date.now()}.png`;
        const relativePath = `/uploads/${filename}`;

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, binaryImage);

        const newProduct = new Product({
            id:id,
            name,
            image: relativePath, // Store the file path in the database
            category,
            new_price,
            old_price,
        });

        const savedProduct = await newProduct.save();
        if (savedProduct) {
            console.log("Product inserted into database:", savedProduct);
            let response = success_function({
                statusCode: 200,
                message: "Product added successfully"
            });
            return res.status(response.statusCode).json(response);
        } else {
            let response = error_function({
                statusCode: 400,
                message: 'Product addition failed'
            });
            return res.status(response.statusCode).json(response);
        }
    } catch (error) {
        console.error("Add product error:", error);
        let response = error_function({
            statusCode: 500,
            message: 'Internal Server Error'
        });
        return res.status(response.statusCode).json(response);
    }
};
exports.getProducts = async function (req, res) {
    try {
        
        const products = await Product.find({});
        console.log("Products retrieved:", products);

        let response = success_function({
            statusCode: 200,
            message: "Products retrieved successfully",
            data: products
        });
        return res.status(response.statusCode).json(response);
    } catch (error) {
        console.error("Get products error:", error);
        let response = error_function({
            statusCode: 500,
            message: 'Internal Server Error'
        });
        return res.status(response.statusCode).json(response);
    }
};

exports.removeProduct = async function (req, res) {
    try {
        const { id } = req.body;

        const deletedProduct = await Product.findOneAndDelete({ id });

        if (deletedProduct) {
            try {
                const imagePath = path.join(__dirname, '..', deletedProduct.image);
                fs.unlinkSync(imagePath);
            } catch (fsError) {
                console.error("File system error:", fsError);
                let response = error_function({
                    statusCode: 500,
                    message: 'Product removed, but failed to delete image file'
                });
                return res.status(response.statusCode).send(response.message);
            }
            console.log("Product removed successfully:", deletedProduct);

            let response = success_function({
                statusCode: 200,
                message: "Product removed successfully"
            });
            return res.status(response.statusCode).send(response.message);
        } else {
            let response = error_function({
                statusCode: 404,
                message: 'Product not found'
            });
            return res.status(response.statusCode).send(response.message);
        }
    } catch (error) {
        console.error("Remove product error:", error);
        let response = error_function({
            statusCode: 500,
            message: 'Internal Server Error'
        });
        return res.status(response.statusCode).send(response.message);
    }
};

exports.newCollection = async function (req, res) {
    try {
        // Fetch all products
        let products = await Product.find({});

        // Ensure products array is not empty
        if (!products.length) {
            let response = error_function({
                statusCode: 404,
                message: 'No products found'
            });
            return res.status(response.statusCode).send(response.message);
        }

        // Select the last 8 products
        let newCollection = products.slice(-8);
        console.log("New collection fetched:", newCollection);

        // Send the new collection in the response
        let response = success_function({
            statusCode: 200,
            message: "New collection fetched successfully",
            data: newCollection
        });
        return res.status(response.statusCode).send(response);
    } catch (error) {
        console.error("New collection error:", error);
        let response = error_function({
            statusCode: 500,
            message: 'Internal Server Error'
        });
        return res.status(response.statusCode).send(response.message);
    }
};
