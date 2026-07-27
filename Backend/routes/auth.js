// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 60 * 60 * 1000, // 1 day
};

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn: '30d'

    });
}    

// register
router.post("/register", async (req, res) => {
    const {name, address,phone_num, email, role,password} = req.body;

    if (!name || !address || !phone_num || !email || !role || !password) {
        return res.status(400).json({message: "Please fill in all fields"});
    }

    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userExists.rows.length > 0) {
        return res.status(400).json({message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
        "INSERT INTO users (name, address, phone_num, email, role, password, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, address, phone_num, email, role, created_at",
        [name, address, phone_num, email, role, hashedPassword, new Date()]
    );

    const token = generateToken(newUser.rows[0].id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({user: newUser.rows[0], token});

})


//login
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: "Please fill in all fields"});
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({message: "Invalid credentials"});
    }
    
    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);
    
    if (!isMatch) {
        return res.status(400).json({message: "Invalid credentials"});
    }

    const token = generateToken(userData.id);
    res.cookie("token", token, cookieOptions);

    res.json({user:{
        id: userData.id,
        name: userData.name,
        address: userData.address,
        phone_num: userData.phone_num,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at
    }, token});
})  

//me
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

//logout
router.post('/logout', (req, res) => {
    res.cookie('token', '', {...cookieOptions, maxAge: 0});
    res.json({message: 'Logged out successfully'});

})

export default router;