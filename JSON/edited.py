import json
import re

def build_hierarchy(subchapters):
    """
    Takes a flat list of subchapters and nests them based on numbering like 1.1, 1.1.1, etc.
    """
    chapter_tree = []

    # Helper dict to quickly find parents by numbering
    lookup = {}

    for sub in subchapters:
        title = sub["title"].strip()
        match = re.match(r"^(\d+(\.\d+)*)", title)  # captures 1, 1.1, 1.1.1, etc.
        if not match:
            # No numbering → top level
            chapter_tree.append({"title": title, "children": []})
            continue

        number = match.group(1)
        parts = number.split(".")

        # Top-level (like 1.1, 2.3, etc.)
        if len(parts) == 2:
            node = {"title": title, "children": []}
            chapter_tree.append(node)
            lookup[number] = node

        # Nested (like 1.1.1, 1.2.3, etc.)
        else:
            parent_number = ".".join(parts[:-1])
            parent = lookup.get(parent_number)
            if parent:
                node = {"title": title, "children": []}
                parent["children"].append(node)
                lookup[number] = node
            else:
                # Fallback: treat as top-level
                node = {"title": title, "children": []}
                chapter_tree.append(node)
                lookup[number] = node

    return chapter_tree

def clean_and_nest(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    for chapter in data["chapters"]:
        # Clean chapter title
        chapter["chapter_title"] = chapter["chapter_title"].strip()

        # Rebuild subchapter hierarchy
        chapter["subchapters"] = build_hierarchy(chapter["subchapters"])

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Cleaned & nested JSON saved to {output_file}")

if __name__ == "__main__":
    clean_and_nest("frontend_lessons.json", "frontend_nested.json")
