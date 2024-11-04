import * as pw from 'playwright';
import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import OllamaClient from '../ollama';
import GradioService from '../services/GradioService';
import systemPrompts from '../prompts/systemPrompts';
import PageProcessor from './PageProcessor';
import Task from './Task';

class TaskManager {
    private ollamaClient: OllamaClient;
    private gradioService: GradioService;
    private pageProcessor: PageProcessor;
    private currentTask: Task | null;
    private browser: pw.Browser | null;
    private page: pw.Page | null;
    private visionModel: string;
    private languageModel: string;

    constructor() {
        this.ollamaClient = new OllamaClient();
        this.gradioService = new GradioService();
        this.pageProcessor = new PageProcessor();
        this.currentTask = null;
        this.browser = null;
        this.page = null;

        // Get model configurations from environment
        this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava';
        this.languageModel = process.env.OLLAMA_LANGUAGE_MODEL || 'llama2';
    }

    async initialize() {
        this.browser = await pw.chromium.launch();
        this.page = await this.browser.newPage();
        await this.gradioService.initialize();

        // Blocks ads and tracking
        PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
            blocker.enableBlockingInPage(this.page as pw.Page);
        });
    }

    async executeTask(task: Task) {
        try {
            this.currentTask = task;
            task.updateStatus('in_progress');

            const initialUrl = task.getInitialUrl();
            if (!initialUrl) {
                throw new Error('No URL available for task execution');
            }

            // Handle different task types
            if (task.isNavigationTask()) {
                await this.handleNavigationTask(task);
            } else if (task.isFormFillTask()) {
                await this.handleFormFillTask(task);
            } else if (task.isSubmitTask()) {
                await this.handleSubmitTask(task);
            } else {
                await this.handleGenericTask(task);
            }

            task.updateStatus('completed');
            return task.result;

        } catch (error) {
            task.setError(error);
            throw error;
        }
    }

    async handleNavigationTask(task: Task) {
        await this.page?.goto(task.url as string);
        await this.page?.waitForLoadState('networkidle');

        // Take screenshot
        const screenshotBuffer = await this.page?.screenshot();

        // Process with Gradio
        const visionAnalysis = await this.gradioService.processScreenshot(screenshotBuffer as Buffer);

        // Use the parsed elements with the language model
        const navigationPlan = await this.ollamaClient.generateCompletion(
            this.languageModel,
            `${systemPrompts.NAVIGATION.content}
            \n\nPage Elements: ${visionAnalysis.parsedElements}
            \n\nNavigation Objective: ${task.initialPrompt}`
        );

        task.setResult({
            visionAnalysis: visionAnalysis.parsedElements,
            annotatedImage: visionAnalysis.annotatedImage,
            navigationPlan: navigationPlan.response,
            pageContent: await this.page?.content() || ''
        });
    }

    async handleFormFillTask(task: Task) {
        const { formData } = task;

        for (const [field, value] of Object.entries(formData)) {
            const fieldElement = await this.pageProcessor.getElementByAISelection(
                this.page as pw.Page,
                `Find the form field for ${field}`,
                await this.page?.content() || ''
            );

            if (fieldElement) {
                await fieldElement.fill(value);
            }
        }
    }

    async handleSubmitTask(task: Task) {
        const submitButton = await this.pageProcessor.getElementByAISelection(
            this.page as pw.Page,
            'Find the submit button for the form',
            await this.page?.content() || ''
        );

        if (submitButton) {
            await submitButton.click();
            // Wait for navigation or response
            await this.page?.waitForLoadState('networkidle');
        }
    }

    async handleGenericTask(task: Task) {
        if (!this.page) {
            throw new Error('Page is not initialized');
        }

        await this.page.goto(task.url as string);
        await this.page.waitForLoadState('networkidle');

        const screenshotBuffer = await this.page.screenshot();
        const screenshot = screenshotBuffer.toString('base64');
        const pageContent = await this.page.content();

        const visionAnalysis = await this.ollamaClient.generateCompletion(
            this.visionModel,
            systemPrompts.VISION_ANALYSIS.content,
            { imageBase64: screenshot }
        );

        const taskPlan = await this.ollamaClient.generateCompletion(
            this.languageModel,
            `${systemPrompts.TASK_PLANNING.content}\n\nPage Analysis: ${visionAnalysis.response}\n\nTask Objective: ${task.initialPrompt}`
        );

        task.setResult({
            visionAnalysis: visionAnalysis.response,
            taskPlan: taskPlan.response,
            pageContent
        });
    }

    async createSubtaskFromCommand(parentTask: Task, command: any) {
        const taskType = this.determineTaskType(command);

        const subtask = new Task(
            `${parentTask.id}_sub_${parentTask.subtasks.length + 1}`,
            taskType,
            command.task,
            parentTask,
            command.url
        );

        if (command.formData) {
            subtask.setFormData(command.formData);
        }

        parentTask.addSubtask(subtask);
        return subtask;
    }

    determineTaskType(command: any) {
        if (command.task.toLowerCase().includes('fill')) return 'form_fill';
        if (command.task.toLowerCase().includes('submit')) return 'submit';
        if (command.task.toLowerCase().includes('navigate')) return 'navigation';
        return 'generic';
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export default TaskManager;