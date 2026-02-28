# graph-query-viz

> Scaffolded with [cleanvibe](https://github.com/Immanuelle/cleanvibe).

## About

A visual tool for exploring and querying knowledge graphs. Write SPARQL or Cypher queries and see results rendered as interactive node-link diagrams. Built to make graph databases accessible and to demonstrate practical graph query skills.

### Why This Exists

Emma's bio says *"I am passionate about graphs and graph queries"* -- this project makes that visible. Graph databases power Wikidata, social networks, and recommendation engines, but most query tools dump results as tables. This tool renders query results as explorable graphs, making relationships visible at a glance.

### Features (Planned)

- **Multi-backend support** -- Query Wikidata (SPARQL), Neo4j (Cypher), or local RDF files
- **Interactive visualization** -- Click nodes to expand, hover for details, drag to rearrange
- **Query editor** -- Syntax-highlighted editor with autocomplete for SPARQL and Cypher
- **Example queries** -- Pre-built queries for common patterns (shortest path, subgraph, property lookup)
- **Export** -- Save visualizations as SVG/PNG or share via URL
- **Wikidata integration** -- Special support for exploring Wikidata entities and their relationships

### Example Use Cases

- Visualize the shrine hierarchy in Wikidata (which shrines are "part of" which shrine networks)
- Explore "instance of" / "subclass of" chains for any Wikidata entity
- Map relationships between people, places, and events in a Neo4j database
- Teaching tool for graph database concepts

## Tech Stack

- **Frontend:** HTML/CSS/JS with D3.js or Cytoscape.js for graph rendering
- **Backend (optional):** Python (Flask) for proxying SPARQL/Cypher queries
- **Deployment:** GitHub Pages for the frontend; backend optional

## Getting Started

```
cd graph-query-viz
claude
```
