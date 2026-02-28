/* ============================================================
   sparql.js - SPARQL query execution and result parsing
   ============================================================ */

const SPARQL = (() => {
  const ENDPOINT = "https://query.wikidata.org/sparql";

  /**
   * Execute a SPARQL query against the Wikidata endpoint.
   * Returns the raw JSON result bindings.
   */
  async function execute(query) {
    const params = new URLSearchParams({ query, format: "json" });

    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "GraphQueryViz/1.0 (https://github.com/Emma-Leonhart/graph-query-viz)",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SPARQL query failed (${response.status}): ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    return json.results.bindings;
  }

  /**
   * Extract an entity ID from a Wikidata URI.
   * e.g. "http://www.wikidata.org/entity/Q42" => "Q42"
   */
  function extractId(uri) {
    if (!uri) return null;
    const match = uri.match(/\/entity\/(Q\d+)$/);
    return match ? match[1] : null;
  }

  /**
   * Convert SPARQL result bindings into a graph structure { nodes, edges }.
   *
   * Strategy: look for column pairs that represent subject-object relationships.
   * Expects columns like: ?item/?itemLabel and ?parent/?parentLabel
   * or ?person/?personLabel and ?field/?fieldLabel, etc.
   *
   * We detect pairs by looking for columns with a matching "Label" column,
   * then create edges between each pair of entities found in a row.
   */
  function toGraph(bindings) {
    if (!bindings || bindings.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Discover entity columns: those that have a corresponding *Label column
    const allVars = Object.keys(bindings[0]);
    const entityVars = allVars.filter(
      (v) => !v.endsWith("Label") && allVars.includes(v + "Label")
    );

    if (entityVars.length < 2) {
      // Fallback: try to pair up URI-type columns
      const uriVars = allVars.filter(
        (v) => bindings[0][v] && bindings[0][v].type === "uri"
      );
      if (uriVars.length >= 2) {
        entityVars.length = 0;
        entityVars.push(...uriVars.slice(0, 2));
      }
    }

    const nodeMap = new Map(); // id => { id, label, uri, type }
    const edgeSet = new Set();
    const edges = [];

    for (const row of bindings) {
      // Collect entities from this row
      const entities = [];

      for (const v of entityVars) {
        const cell = row[v];
        if (!cell || cell.type !== "uri") continue;

        const id = extractId(cell.value);
        if (!id) continue;

        const labelCell = row[v + "Label"];
        const label = labelCell ? labelCell.value : id;

        if (!nodeMap.has(id)) {
          nodeMap.set(id, {
            id,
            label,
            uri: cell.value,
            type: v, // column name as type proxy
          });
        }

        entities.push({ id, varName: v });
      }

      // Create edges between consecutive entity pairs in the row
      for (let i = 0; i < entities.length - 1; i++) {
        const source = entities[i].id;
        const target = entities[i + 1].id;
        if (source === target) continue;

        const edgeKey = `${source}->${target}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            source,
            target,
            label: entities[i + 1].varName,
          });
        }
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }

  return { execute, toGraph, extractId };
})();
