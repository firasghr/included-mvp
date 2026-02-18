/**
 * OpenAI Mock
 * Mocks OpenAI API calls to avoid real charges during testing
 */

export const mockOpenAIResponse = (content: string) => {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
};

export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(
        mockOpenAIResponse('This is a test summary of the input text.')
      ),
    },
  },
};

// Mock the OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

export const resetOpenAIMock = () => {
  mockOpenAI.chat.completions.create.mockReset();
  mockOpenAI.chat.completions.create.mockResolvedValue(
    mockOpenAIResponse('This is a test summary of the input text.')
  );
};

export const setOpenAIMockResponse = (content: string) => {
  mockOpenAI.chat.completions.create.mockResolvedValue(
    mockOpenAIResponse(content)
  );
};

export const setOpenAIMockError = (error: Error) => {
  mockOpenAI.chat.completions.create.mockRejectedValue(error);
};
