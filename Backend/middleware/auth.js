import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

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

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, address: true, phoneNum: true, email: true, role: true, responderUnit: true, emailVerifiedAt: true, blockedAt: true },
        });

        if (!user || !user.emailVerifiedAt) {
            return res.status(401).json({message: "Not authorized"});
        }
        if (user.blockedAt) {
            return res.status(403).json({ message: 'This account has been blocked. Contact the administrator.' });
        }

        req.user = {
            id: user.id,
            name: user.name,
            address: user.address,
            phone_num: user.phoneNum,
            email: user.email,
            role: user.role,
            responder_unit: user.responderUnit,
        };
        next();
    }catch (error) {
        res.status(401).json({message: "Not authorized"});
    }
}

export const allowRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
};
