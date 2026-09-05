"""
RAG Knowledge Loader
Loads markdown documents from the knowledge directory.
"""
import os
import re
from pathlib import Path
from typing import List, Dict, Any


def load_knowledge_documents(knowledge_dir: str = "data/knowledge") -> List[Dict[str, Any]]:
    """
    Load all knowledge base markdown files.
    Returns a list of document dicts with id, title, category, content, and metadata.
    """
    documents = []
    knowledge_path = Path(knowledge_dir)

    if not knowledge_path.exists():
        return documents

    for md_file in sorted(knowledge_path.glob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        doc = _parse_document(md_file.stem, content)
        documents.append(doc)

    return documents


def _parse_document(filename: str, content: str) -> Dict[str, Any]:
    """Parse a markdown document and extract metadata from frontmatter-style headers."""
    article_id = filename.replace("_", "-").upper()

    # Extract metadata from known patterns in the content
    title = _extract_field(content, "# ", first_line=True) or article_id
    category = _extract_metadata_field(content, "Category")
    version = _extract_metadata_field(content, "Version")
    effective_date = _extract_metadata_field(content, "Effective Date")
    last_updated = _extract_metadata_field(content, "Last Updated")
    summary = _extract_summary(content)

    return {
        "id": article_id,
        "filename": filename,
        "title": title,
        "category": category or "General",
        "version": version or "1.0",
        "effective_date": effective_date or "",
        "last_updated": last_updated or "",
        "summary": summary or "",
        "content": content,
        "content_length": len(content),
    }


def _extract_field(content: str, prefix: str, first_line: bool = False) -> str:
    """Extract text after a prefix (e.g., '# ' for the title)."""
    lines = content.split("\n")
    for line in lines:
        if line.startswith(prefix):
            return line[len(prefix):].strip()
        if first_line and line.strip():
            break
    return ""


def _extract_metadata_field(content: str, field_name: str) -> str:
    """Extract a metadata field from the formatted lines like '**Category:** Billing'."""
    pattern = rf"\*\*{field_name}:\*\*\s*(.+)"
    match = re.search(pattern, content)
    if match:
        return match.group(1).strip()
    return ""


def _extract_summary(content: str) -> str:
    """Extract the summary section text."""
    match = re.search(r"## Summary\s+(.+?)(?=\n##|\Z)", content, re.DOTALL)
    if match:
        # Clean up the extracted text
        text = match.group(1).strip()
        # Limit to first 300 chars for summary
        return text[:300].replace("\n", " ")
    return ""
