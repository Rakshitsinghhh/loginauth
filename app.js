const express = require("express");
const bcrypt = require("bcrypt")
const { UserModel, TodoModel } = require("./db");
const jwt = require("jsonwebtoken");
const JWT_SECRET="s3cret";


const app = express();
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://admin:9E03m4kEjqurgOWS@tester.xjjxqm1.mongodb.net/?appName=tester")

const auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }

    try {
        const response = jwt.verify(token, JWT_SECRET); 
        req.userId = response.userId; 
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

app.post("/signup", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    const hashedpass = await bcrypt.hash(password,5)

    await UserModel.create({
        email: email,
        password: hashedpass,
        name: name
    });
    
    res.json({
        message: "You are signed up",
        hassedpas: hashedpass
    })
});
app.post("/signin", async function(req, res) {
    const email = req.body.email;
    const pass = req.body.password;

    const response = await UserModel.findOne({ email: email });

    if (!response) {
        return res.status(403).json({
            message: "User not found"
        });
    }

    const passmatch = await bcrypt.compare(pass, response.password);

    if (passmatch) {
        const token = jwt.sign({
            userId: response._id.toString()
        }, JWT_SECRET);

        res.json({ token });
    } else {
        res.status(404).json({
            message: "Incorrect credentials"
        });
    }
});



app.post("/todo", auth, async function(req, res) {
    try {
        const response = await TodoModel.find({
            userId: req.userId,
            done: false
        });

        if (response.length > 0) {
            res.json({ todos: response });
        } else {
            res.status(404).json({ message: "No tasks found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching todos", error: err.message });
    }
});

app.post("/todos", auth, async function(req, res) {
    try {
        const title = req.body.title;
        const userId = req.userId;

        await TodoModel.create({
            title: title,
            done: false,
            userId: userId
        });

        res.json({
            message: `Task added to user ${userId}`
        });
    } catch (err) {
        res.status(500).json({ message: "Error adding todos", error: err.message });
    }
});

app.listen(3006,()=>{
    console.log("running...")
});