import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';

dotenv.config();

// Allowed origins: web frontend + mobile app
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    process.env.MOBILE_URL,
].filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many authentication requests. Please try again later.' },
}));
app.use("/api/auth", authRoutes); 

app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on 0.0.0.0:${PORT}`);
});
