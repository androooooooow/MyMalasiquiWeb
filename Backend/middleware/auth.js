import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try{
        // 1. Check Authorization header (mobile app sends Bearer tokens)
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // 2. Fall back to cookie (web app uses httpOnly cookies)
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({message: "Not authorized, no token"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await pool.query("SELECT id, name, address, phone_num, email, role FROM users WHERE id = $1", [decoded.id]);

        if(user.rows.length === 0) {
            return res.status(401).json({message: "Not authorized, user not found"});
        }

        req.user = user.rows[0];
        next();
    }catch (error) {
        console.error(error);
        res.status(401).json({message: "Not authorized"});
    }
}