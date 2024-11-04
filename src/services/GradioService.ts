import { Client } from "@gradio/client";

class GradioService {
    private client: any;
    private baseUrl: string;

    constructor(baseUrl = process.env.GRADIO_URL) {
        this.baseUrl = baseUrl || '';
        if (!this.baseUrl) {
            throw new Error('GRADIO_URL environment variable is not set');
        }
    }

    async initialize() {
        this.client = await Client.connect(this.baseUrl);
    }

    async processScreenshot(screenshot: Buffer) {
        if (!this.client) {
            await this.initialize();
        }

        // Convert Buffer to Blob
        const blob = new Blob([screenshot], { type: 'image/png' });

        const result = await this.client.predict("/process", {
            image_input: blob,
            box_threshold: 0.01,
            iou_threshold: 0.01,
            use_paddleocr: true,
        });

        return {
            annotatedImage: result.data[0],
            parsedElements: result.data[1]
        };
    }
}

export default GradioService;