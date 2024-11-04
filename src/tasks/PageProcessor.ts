import OllamaClient from '../ollama/index.js';
import systemPrompts from '../prompts/systemPrompts.js';
import * as pw from 'playwright';

class PageProcessor {
    languageModel: string;

    constructor() {
        this.languageModel = process.env.OLLAMA_LANGUAGE_MODEL || 'llama2';
    }

    async getElementByAISelection(page: pw.Page, elementDescription: string, pageContent: string) {
        const ollamaClient = new OllamaClient();

        // Get selector from LLM using configured model
        const selectorResponse = await ollamaClient.generateCompletion(
            this.languageModel,
            `${systemPrompts.ELEMENT_SELECTION.content}\n\nElement Description: ${elementDescription}\n\nPage Content: ${pageContent}`
        );

        // Parse the response to get the selector
        const selector = this.parseSelectorFromResponse(selectorResponse.response) || '';

        // Wait for element and return it
        await page.waitForSelector(selector);
        return await page.$(selector);
    }

    parseSelectorFromResponse(response: string) {
        // Implementation to extract selector from LLM response
        // This would need to be implemented based on your LLM's response format
        return response.match(/selector: ["']([^"']+)["']/)?.[1] || null;
    }

    async extractPageContent(page: { innerText: (arg0: string) => any; content: () => any; title: () => any; }) {
        return {
            text: await page.innerText('body'),
            html: await page.content(),
            title: await page.title()
        };
    }
}

export default PageProcessor;