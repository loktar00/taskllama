class Task {
    id: string;
    type: string;
    url: string | null;
    initialPrompt: string;
    parentTask: Task | null;
    subtasks: Task[];
    status: string;
    result: any;
    error: any;
    discoveredUrls: { url: string; description: string }[];
    commands: string[];
    formData: Record<string, string>;

    constructor(id: string, type: string, initialPrompt: string, parentTask: Task | null = null, url: string | null = null) {
        this.id = id;
        this.type = type;
        this.url = url;
        this.initialPrompt = initialPrompt;
        this.parentTask = parentTask;
        this.subtasks = [];
        this.status = 'pending';
        this.result = null;
        this.error = null;
        this.discoveredUrls = [];
        this.commands = [];
        this.formData = {};
    }

    addSubtask(task: Task) {
        task.parentTask = this;
        this.subtasks.push(task);
    }

    updateStatus(status: string) {
        this.status = status;
    }

    setResult(result: any) {
        this.result = result;
    }

    setError(error: any) {
        this.error = error;
        this.status = 'failed';
    }

    addDiscoveredUrl(url: string, description: string) {
        this.discoveredUrls.push({ url, description });
    }

    getInitialUrl(): string | null {
        if (this.url) return this.url;
        if (this.parentTask) return this.parentTask.getInitialUrl();
        return null;
    }

    addCommand(command: string) {
        this.commands.push(command);
    }

    setFormData(data: Record<string, string>) {
        this.formData = { ...this.formData, ...data };
    }

    isFormFillTask() {
        return this.type === 'form_fill';
    }

    isNavigationTask() {
        return this.type === 'navigation';
    }

    isSubmitTask() {
        return this.type === 'submit';
    }
}

export default Task;