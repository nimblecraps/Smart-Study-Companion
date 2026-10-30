import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running healthily!' });
});

// PDF Flashcard Generation Endpoint
app.post('/api/generate-flashcards', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    // 1. Extract text from uploaded PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text.slice(0, 4000); // Send first 4k characters for testing

    // 2. Request AI to generate JSON flashcards
    const prompt = `Extract key concepts and return a JSON array with objects containing 'question' and 'answer' keys based on this text:\n\n${extractedText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content);
    res.json(parsedData);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Failed to process document and generate flashcards.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`);
});