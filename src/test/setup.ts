import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API Server (MSW)
export const handlers = [
  http.get('*/api/models', () => {
    return HttpResponse.json({
      models: [
        { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
        { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Powerful and smart' }
      ],
      currentModel: 'gemini-1.5-flash'
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
