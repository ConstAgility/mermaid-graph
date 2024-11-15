import React, { useEffect, useState } from "react";
import mermaid from "mermaid";

type MermaidGraphProps = {
  graphCode: string;
  paths?: string[];
  onNodeClick?: (node: string) => void;
  onEdgeClick?: (edge: string) => void;
};

const MermaidGraph: React.FC<MermaidGraphProps> = ({
  graphCode,
  paths = [],
  onNodeClick,
  onEdgeClick,
}) => {
  const [isClient, setIsClient] = useState(false);

  const generateStyledGraphCode = () => {
    let styledGraphCode = graphCode;
    let currentLinkIndex = 0;
    const linkSequence: string[] = [];
    const startNodes = new Set<string>();
    const decisionNodes = new Set<string>();
    const endingNodes = new Set<string>();

    // Assign indices to each link in the Mermaid graph and categorize nodes
    graphCode.split("\n").forEach((line) => {
      const match = line.match(/([^\s]+)\s*-->\|([^\|]+)\|\s*([^\s]+)/);
      if (match) {
        const fromNode = match[1].replace(/\(\(.+\)\)/, ""); // Remove extra parentheses
        const toNode = match[3].replace(/\(\(.+\)\)/, ""); // Remove extra parentheses

        // Categorize nodes based on their prefixes
        if (fromNode.startsWith("S")) startNodes.add(fromNode); // Starting nodes
        if (fromNode.startsWith("D")) decisionNodes.add(fromNode); // Decision nodes
        if (toNode.startsWith("E")) endingNodes.add(toNode); // Ending nodes

        const linkKey = `${fromNode}->${match[2]}->${toNode}`;
        linkSequence.push(linkKey);
        currentLinkIndex += 1;
      }
    });

    // Apply styling to nodes based on their categories
    startNodes.forEach((node) => {
      styledGraphCode += `
        class ${node} start;
      `;
    });

    decisionNodes.forEach((node) => {
      styledGraphCode += `
        class ${node} decision;
      `;
    });

    endingNodes.forEach((node) => {
      styledGraphCode += `
        class ${node} ending;
      `;
    });

    // Add styles for each class
    styledGraphCode += `
      classDef start fill:#a8e6cf,stroke:#2b7a4b,stroke-width:2px;
      classDef decision fill:#d0e8f2,stroke:#4682b4,stroke-width:2px;
      classDef ending fill:#f9a,stroke:#333,stroke-width:2px;
    `;

    // Process each path and apply styling'
    const nodeStrokeColor = "#3366FF";
    paths.forEach((path) => {
      const steps = path.split(" -> ");
      const edgeColor = "#3366FF"; // Blue for edges
      // Blue for node outlines

      for (let i = 0; i < steps.length - 2; i += 2) {
        const fromNode = steps[i];
        const label = steps[i + 1];
        const toNode = steps[i + 2];

        // Apply styles to the nodes in the path
        styledGraphCode += `
      class ${fromNode} highlightedNode;
      class ${toNode} highlightedNode;
    `;

        // Find and style the edge
        const linkKey = `${fromNode}->${label}->${toNode}`;
        const linkIndex = linkSequence.findIndex((link) => link === linkKey);
        if (linkIndex !== -1) {
          styledGraphCode += `
        linkStyle ${linkIndex} stroke:${edgeColor},stroke-width:5px;
      `;
        }
      }
    });

    // Define the class for highlighted nodes
    styledGraphCode += `
  classDef highlightedNode stroke:${nodeStrokeColor},stroke-width:5px;
`;
    return styledGraphCode;
  };

  useEffect(() => {
    setIsClient(true); // Set to true only when the component is mounted in the browser
  }, []);

  useEffect(() => {
    if (isClient) {
      // Initialize Mermaid only on the client
      mermaid.initialize({ startOnLoad: true });

      // Add event listeners for node and edge clicks
      const svgElement = document.querySelector(".mermaid");
      if (svgElement) {
        svgElement.addEventListener("click", (event) => {
          const target = event.target as HTMLElement;
          if (target.closest(".node")) {
            const nodeId = target.closest(".node")?.id;
            if (onNodeClick && nodeId) {
              onNodeClick(nodeId);
            }
          } else if (
            target.closest(".edgeLabel") ||
            target.closest(".edgePaths")
          ) {
            const edgeLabel = target.closest(".edgeLabel")?.textContent;
            const edgePathId = target.closest("path.edge-thickness-normal")?.id;
            if (edgeLabel) {
              if (onEdgeClick) onEdgeClick(edgeLabel);
            } else if (edgePathId) {
              if (onEdgeClick) onEdgeClick(edgePathId);
            }
          }
        });
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      // Cleanup any previously created SVG elements
      const container = document.querySelector(".mermaid");
      if (container) {
        container.innerHTML = "";
      }

      const renderMermaid = async () => {
        await mermaid.contentLoaded();
        // Add the graph code dynamically
        const graphContainer = document.querySelector(".mermaid");
        if (graphContainer) {
          graphContainer.innerHTML = `<div class="mermaid">${generateStyledGraphCode()}</div>`;
          mermaid.initialize({ startOnLoad: true });
          mermaid.contentLoaded();
        }
      };
      renderMermaid();
    }
  }, [graphCode, paths, isClient]);

  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <div
      key={graphCode} // Force remount on graphCode change
      className="mermaid"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default MermaidGraph;
