import fetch from 'node-fetch';

interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    done_reason: string;
    context: any[];
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

class OllamaClient {
    baseUrl: string | undefined;

    constructor(baseUrl = process.env.OLLAMA_BASE_URL) {
        this.baseUrl = baseUrl;
        if (!this.baseUrl) {
            const envVars = {
                OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
                OLLAMA_VISION_MODEL: process.env.OLLAMA_VISION_MODEL,
                OLLAMA_LANGUAGE_MODEL: process.env.OLLAMA_LANGUAGE_MODEL
            };

            console.error('Available environment variables:', envVars);
            throw new Error('OLLAMA_BASE_URL environment variable is not set. Please run with: node --env-file=.env npx playwright test');
        }
    }

    async generateCompletion(model: string, prompt: string, options: { num_ctx?: number; imageBase64?: string } = { num_ctx: 8192 }): Promise<OllamaResponse> {
        const requestBody: any = {
            model,
            prompt,
            stream: false,
            ...options,
        };

        if (options.imageBase64) {
            requestBody.images = [options.imageBase64];
            console.log('\n=== Ollama API Request (with image) ===');
            console.log('Request Body (truncated):', {
                ...requestBody,
                images: [`${options.imageBase64.substring(0, 10)}...`], // Truncate image data for logging
            });
        } else {
            console.log('\n=== Ollama API Request ===');
            console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        }

        console.log('URL:', `${this.baseUrl}/api/generate`);
        console.log('Method: POST');

        const response: Response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('\n=== Ollama API Response ===');
        console.log('Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Response Body:', errorText);
            throw new Error(`Ollama API error: ${response.statusText}\nDetails: ${errorText}`);
        }

        const jsonResponse: OllamaResponse = await response.json();
        console.log('Response Body:', JSON.stringify(jsonResponse, null, 2));
        return jsonResponse;
    }

    async listModels() {
        console.log('\n=== Ollama API Request (list models) ===');
        console.log('URL:', `${this.baseUrl}/api/tags`);
        console.log('Method: GET');

        const response = await fetch(`${this.baseUrl}/api/tags`, {
            method: 'GET',
        });

        console.log('\n=== Ollama API Response ===');
        console.log('Status:', response.status, response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Response Body:', errorText);
            throw new Error(`Ollama API error: ${response.statusText}\nDetails: ${errorText}`);
        }

        const jsonResponse = await response.json();
        console.log('Response Body:', JSON.stringify(jsonResponse, null, 2));
        return jsonResponse;
    }

    async checkModelStatus(model: string) {
        try {
            const models = await this.listModels();
            return models.models.some(m => m.name === model);
        } catch (error) {
            console.error('Error checking model status:', error);
            return false;
        }
    }
}

export default OllamaClient;
