/* ============================================================
   app.js - Main application controller
   ============================================================ */

(async function () {
  "use strict";

  // -- DOM references ----------------------------------------
  const queryEditor = document.getElementById("query-editor");
  const exampleSelect = document.getElementById("example-select");
  const runBtn = document.getElementById("run-btn");
  const statusDot = document.querySelector(".status-dot");
  const statusText = document.querySelector(".status-text");
  const statsNodes = document.getElementById("stat-nodes");
  const statsEdges = document.getElementById("stat-edges");
  const emptyState = document.querySelector(".empty-state");
  const graphContainer = document.getElementById("graph-container");
  const errorToast = document.getElementById("error-toast");

  // -- State -------------------------------------------------
  let exampleQueries = [];

  // -- Initialise graph renderer -----------------------------
  GraphRenderer.init(graphContainer);

  // -- Load example queries ----------------------------------
  try {
    const resp = await fetch("examples/queries.json");
    exampleQueries = await resp.json();
    populateExamples();
  } catch (err) {
    console.warn("Could not load example queries:", err);
  }

  function populateExamples() {
    exampleQueries.forEach((q, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = q.name;
      exampleSelect.appendChild(opt);
    });
  }

  // -- Example selection -------------------------------------
  exampleSelect.addEventListener("change", () => {
    const idx = exampleSelect.value;
    if (idx === "") return;
    const example = exampleQueries[idx];
    queryEditor.value = example.query;
    setStatus("ready", example.description || "Query loaded. Press Run.");
  });

  // -- Run query ---------------------------------------------
  runBtn.addEventListener("click", runQuery);

  // Ctrl+Enter shortcut
  queryEditor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
    // Tab inserts two spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = queryEditor.selectionStart;
      const end = queryEditor.selectionEnd;
      queryEditor.value =
        queryEditor.value.substring(0, start) +
        "  " +
        queryEditor.value.substring(end);
      queryEditor.selectionStart = queryEditor.selectionEnd = start + 2;
    }
  });

  async function runQuery() {
    const query = queryEditor.value.trim();
    if (!query) {
      showError("Please enter a SPARQL query.");
      return;
    }

    // UI feedback
    runBtn.classList.add("loading");
    runBtn.disabled = true;
    setStatus("loading", "Querying Wikidata...");
    hideError();
    GraphRenderer.clear();
    emptyState.classList.add("hidden");

    try {
      const bindings = await SPARQL.execute(query);

      if (bindings.length === 0) {
        setStatus("ready", "Query returned no results.");
        emptyState.classList.remove("hidden");
        updateStats(0, 0);
        return;
      }

      const graph = SPARQL.toGraph(bindings);

      if (graph.nodes.length === 0) {
        setStatus("ready", "No graph-renderable entities found in results.");
        emptyState.classList.remove("hidden");
        updateStats(0, 0);
        return;
      }

      GraphRenderer.render(graph);
      updateStats(graph.nodes.length, graph.edges.length);
      setStatus(
        "ready",
        `Rendered ${graph.nodes.length} nodes and ${graph.edges.length} edges from ${bindings.length} results.`
      );
    } catch (err) {
      console.error("Query error:", err);
      setStatus("error", "Query failed.");
      showError(err.message || "An unknown error occurred.");
      emptyState.classList.remove("hidden");
    } finally {
      runBtn.classList.remove("loading");
      runBtn.disabled = false;
    }
  }

  // -- Status helpers ----------------------------------------
  function setStatus(state, text) {
    statusDot.className = "status-dot " + state;
    statusText.textContent = text;
  }

  function updateStats(nodes, edges) {
    statsNodes.textContent = `${nodes} nodes`;
    statsEdges.textContent = `${edges} edges`;
  }

  // -- Error toast -------------------------------------------
  function showError(msg) {
    errorToast.textContent = msg;
    errorToast.classList.add("visible");
    setTimeout(() => hideError(), 8000);
  }

  function hideError() {
    errorToast.classList.remove("visible");
  }

  // -- Initial state -----------------------------------------
  setStatus("ready", "Select an example or write a SPARQL query, then press Run.");
})();
