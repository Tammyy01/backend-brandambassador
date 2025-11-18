import type { Request, Response } from 'express';
import Groq from 'groq-sdk';

export const groqChatCompletion = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY' });
    }

    const prompt: string = (req.body?.prompt ?? '').toString();
    const instruction = 'extract fields, first name, last name, email, companyName, address from the data';
    const finalPrompt = `${prompt}\n\n${instruction}`.trim();
    const stream: boolean = Boolean(req.body?.stream);

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const client = new Groq({ apiKey });

    const request: any = {
      model: 'groq/compound-mini',
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream,
      stop: null,
      compound_custom: { tools: { enabled_tools: ['web_search', 'code_interpreter', 'visit_website'] } },
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const s = await client.chat.completions.create(request);
      for await (const chunk of s as any) {
        const text = chunk?.choices?.[0]?.delta?.content ?? '';
        if (text) res.write(text);
      }
      return res.end();
    }

    const completion = await client.chat.completions.create({ ...request, stream: false });
    const text = completion?.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ success: true, text, completion });
  } catch (error: any) {
    console.error('Groq chat error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Unknown error' });
  }
};