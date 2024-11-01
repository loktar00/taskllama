const systemPrompts = {
    VISION_ANALYSIS: {
        id: 'vision_analysis',
        content: `Analyze the webpage screenshot. Focus on identifying:
- Main interactive elements
- Key content areas
- Navigation structure
- Forms and input fields
Provide a structured description of the page layout and functionality.`
    },

    TASK_PLANNING: {
        id: 'task_planning',
        content: `Based on the webpage analysis and the task objective:
1. Identify the necessary steps to complete the task
2. List any potential navigation requirements
3. Identify required interactions with page elements
4. Highlight any data that needs to be extracted
Provide your response in a structured format that can be parsed for next actions.`
    },

    ELEMENT_SELECTION: {
        id: 'element_selection',
        content: `Given the page content and target action:
1. Identify the most specific CSS selector or XPath for the target element
2. Provide fallback selectors if available
3. Describe the expected state of the element
4. List any preconditions for interaction`
    },

    NAVIGATION: {
        id: 'navigation',
        content: `Based on the page analysis and navigation objective:
1. Identify the current page location and structure
2. Locate relevant navigation elements (links, buttons, menus)
3. Determine the most direct path to the target
4. List any potential obstacles or required interactions
Provide a clear, step-by-step navigation plan.`
    }
};

export default systemPrompts;