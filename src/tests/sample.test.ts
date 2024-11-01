import { test, expect } from '@playwright/test';
import TaskManager from '../tasks/TaskManager.js';
import Task from '../tasks/Task.js';

test.describe('Form Filling Task', () => {
    let taskManager: TaskManager;

    test.beforeEach(async () => {
        taskManager = new TaskManager();
        await taskManager.initialize();
    });

    test.afterEach(async () => {
        await taskManager.cleanup();
    });

    test('should analyze and fill a form', async () => {
        // Initial task to analyze the form page
        const mainTask = new Task(
            'form_analysis',
            'navigation',
            'Analyze the form on this page',
            null,
            'https://www.w3schools.com/html/html_forms.asp'
        );

        // Get page analysis
        const analysis = await taskManager.executeTask(mainTask);
        console.log('Vision Analysis:', analysis.visionAnalysis);

        // Form fill task
        const formFillTask = await taskManager.createSubtaskFromCommand(mainTask, {
            type: 'form_fill',
            task: 'Fill in the form fields',
            formData: {
                firstName: 'Jason',
                lastName: 'Brown'
            }
        });

        await taskManager.executeTask(formFillTask);

        // Submit task
        const submitTask = await taskManager.createSubtaskFromCommand(mainTask, {
            type: 'submit',
            task: 'Submit the form'
        });

        await taskManager.executeTask(submitTask);

        expect(mainTask.subtasks.length).toBe(2);
        expect(formFillTask.status).toBe('completed');
        expect(submitTask.status).toBe('completed');
    });
});