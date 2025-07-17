import express from 'express';
import transcribeRouter from './routes/transcribe';

const app = express();
app.use(express.json());

app.use(transcribeRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
