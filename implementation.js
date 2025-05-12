async function render_excalidraw(params, userSettings) {
  const { mermaidSyntax, styleOverrides } = params;
  let parsedStyleOverrides = {};
  if (styleOverrides) {
    try {
      parsedStyleOverrides = JSON.parse(styleOverrides);
      if (typeof parsedStyleOverrides !== 'object' || parsedStyleOverrides === null) {
        throw new Error("styleOverrides must be a JSON object.");
      }
    } catch (error) {
      return `Error: Invalid styleOverrides JSON: ${error.message}`;
    }
  }
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Excalidraw with Mermaid</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f8f8f8;
    }
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .excalidraw-wrapper {
      width: 100%;
      height: 100%;
      overflow: auto;
      position: relative;
    }
    #app{
      width: 100%;
      height: 100%;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      color: #888;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <link rel="stylesheet" href="https://esm.sh/@excalidraw/excalidraw@0.18.0/dist/dev/index.css" />
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
        "react-dom": "https://esm.sh/react-dom@18"
      }
    }
  </script>
</head>
<body>
  <div id="loading-screen" class="container loading-container">
    <div class="spinner"></div>
    <p id="loading-text">Loading diagram...</p>
  </div>
  <div id="diagram-container" class="container" style="display: none;">
    <div id="app" class="excalidraw-wrapper"></div>
  </div>
  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom';
    import * as ExcalidrawLib from 'https://esm.sh/@excalidraw/excalidraw@0.18.0/dist/dev/index.js?external=react,react-dom';
    import { parseMermaidToExcalidraw } from 'https://esm.sh/@excalidraw/mermaid-to-excalidraw';
    const mermaidSyntaxToRender = \`${mermaidSyntax}\`;
    const styleOverridesToApply = ${JSON.stringify(parsedStyleOverrides)};
    const loadingTextElement = document.getElementById('loading-text');
    const loadingScreen = document.getElementById('loading-screen');
    const diagramContainer = document.getElementById('diagram-container');
    async function convertMermaidToExcalidrawData(mermaidSyntax, styleOverrides) {
      try {
        loadingTextElement.innerText = 'Parsing Mermaid syntax...';
        const { elements, files } = await parseMermaidToExcalidraw(mermaidSyntax);
        loadingTextElement.innerText = 'Converting to Excalidraw elements...';
        const excalidrawElements = ExcalidrawLib.convertToExcalidrawElements(elements);
        loadingTextElement.innerText = 'Applying styles...';
        const defaultStyles = { rectangle: {}, diamond: {}, arrow: {}, ellipse: {}, text: {} };
        const mergedStyles = {
          rectangle: { ...defaultStyles.rectangle, ...styleOverrides.rectangle },
          diamond: { ...defaultStyles.diamond, ...styleOverrides.diamond },
          arrow: { ...defaultStyles.arrow, ...styleOverrides.arrow },
          ellipse: { ...defaultStyles.ellipse, ...styleOverrides.ellipse},
          text: { ...defaultStyles.text, ...styleOverrides.text},
        };
        const styledElements = excalidrawElements.map(element => {
            let newElement = { ...element };
            if (newElement.type === "rectangle" && mergedStyles.rectangle) {
                newElement = { ...newElement, ...mergedStyles.rectangle };
            } else if (newElement.type === "diamond" && mergedStyles.diamond) {
                newElement = { ...newElement, ...mergedStyles.diamond };
            } else if (newElement.type === "arrow" && mergedStyles.arrow) {
                newElement = { ...newElement, ...mergedStyles.arrow };
            } else if (newElement.type === "ellipse" && mergedStyles.ellipse) {
                newElement = { ...newElement, ...mergedStyles.ellipse};
            } else if (newElement.type === "text" && mergedStyles.text) {
                newElement = { ...newElement, ...mergedStyles.text };
            }
            return newElement;
        });
        return { elements: styledElements, files };
      } catch (error) {
        console.error("Error converting Mermaid to Excalidraw:", error);
        return { error: error.message };
      }
    }
    async function renderExcalidrawWithMermaid(mermaidSyntax, styleOverrides) {
      const result = await convertMermaidToExcalidrawData(mermaidSyntax, styleOverrides);
      loadingScreen.style.display = 'none';
      diagramContainer.style.display = 'flex';
      const App = () => {
        if (result.error) {
          return React.createElement("div", { style: { color: "red", fontFamily: "sans-serif", padding: "20px" } }, "Error: " + result.error);
        }
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            ExcalidrawLib.Excalidraw, {
              initialData: { elements: result.elements, files: result.files },
            }
          )
        );
      };
      const excalidrawWrapper = document.getElementById("app");
      const root = ReactDOM.createRoot(excalidrawWrapper);
      root.render(React.createElement(App));
    }
    renderExcalidrawWithMermaid(mermaidSyntaxToRender, styleOverridesToApply);
  </script>
</body>
</html>
`.trim();
  return html;
}
