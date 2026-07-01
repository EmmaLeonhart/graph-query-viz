# graph-query-viz

## Workflow Rules
- **Commit early and often.** Every meaningful change gets a commit with a clear message explaining *why*, not just what.
- **Do not enter planning-only modes.** All thinking must produce files and commits.
- **Keep this file up to date.**
- **Update README.md regularly.**

## Project Description
A visual tool for exploring knowledge graphs. Write SPARQL or Cypher queries and see results as interactive node-link diagrams. Supports Wikidata, Neo4j, and local RDF files.

## Architecture and Conventions
- **Frontend:** Static HTML/JS with D3.js or Cytoscape.js
- **Query backends:** SPARQL (via SPARQLWrapper or direct fetch), Cypher (via Neo4j HTTP API)
- **Structure:**
  - `index.html` -- Main app shell
  - `js/query-editor.js` -- Query input with syntax highlighting
  - `js/graph-renderer.js` -- D3/Cytoscape graph visualization
  - `js/backends/` -- SPARQL and Cypher query execution
  - `examples/` -- Pre-built example queries
- **Deployment:** GitHub Pages

# currentDate
Today's date is 2026-02-28.

## Long command series run in strict order
When Emma gives a long series of commands, treat it as a long series of commands to be
executed in relatively STRICT ORDER, one after another, EVEN IF the order seems not to
make sense or seems inefficient. The sequencing is intentional — she organizes the steps
so states change in the order she wants. Do not reorder, merge, or skip steps.
