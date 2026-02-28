/* ============================================================
   graph.js - D3.js force-directed graph rendering
   ============================================================ */

const GraphRenderer = (() => {
  // -- Colour palette for node types --------------------------
  const PALETTE = [
    "#7c6ff7", // purple
    "#4caf80", // green
    "#e8a838", // amber
    "#e05858", // red
    "#3b9dd6", // blue
    "#d66eba", // pink
    "#45bfb7", // teal
    "#8b7355", // brown
  ];

  let svg, g, simulation;
  let linkGroup, nodeGroup;
  let tooltip, detailPanel;
  let currentNodes = [];
  let currentEdges = [];
  let typeColorMap = {};
  let width, height;

  /**
   * Initialise the renderer against a container element.
   */
  function init(container) {
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Arrowhead marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L10,0L0,4")
      .attr("fill", "#c8c8d8");

    // Zoomable group
    const zoom = d3.zoom().scaleExtent([0.15, 5]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

    svg.call(zoom);

    g = svg.append("g");

    linkGroup = g.append("g").attr("class", "links");
    nodeGroup = g.append("g").attr("class", "nodes");

    // Tooltip element
    tooltip = d3.select(container.parentElement).append("div").attr("class", "graph-tooltip");

    // Detail panel
    detailPanel = d3.select(container.parentElement).select(".detail-panel");

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      svg.attr("width", width).attr("height", height);
      if (simulation) {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
      }
    });
    resizeObserver.observe(container);
  }

  /**
   * Render a graph { nodes, edges } with a force-directed layout.
   */
  function render(graphData) {
    currentNodes = graphData.nodes.map((d) => ({ ...d }));
    currentEdges = graphData.edges.map((d) => ({ ...d }));

    // Assign colours by type
    const types = [...new Set(currentNodes.map((n) => n.type))];
    typeColorMap = {};
    types.forEach((t, i) => {
      typeColorMap[t] = PALETTE[i % PALETTE.length];
    });

    // Clear previous
    linkGroup.selectAll("*").remove();
    nodeGroup.selectAll("*").remove();

    // Links
    const links = linkGroup
      .selectAll("line")
      .data(currentEdges)
      .join("line")
      .attr("class", "link")
      .attr("marker-end", "url(#arrowhead)");

    // Nodes
    const nodes = nodeGroup
      .selectAll("g")
      .data(currentNodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .call(drag());

    const nodeRadius = Math.max(6, Math.min(14, 200 / Math.sqrt(currentNodes.length)));

    nodes
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => typeColorMap[d.type] || PALETTE[0]);

    nodes
      .append("text")
      .attr("dy", nodeRadius + 14)
      .text((d) => truncate(d.label, 22))
      .style("font-size", `${Math.max(9, Math.min(12, 150 / Math.sqrt(currentNodes.length)))}px`);

    // Interactions
    nodes
      .on("mouseover", (event, d) => showTooltip(event, d))
      .on("mousemove", (event) => moveTooltip(event))
      .on("mouseout", () => hideTooltip())
      .on("click", (event, d) => {
        event.stopPropagation();
        highlightNode(d, nodes, links);
        showDetail(d);
      });

    // Click canvas to deselect
    svg.on("click", () => {
      clearHighlight(nodes, links);
      hideDetail();
    });

    // Simulation
    simulation = d3
      .forceSimulation(currentNodes)
      .force(
        "link",
        d3.forceLink(currentEdges).id((d) => d.id).distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius + 8))
      .on("tick", () => {
        links
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });
  }

  /* -- Drag behaviour --------------------------------------- */
  function drag() {
    return d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  /* -- Tooltip ---------------------------------------------- */
  function showTooltip(event, d) {
    tooltip
      .html(
        `<div class="tt-label">${escapeHtml(d.label)}</div>` +
          `<div class="tt-id">${d.id}</div>` +
          `<div class="tt-type">${d.type}</div>`
      )
      .classed("visible", true);
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const containerRect = svg.node().parentElement.getBoundingClientRect();
    const x = event.clientX - containerRect.left + 14;
    const y = event.clientY - containerRect.top - 10;
    tooltip.style("left", x + "px").style("top", y + "px");
  }

  function hideTooltip() {
    tooltip.classed("visible", false);
  }

  /* -- Highlight -------------------------------------------- */
  function highlightNode(d, nodes, links) {
    const connectedIds = new Set();
    connectedIds.add(d.id);

    links.each(function (l) {
      const srcId = typeof l.source === "object" ? l.source.id : l.source;
      const tgtId = typeof l.target === "object" ? l.target.id : l.target;
      if (srcId === d.id || tgtId === d.id) {
        connectedIds.add(srcId);
        connectedIds.add(tgtId);
      }
    });

    nodes
      .classed("highlighted", (n) => n.id === d.id)
      .classed("dimmed", (n) => !connectedIds.has(n.id));

    links
      .classed("highlighted", (l) => {
        const srcId = typeof l.source === "object" ? l.source.id : l.source;
        const tgtId = typeof l.target === "object" ? l.target.id : l.target;
        return srcId === d.id || tgtId === d.id;
      })
      .classed("dimmed", (l) => {
        const srcId = typeof l.source === "object" ? l.source.id : l.source;
        const tgtId = typeof l.target === "object" ? l.target.id : l.target;
        return srcId !== d.id && tgtId !== d.id;
      });
  }

  function clearHighlight(nodes, links) {
    nodes.classed("highlighted", false).classed("dimmed", false);
    links.classed("highlighted", false).classed("dimmed", false);
  }

  /* -- Detail Panel ----------------------------------------- */
  function showDetail(d) {
    if (!detailPanel.node()) return;

    // Find connections
    const connections = [];
    currentEdges.forEach((e) => {
      const srcId = typeof e.source === "object" ? e.source.id : e.source;
      const tgtId = typeof e.target === "object" ? e.target.id : e.target;
      if (srcId === d.id) {
        const targetNode = currentNodes.find((n) => n.id === tgtId);
        if (targetNode) connections.push(targetNode.label);
      } else if (tgtId === d.id) {
        const sourceNode = currentNodes.find((n) => n.id === srcId);
        if (sourceNode) connections.push(sourceNode.label);
      }
    });

    const wikidataUrl = `https://www.wikidata.org/wiki/${d.id}`;

    detailPanel.html(`
      <button class="detail-close" onclick="this.parentElement.classList.remove('visible')">&times;</button>
      <h3>${escapeHtml(d.label)}</h3>
      <div class="detail-id"><a href="${wikidataUrl}" target="_blank" rel="noopener">${d.id}</a></div>
      ${
        connections.length > 0
          ? `<div class="detail-connections">
              <h4>Connections (${connections.length})</h4>
              <ul class="connection-list">
                ${connections.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>`
          : ""
      }
    `);

    detailPanel.classed("visible", true);
  }

  function hideDetail() {
    if (detailPanel.node()) {
      detailPanel.classed("visible", false);
    }
  }

  /* -- Helpers ---------------------------------------------- */
  function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Clear the graph canvas.
   */
  function clear() {
    if (simulation) simulation.stop();
    linkGroup.selectAll("*").remove();
    nodeGroup.selectAll("*").remove();
    currentNodes = [];
    currentEdges = [];
    hideDetail();
  }

  return { init, render, clear };
})();
