# Airian's Cafe - MERN Cafe Ordering System for Campus

A full-stack MERN campus ordering system for standard cafe pre-orders and high-velocity recess batch ordering.

## Stack

- React + Vite + Tailwind CSS
- Redux Toolkit for cart and active wave state
- Node.js + Express
- MongoDB Atlas through Mongoose
- UltraMsg WhatsApp notifications
- Nodemailer email OTP delivery

## Setup

1. Create `server/.env` from `server/.env.example`.
2. Add your MongoDB Atlas connection string as `MONGO_URI`.
3. Add SMTP credentials for email OTPs.
4. Add UltraMsg credentials for WhatsApp account and order messages.
5. Optional: create `client/.env` from `client/.env.example` if your API URL is not `http://localhost:5000/api`.

## Run

```bash
npm install
npm run install:all
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Default seeded admin:

- Email: `admin@airianscafe.edu`
- Password: `Admin@12345`

Change this in `server/.env` before production use.
