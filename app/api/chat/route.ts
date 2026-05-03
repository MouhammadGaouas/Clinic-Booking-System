import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, tool, zodSchema, type UIMessage } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Initialize the OpenRouter API
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Define the system prompt
const systemPrompt = `You are a professional, calm, and helpful medical assistant chatbot for MidCare.
Current date: ${new Date().toISOString().split('T')[0]}

Your role is to:
- Provide clear, general medical information
- Help users find doctors by specialty (use 'search_doctors')
- Check available appointment slots for specific doctors (use 'get_available_slots')
- Guide users to the booking page

Rules:
- DO NOT diagnose or prescribe
- ALWAYS include a disclaimer: "This information is for general guidance only and does not replace consultation with a qualified healthcare professional."
- If a situation sounds urgent, advise emergency services.

When a user asks for a doctor or specialty:
1. Call 'search_doctors' with the specialty name.
2. If doctors are found, list them and ask if the user wants to check availability for any of them.
3. If they pick a doctor, call 'get_available_slots' for that doctor and a specific date (usually today or tomorrow).
4. Provide a link like "/book/[doctorId]?date=[date]".
`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const tools = {
    search_doctors: tool({
      description: 'Search for doctors by specialty (e.g. Cardiology, Pediatrics, General Practice)',
      parameters: zodSchema(z.object({
        specialty: z.string().describe('The medical specialty to search for'),
      })),
      execute: async ({ specialty }) => {
        const doctors = await prisma.doctor.findMany({
          where: {
            isActive: true,
            specialty: { contains: specialty, mode: 'insensitive' },
          },
          include: { clinic: { select: { name: true } } },
          take: 5,
        });
        return doctors;
      },
    }),
    get_available_slots: tool({
      description: 'Get available appointment slots for a doctor on a specific date',
      parameters: zodSchema(z.object({
        doctorId: z.string().describe('The ID of the doctor'),
        date: z.string().describe('The date to check in YYYY-MM-DD format'),
      })),
      execute: async ({ doctorId, date }) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const slots = await prisma.slot.findMany({
          where: {
            doctorId,
            isBooked: false,
            startTime: { gte: start, lte: end },
          },
          orderBy: { startTime: 'asc' },
        });
        return slots;
      },
    }),
  };

  const result = streamText({
    model: openrouter.chat('google/gemini-2.0-flash-001'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxSteps: 5,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
