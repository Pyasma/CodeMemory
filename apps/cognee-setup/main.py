import asyncio
import json
import sys
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import cognee


def serialize(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, uuid.UUID):
        return str(value)

    if isinstance(value, Path):
        return str(value)

    if isinstance(value, dict):
        return {str(key): serialize(item) for key, item in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [serialize(item) for item in value]

    if hasattr(value, "model_dump"):
        return serialize(value.model_dump())

    if hasattr(value, "dict"):
        return serialize(value.dict())

    if hasattr(value, "__dict__"):
        return serialize(
            {
                key: item
                for key, item in value.__dict__.items()
                if not key.startswith("_")
            }
        )

    return str(value)


def first_text(data: dict[str, Any], *keys: str, default: str = "") -> str:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue

        if isinstance(value, str) and value.strip():
            return value

        if not isinstance(value, (dict, list, tuple, set)):
            return str(value)

    return default


def first_number(data: dict[str, Any], *keys: str, default: float = 1.0) -> float:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue

        try:
            return float(value)
        except (TypeError, ValueError):
            continue

    return default


def unwrap_recall_payload(payload: Any) -> list[Any]:
    serialized = serialize(payload)

    if isinstance(serialized, list):
        return serialized

    if isinstance(serialized, dict):
        for key in ("results", "items", "data", "entries", "response"):
            value = serialized.get(key)
            if isinstance(value, list):
                return value

        return [serialized]

    return [serialized]


def normalize_recall_entry(entry: Any, index: int) -> dict[str, Any]:
    if not isinstance(entry, dict):
        text = str(entry)
        return {
            "sourceType": "cognee",
            "sourceId": str(index),
            "title": f"Result {index + 1}",
            "content": text,
            "similarity": 1.0,
            "metadata": {},
        }

    content = first_text(
        entry,
        "content",
        "text",
        "answer",
        "context",
        "message",
        "summary",
        "chunk",
        "value",
        default=json.dumps(entry, ensure_ascii=False),
    )

    title = first_text(
        entry,
        "title",
        "name",
        "subject",
        "node_name",
        "source_name",
        "dataset_name",
        default=f"Result {index + 1}",
    )

    source_type = first_text(
        entry,
        "sourceType",
        "source_type",
        "kind",
        "source",
        "type",
        default="cognee",
    )

    source_id = first_text(
        entry,
        "sourceId",
        "source_id",
        "id",
        "node_id",
        default=f"cognee-{index + 1}",
    )

    similarity = first_number(
        entry,
        "similarity",
        "score",
        "relevance",
        "confidence",
        "weight",
    )

    metadata = {
        key: serialize(value)
        for key, value in entry.items()
        if key
        not in {
            "content",
            "text",
            "answer",
            "context",
            "message",
            "summary",
            "chunk",
            "value",
            "title",
            "name",
            "subject",
            "node_name",
            "source_name",
            "dataset_name",
            "sourceType",
            "source_type",
            "kind",
            "source",
            "type",
            "sourceId",
            "source_id",
            "id",
            "node_id",
            "similarity",
            "score",
            "relevance",
            "confidence",
            "weight",
        }
    }

    return {
        "sourceType": source_type or "cognee",
        "sourceId": source_id,
        "title": title,
        "content": content,
        "similarity": similarity,
        "metadata": metadata,
    }


async def sync_dataset(dataset_name: str, documents: list[str]) -> dict[str, Any]:
    try:
        await cognee.forget(dataset=dataset_name)
    except Exception:
        pass

    result = await cognee.remember(
        documents,
        dataset_name=dataset_name,
        run_in_background=False,
        self_improvement=False,
    )

    return {
        "datasetName": dataset_name,
        "documentsIndexed": len(documents),
        "result": serialize(result),
    }


async def recall_dataset(dataset_name: str, query: str, top_k: int) -> dict[str, Any]:
    result = await cognee.recall(
        query_text=query,
        datasets=[dataset_name],
        top_k=top_k,
        only_context=True,
        include_references=True,
        verbose=False,
    )

    entries = unwrap_recall_payload(result)
    hits = [normalize_recall_entry(entry, index) for index, entry in enumerate(entries)]

    return {
        "datasetName": dataset_name,
        "query": query,
        "hits": hits,
        "result": serialize(result),
    }


async def main() -> int:
    raw_input = sys.stdin.read().strip()

    if not raw_input:
        print(json.dumps({"ok": False, "error": "Missing JSON payload"}))
        return 1

    try:
        payload = json.loads(raw_input)
    except json.JSONDecodeError as error:
        print(
            json.dumps(
                {"ok": False, "error": f"Invalid JSON payload: {error.msg}"},
                ensure_ascii=False,
            )
        )
        return 1

    action = payload.get("action")

    try:
        if action == "sync":
            dataset_name = str(payload["datasetName"])
            documents = payload.get("documents", [])

            if not isinstance(documents, list):
                raise ValueError("documents must be a list")

            normalized_documents = [str(document) for document in documents]
            response = await sync_dataset(dataset_name, normalized_documents)
            print(json.dumps({"ok": True, **response}, ensure_ascii=False))
            return 0

        if action == "recall":
            dataset_name = str(payload["datasetName"])
            query = str(payload["query"])
            top_k = int(payload.get("topK", 5))

            response = await recall_dataset(dataset_name, query, top_k)
            print(json.dumps({"ok": True, **response}, ensure_ascii=False))
            return 0

        if action == "health":
            print(
                json.dumps(
                    {
                        "ok": True,
                        "version": getattr(cognee, "__version__", "unknown"),
                    },
                    ensure_ascii=False,
                )
            )
            return 0

        raise ValueError(f"Unsupported action: {action}")
    except Exception as error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": str(error),
                    "action": action,
                },
                ensure_ascii=False,
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
