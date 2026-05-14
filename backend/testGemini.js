import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAgQVJcKmNJX19-WxNYE4nhoUSLOjZafjI' });

ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: 'こんにちは、テストです。',
})
.then(response => console.log('Success:', response.text))
.catch(error => console.error('Error Details:', JSON.stringify(error, null, 2)));
