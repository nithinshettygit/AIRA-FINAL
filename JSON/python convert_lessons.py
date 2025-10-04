import json

def convert_to_frontend_json(input_file, output_file):
    """
    Converts the knowledgebase.json file to the required frontend lessons format.
    """
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode the JSON file. Please check '{input_file}' for syntax errors.")
        print(f"Specific error: {e}")
        return

    frontend_structure = {"chapters": []}

    # Iterate through each chapter in the knowledgebase data
    for chapter_key, chapter_content in data.items():
        # Handle cases where the chapter title is a simple string like "1 CHAPTER" or has a "Name" field.
        chapter_number = chapter_key.split()[0]
        chapter_title = chapter_key
        if "Name" in chapter_content:
            chapter_title = chapter_content.get("Name")
        
        chapter_entry = {
            "chapter_number": chapter_number,
            "chapter_title": chapter_title,
            "subchapters": []
        }

        # Iterate through subchapters, ignoring special keys like "Name" and "content"
        for subchapter_title, subchapter_content in chapter_content.items():
            if subchapter_title not in ["Name", "content"]:
                subchapter_entry = {
                    "title": subchapter_title,
                    "children": []
                }
                chapter_entry["subchapters"].append(subchapter_entry)

        frontend_structure["chapters"].append(chapter_entry)

    # Save to the output file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(frontend_structure, f, indent=2, ensure_ascii=False)

    print(f"Converted JSON saved to {output_file}")


# Run conversion
if __name__ == "__main__":
    convert_to_frontend_json("knowledgebase.json", "frontend_lessons.json")