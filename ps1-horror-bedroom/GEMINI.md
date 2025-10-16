# Gemini Project Analysis

## Project Overview

This project is a PS1-style horror bedroom scene created with React, TypeScript, and Three.js. It features a progressive corruption system that transforms the scene from normal to hellish.

## Key Technologies

*   **React:** The core UI framework.
*   **TypeScript:** For type safety.
*   **Three.js:** For 3D rendering.
*   **react-three-fiber:** A React renderer for Three.js.
*   **react-three-rapier:** For physics.
*   **Vite:** As the build tool.
*   **ESLint:** For linting.
*   **GLSL:** For custom shaders.

## Project Structure

The project is well-structured, with a clear separation of concerns.

*   `src/components`: Contains all the React components, including 3D models, lighting, and UI.
*   `src/shaders`: Contains the GLSL shader files.
*   `src/systems`: Contains the game logic, such as the corruption and input systems.
*   `src/hooks`: Contains custom React hooks.
*   `src/constants`: Contains game configuration.
*   `src/assets`: Contains textures and other assets.

## Important Files

*   `src/App.tsx`: The main application component.
*   `src/components/Scene.tsx`: The main 3D scene component.
*   `src/systems/corruptionSystem.ts`: Manages the corruption stages.
*   `src/systems/inputSystem.ts`: Handles user input.
*   `src/hooks/useCorruptionMaterial.ts`: The custom hook for the progressive corruption shader.
*   `src/constants/gameConfig.ts`: Contains all the game constants.

## Available Commands

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the project for production.
*   `npm run lint`: Lints the project files.
*   `npm run preview`: Previews the production build.
