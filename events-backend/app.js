import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import the cors middleware
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';


import eventRegistrationRoutes from './routes/eventRegistrationRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();


// Enable CORS with specific options (optional)
app.use(cors({
    origin: '*',
    credentials: true,
}));

app.use(bodyParser.json());
// Serve static files from the "uploads" directory
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/register-events', eventRegistrationRoutes);
app.use('/api/withdraw', withdrawalRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
