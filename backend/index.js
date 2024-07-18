require('dotenv').config();
const express = require('express');
const connectDB = require('./config/dbconnection');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

connectDB();

app.use(express.json());
app.use('/api', transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
