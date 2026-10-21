// frontend/src/api/axios.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://mymalasiquiweb.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Mahalaga ito dahil gumagamit ng cookies/token ang Express backend mo
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;