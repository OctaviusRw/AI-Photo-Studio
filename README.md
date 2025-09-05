# AI Photo Studio 📸✨

Welcome to AI Photo Studio, a powerful, web-based photo editing application powered by the Google Gemini API. This application allows you to upload photos, use your camera, or generate new images from scratch and transform them using a suite of intuitive, AI-driven tools.

![AI Photo Studio Screenshot](https://storage.googleapis.com/aistudio-hosting/readme_assets/ai-photo-studio-demo.gif)

## ✨ Key Features

- **Multiple Image Sources**:
  - **Upload**: Drag & drop or select an image file from your device.
  - **Camera**: Capture a photo directly within the app.
  - **Generate**: Create entirely new images from a text prompt using the `imagen-4.0-generate-001` model.
- **AI-Powered Editing**:
  - **Prompt-Based Edits**: Describe the changes you want in plain English (e.g., "change the background to a snowy mountain").
  - **AI Suggestions**: Get creative editing ideas tailored to your specific image.
- **Advanced Tools**:
  - **Magic Erase**: Simply draw over an object or imperfection to remove it seamlessly.
  - **Inpainting**: Select an area and describe what you want to add or change within it.
  - **Extend Image**: Expand the canvas of your photo in various aspect ratios, and the AI will generatively fill the new space.
- **User-Friendly Interface**:
  - A clean, responsive, and modern UI built with Tailwind CSS.
  - Instantly see your changes and compare them with the original image.
  - Download your final creation in high-quality PNG format.

## 🚀 Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Model**: [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`@google/genai`) for all image manipulation and generation tasks.

## ☁️ Deployment

This project is designed for easy deployment on a static hosting platform that supports environment variables, such as [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or a similar service. The application relies on a `process.env.API_KEY` variable being available during execution.

### Prerequisites

- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey).
- A [GitHub](https://github.com/) account.

### Deployment Steps

1.  **Fork the Repository**:
    - Click the "Fork" button at the top right of this page to create your own copy of this repository.

2.  **Connect to a Hosting Provider**:
    - Sign up for a free account with a provider like [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
    - Follow their instructions to connect your GitHub account and import the forked repository.

3.  **Configure the Project & Environment Variable**:
    - The hosting provider will likely auto-detect the project settings.
    - In your project's settings on the hosting platform, find the "Environment Variables" section.
    - Add a new variable:
      - **Name**: `API_KEY`
      - **Value**: `Your_Google_Gemini_API_Key_Here`

4.  **Deploy**:
    - Trigger a deployment. The platform will build and deploy your application. Once complete, your AI Photo Studio will be live and ready to use!

## 📂 Project Structure

The codebase is organized to be clean and maintainable.

```
/
├── components/      # Reusable React components (UI elements, icons)
├── services/        # Logic for communicating with the Gemini API
├── App.tsx          # Main application component with state management
├── index.html       # The main HTML file
├── index.tsx        # React application entry point
├── metadata.json    # Application metadata
├── types.ts         # TypeScript type definitions
└── README.md        # You are here!
```
