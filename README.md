# AI Photo Studio 📸✨

Welcome to AI Photo Studio, a powerful, web-based photo editing application powered by the Google Gemini API. This application allows you to upload photos or generate new images from scratch and transform them using a suite of intuitive, AI-driven tools.

![AI Photo Studio Screenshot](https://storage.googleapis.com/aistudio-hosting/readme_assets/ai-photo-studio-demo.gif)

## ✨ Key Features

- **Dual Image Sources**:
  - **Upload Your Photo**: Drag & drop or select an image file from your device to begin editing.
  - **Generate with AI**: Create entirely new, high-quality images from a simple text prompt. Describe your vision, choose an aspect ratio, and let the AI bring it to life.

- **Intuitive AI Editing Suite**:
  - **Prompt-Based Edits**: Modify your image by describing the changes you want in plain English. For example, "change the background to a beach at sunset" or "make the lighting more dramatic."
  - **Magic Erase**: Seamlessly remove unwanted objects, people, or imperfections by simply drawing over them.
  - **Inpainting**: Select an area of your image and tell the AI what to add or replace it with, from adding new objects to changing clothing.
  - **Extend Image (Outpainting)**: Expand the canvas of your photo in various aspect ratios. The AI intelligently generates new content to fill the empty space, matching the style of the original image.

- **User-Friendly Interface**:
  - A clean, responsive, and modern UI built with React and Tailwind CSS.
  - Instantly see your changes and compare them with the original image.
  - Download your final creation as a high-quality PNG file.

## 🚀 Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Google AI**:
  - **SDK**: [`@google/genai`](https://www.npmjs.com/package/@google/genai) for JavaScript.
  - **Image Generation Model**: `imagen-4.0-generate-001` is used to create new images from text.
  - **Image Editing Model**: `gemini-2.5-flash-image-preview` powers all in-image modifications, including prompt-based edits, erasing, inpainting, and extending.

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