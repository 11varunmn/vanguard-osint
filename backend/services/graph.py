"""
Graph Analysis Service
-----------------------
Manages the Neo4j knowledge graph: nodes, edges, cluster detection.
"""

from typing import Optional
from core.neo4j import get_neo4j


# ─── Node / Edge Writers ──────────────────────────────────────────────────────

async def upsert_account_node(case_id: str, handle: str, platform: str, props: dict = {}):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            """
            MERGE (a:Account {handle: $handle, platform: $platform, case_id: $case_id})
            SET a += $props, a.updated_at = datetime()
            """,
            handle=handle, platform=platform, case_id=case_id, props=props,
        )


async def upsert_hashtag_node(case_id: str, tag: str):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            "MERGE (h:Hashtag {tag: $tag, case_id: $case_id})",
            tag=tag, case_id=case_id,
        )


async def upsert_platform_node(name: str):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            "MERGE (p:Platform {name: $name})",
            name=name,
        )


async def add_account_platform_edge(case_id: str, handle: str, platform: str):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            """
            MATCH (a:Account {handle: $handle, case_id: $case_id})
            MERGE (p:Platform {name: $platform})
            MERGE (a)-[:USES_PLATFORM]->(p)
            """,
            handle=handle, case_id=case_id, platform=platform,
        )


async def add_similarity_edge(
    case_id: str,
    handle_a: str,
    platform_a: str,
    handle_b: str,
    platform_b: str,
    score: float,
    run_ref: str,
):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            """
            MATCH (a:Account {handle: $ha, platform: $pa, case_id: $case_id})
            MATCH (b:Account {handle: $hb, platform: $pb, case_id: $case_id})
            MERGE (a)-[r:STYLOMETRIC_MATCH {run_ref: $run_ref}]->(b)
            SET r.score = $score, r.created_at = datetime()
            """,
            ha=handle_a, pa=platform_a,
            hb=handle_b, pb=platform_b,
            case_id=case_id, score=score, run_ref=run_ref,
        )


async def add_interaction_edge(
    case_id: str,
    from_handle: str,
    from_platform: str,
    to_handle: str,
    to_platform: str,
    edge_type: str,  # REPLIES_TO | MENTIONS | SHARES | FOLLOWS
    metadata: dict = {},
):
    driver = await get_neo4j()
    async with driver.session() as session:
        await session.run(
            f"""
            MATCH (a:Account {{handle: $fh, platform: $fp, case_id: $case_id}})
            MERGE (b:Account {{handle: $th, platform: $tp, case_id: $case_id}})
            MERGE (a)-[r:{edge_type}]->(b)
            SET r += $meta, r.updated_at = datetime()
            """,
            fh=from_handle, fp=from_platform,
            th=to_handle, tp=to_platform,
            case_id=case_id, meta=metadata,
        )


# ─── Graph Queries ────────────────────────────────────────────────────────────

async def get_case_graph(case_id: str) -> dict:
    """Return full node/edge set for a case — ready for frontend visualisation."""
    driver = await get_neo4j()
    async with driver.session() as session:
        # Nodes
        node_result = await session.run(
            """
            MATCH (n {case_id: $case_id})
            RETURN labels(n) AS labels, properties(n) AS props
            """,
            case_id=case_id,
        )
        nodes = []
        async for record in node_result:
            nodes.append({
                "labels": record["labels"],
                "props": dict(record["props"]),
            })

        # Edges
        edge_result = await session.run(
            """
            MATCH (a {case_id: $case_id})-[r]->(b {case_id: $case_id})
            RETURN
              a.handle AS source,
              b.handle AS target,
              type(r) AS rel_type,
              properties(r) AS props
            """,
            case_id=case_id,
        )
        edges = []
        async for record in edge_result:
            edges.append({
                "source": record["source"],
                "target": record["target"],
                "type": record["rel_type"],
                "props": dict(record["props"]),
            })

    return {"nodes": nodes, "edges": edges}


async def find_clusters(case_id: str) -> list:
    """
    Detect connected components (clusters) in the case graph.
    Returns list of clusters, each as a list of node handles.
    """
    driver = await get_neo4j()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH (a:Account {case_id: $case_id})-[*1..3]-(b:Account {case_id: $case_id})
            WHERE a <> b
            WITH a, collect(DISTINCT b.handle) AS connected
            RETURN a.handle AS node, connected
            ORDER BY size(connected) DESC
            LIMIT 20
            """,
            case_id=case_id,
        )
        clusters = []
        async for record in result:
            clusters.append({
                "node": record["node"],
                "connected_to": record["connected"],
                "cluster_size": len(record["connected"]) + 1,
            })
    return clusters


async def find_bridge_nodes(case_id: str) -> list:
    """Find accounts that connect otherwise-separate clusters."""
    driver = await get_neo4j()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH (a:Account {case_id: $case_id})-[r]-()
            WITH a, count(r) AS degree
            WHERE degree >= 3
            RETURN a.handle AS handle, a.platform AS platform, degree
            ORDER BY degree DESC
            LIMIT 10
            """,
            case_id=case_id,
        )
        bridges = []
        async for record in result:
            bridges.append({
                "handle": record["handle"],
                "platform": record["platform"],
                "degree": record["degree"],
            })
    return bridges
