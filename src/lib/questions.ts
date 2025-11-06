import { checkbox, confirm, input, number, password, rawlist, select } from '@inquirer/prompts';

export interface TemplateQuestion {
  name: string;
  type: 'input' | 'confirm' | 'select' | 'checkbox' | 'password' | 'number' | 'rawlist';
  message: string;
  default?: string | boolean | number | string[];
  choices?: string[];
}

export interface TemplateConfig {
  name: string;
  description: string;
  questions: TemplateQuestion[];
}

export interface AnswerMap {
  [key: string]: string | boolean | number | string[];
}

export const askQuestions = async (questions: TemplateQuestion[]): Promise<AnswerMap> => {
  const answers: AnswerMap = {};

  for (const question of questions) {
    try {
      switch (question.type) {
        case 'input':
          answers[question.name] = await input({
            message: question.message,
            default: typeof question.default === 'string' ? question.default : undefined
          });
          break;

        case 'confirm':
          answers[question.name] = await confirm({
            message: question.message,
            default: typeof question.default === 'boolean' ? question.default : false
          });
          break;

        case 'select':
          answers[question.name] = await select({
            message: question.message,
            choices: question.choices?.map((choice) => ({ name: choice, value: choice })) || [],
            default: typeof question.default === 'string' ? question.default : undefined
          });
          break;

        case 'checkbox':
          answers[question.name] = await checkbox({
            message: question.message,
            choices: question.choices?.map((choice) => ({ name: choice, value: choice })) || []
            // checkbox doesn't support default in @inquirer/prompts v7
          });
          break;

        case 'password':
          answers[question.name] = await password({
            message: question.message
          });
          break;

        case 'number': {
          const numberResult = await number({
            message: question.message,
            default: typeof question.default === 'number' ? question.default : undefined
          });
          answers[question.name] = numberResult ?? 0;
          break;
        }

        case 'rawlist':
          answers[question.name] = await rawlist({
            message: question.message,
            choices: question.choices?.map((choice) => ({ name: choice, value: choice })) || []
            // rawlist doesn't support default in @inquirer/prompts v7
          });
          break;

        default:
          console.warn(
            `⚠️  Unsupported question type: ${question.type}, skipping question: ${question.name}`
          );
          break;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\n👋 Cancelled by user');
        process.exit(0);
      }
      throw error;
    }
  }

  return answers;
};

export const parseTemplateConfig = (yamlContent: unknown): TemplateConfig => {
  if (!yamlContent || typeof yamlContent !== 'object') {
    throw new Error('Invalid template configuration: must be an object');
  }

  const content = yamlContent as Record<string, unknown>;

  if (!content.name || typeof content.name !== 'string') {
    throw new Error('Invalid template configuration: missing or invalid "name" field');
  }

  if (!content.description || typeof content.description !== 'string') {
    throw new Error('Invalid template configuration: missing or invalid "description" field');
  }

  if (!Array.isArray(content.questions)) {
    throw new Error('Invalid template configuration: "questions" must be an array');
  }

  // Validate each question
  const questions: TemplateQuestion[] = content.questions.map((q: unknown, index: number) => {
    if (!q || typeof q !== 'object') {
      throw new Error(`Invalid question at index ${index}: must be an object`);
    }

    const question = q as Record<string, unknown>;

    if (!question.name || typeof question.name !== 'string') {
      throw new Error(`Invalid question at index ${index}: missing or invalid "name" field`);
    }

    if (!question.type || typeof question.type !== 'string') {
      throw new Error(`Invalid question at index ${index}: missing or invalid "type" field`);
    }

    if (
      !['input', 'confirm', 'select', 'checkbox', 'password', 'number', 'rawlist'].includes(
        question.type
      )
    ) {
      throw new Error(`Invalid question at index ${index}: unsupported type "${question.type}"`);
    }

    if (!question.message || typeof question.message !== 'string') {
      throw new Error(`Invalid question at index ${index}: missing or invalid "message" field`);
    }

    const templateQuestion: TemplateQuestion = {
      name: question.name,
      type: question.type as
        | 'input'
        | 'confirm'
        | 'select'
        | 'checkbox'
        | 'password'
        | 'number'
        | 'rawlist',
      message: question.message
    };

    // Add optional default value
    if (question.default !== undefined) {
      if (question.type === 'confirm' && typeof question.default !== 'boolean') {
        throw new Error(
          `Invalid question at index ${index}: "default" for confirm questions must be boolean`
        );
      }
      if (question.type === 'number' && typeof question.default !== 'number') {
        throw new Error(
          `Invalid question at index ${index}: "default" for number questions must be number`
        );
      }
      if (question.type === 'checkbox' && !Array.isArray(question.default)) {
        throw new Error(
          `Invalid question at index ${index}: "default" for checkbox questions must be array`
        );
      }
      if (
        (question.type === 'input' ||
          question.type === 'select' ||
          question.type === 'rawlist' ||
          question.type === 'password') &&
        typeof question.default !== 'string'
      ) {
        throw new Error(
          `Invalid question at index ${index}: "default" for ${question.type} questions must be string`
        );
      }
      templateQuestion.default = question.default as string | boolean | number | string[];
    }

    // Add choices for questions that require them
    if (['select', 'checkbox', 'rawlist'].includes(question.type)) {
      if (!Array.isArray(question.choices) || question.choices.length === 0) {
        throw new Error(
          `Invalid question at index ${index}: "choices" array required for ${question.type} questions`
        );
      }
      if (!question.choices.every((choice: unknown) => typeof choice === 'string')) {
        throw new Error(`Invalid question at index ${index}: all "choices" must be strings`);
      }
      templateQuestion.choices = question.choices as string[];
    }

    return templateQuestion;
  });

  return {
    name: content.name,
    description: content.description,
    questions
  };
};
