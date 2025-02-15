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
  </style>
</head>
<body>
  <div id="app" class="excalidraw-wrapper"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw.production.min.js"></script>
  <script type="module">
    import { parseMermaidToExcalidraw } from 'https://esm.sh/@excalidraw/mermaid-to-excalidraw';
    const mermaidSyntaxToRender = \`${mermaidSyntax}\`;
    async function convertMermaidToExcalidrawData(mermaidSyntax, styleOverrides) {
      try {
        const { elements, files } = await parseMermaidToExcalidraw(mermaidSyntax);
        const excalidrawElements = ExcalidrawLib.convertToExcalidrawElements(elements);
        const defaultStyles = { rectangle: {}, diamond: {}, arrow: {}, ellipse: {} };
        const mergedStyles = {
          rectangle: { ...defaultStyles.rectangle, ...styleOverrides.rectangle },
          diamond: { ...defaultStyles.diamond, ...styleOverrides.diamond },
          arrow: { ...defaultStyles.arrow, ...styleOverrides.arrow },
          ellipse: { ...defaultStyles.ellipse, ...styleOverrides.ellipse},
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
      const App = () => {
        if (result.error) {
          return React.createElement("div", { style: { color: "red" } }, "Error: " + result.error);
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
    renderExcalidrawWithMermaid(mermaidSyntaxToRender, ${JSON.stringify(parsedStyleOverrides)});
  </script>
</body>
</html>
`.trim();
  return html;
}
