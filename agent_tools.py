from langchain.tools import tool
from utils import search
import json
import os
from textwrap import dedent
import yt_dlp
import faiss
import torch
from sentence_transformers import SentenceTransformer

# === New Image Retrieval Logic ===
# Resolve paths relative to the project root to avoid hardcoded absolute paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FIGURE_JSON = os.path.join(PROJECT_ROOT, "output.json")
IMAGE_DIR = os.path.join(PROJECT_ROOT, "images")
FAISS_INDEX_FILE = os.path.join(PROJECT_ROOT, "subchapter_faiss.index")
METADATA_FILE = os.path.join(PROJECT_ROOT, "subchapter_metadata.json")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[DEBUG] agent_tools: Using device={device}")
try:
    image_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2").to(device)
    print("[DEBUG] agent_tools: Loaded sentence-transformers model all-MiniLM-L6-v2")
except Exception as e:
    print(f"[WARN] agent_tools: Failed to load sentence-transformers model: {e}")
    image_model = None

try:
    with open(FIGURE_JSON, "r", encoding="utf-8") as f:
        figures_data = json.load(f)
    print(f"[DEBUG] agent_tools: Loaded figures JSON from {FIGURE_JSON}, count={len(figures_data)}")
except Exception as e:
    print(f"[WARN] agent_tools: Could not read {FIGURE_JSON}: {e}")
    figures_data = []

try:
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        metadata_figures = json.load(f)
    print(f"[DEBUG] agent_tools: Loaded metadata JSON from {METADATA_FILE}, keys={len(metadata_figures)}")
except Exception as e:
    print(f"[WARN] agent_tools: Could not read {METADATA_FILE}: {e}")
    metadata_figures = {}

try:
    index_figures = faiss.read_index(FAISS_INDEX_FILE)
    print(f"[DEBUG] agent_tools: Loaded FAISS index from {FAISS_INDEX_FILE}")
except Exception as e:
    print(f"[WARN] agent_tools: Could not read FAISS index {FAISS_INDEX_FILE}: {e}")
    index_figures = None


def get_image_path(figure_ref, image_dir=IMAGE_DIR):
    base_name = figure_ref.replace(" ", "_")
    attempts = [
        f"{base_name}.png",
        f"{base_name}.jpg",
        f"figure_{base_name}.png"
    ]
    for attempt in attempts:
        test_path = os.path.join(image_dir, attempt)
        if os.path.exists(test_path):
            return test_path
    return None


def fetch_figures_only(subchapter_name):
    figures = [fig for fig in figures_data if fig["subchapter"] == subchapter_name]
    figure_blocks = []
    for fig in figures:
        fig_path = get_image_path(fig['figure'])
        if fig_path:
            figure_blocks.append({
                "name": fig['figure'],
                "path": fig_path,
                "desc": fig['description']
            })
    return figure_blocks


def search_subchapter_by_query(query, top_k=1):
    if image_model is None or index_figures is None or not metadata_figures:
        print("[DEBUG] agent_tools: search_subchapter_by_query skipped due to missing resources")
        return None
    query_embedding = image_model.encode([query], convert_to_numpy=True).astype('float32')
    _, indices = index_figures.search(query_embedding.reshape(1, -1), top_k)
    best_match_index = str(indices[0][0])
    result = metadata_figures.get(best_match_index, None)
    print(f"[DEBUG] agent_tools: search_subchapter_by_query -> {result}")
    return result


def fetch_images_for_topic(query):
    subchapter = search_subchapter_by_query(query)
    if not subchapter:
        return []
    return fetch_figures_only(subchapter)


def is_topic_in_syllabus(topic: str) -> bool:
    """
    Check if a topic is within the syllabus by searching the knowledge base.
    Returns True if topic is in syllabus, False otherwise.
    """
    print(f"[DEBUG] Checking if topic is in syllabus: {topic}")
    
    # Use the search function to check if topic exists in knowledge base
    results = search(topic, mode="hybrid", top_k=1)
    
    if not results:
        print(f"[DEBUG] Topic '{topic}' not found in syllabus")
        return False
    
    # Check if the result is the default "not found" response
    content = results[0]['content']
    if "Sorry, I couldn't find information for that topic" in content:
        print(f"[DEBUG] Topic '{topic}' not in syllabus (default response)")
        return False
    
    print(f"[DEBUG] Topic '{topic}' found in syllabus")
    return True


def determine_topic_type(topic: str) -> str:
    """
    Determine if topic is in syllabus, out of syllabus, or casual chat
    """
    # Simple heuristic for casual chat
    casual_indicators = ["hello", "hi", "how are you", "good morning", "good afternoon", "thanks", "thank you"]
    if any(indicator in topic.lower() for indicator in casual_indicators):
        return "casual"
    
    # Check if in syllabus
    if is_topic_in_syllabus(topic):
        return "in_syllabus"
    else:
        return "out_syllabus"


# === Tools ===

@tool
def knowledgebase_tool(query: str) -> str:
    """Retrieves explanations from the science textbook knowledge base."""
    print(f"[DEBUG] knowledgebase_tool called with query: {query}")
    results = search(query, mode="hybrid", top_k=1)
    if results:
        output = results[0]['content']
    else:
        output = "Sorry, I couldn't find information for that topic."
    return output


@tool
def image_tool(topic: str) -> str:
    """Fetches relevant figures and descriptive details for a science topic."""
    print(f"[DEBUG] image_tool called with topic: {topic}")
    results = fetch_images_for_topic(topic)
    if isinstance(results, str):
        output = results
    elif results:
        imgs = [f"{img['name']} — {img['desc']} (see: {img['path']})" for img in results]
        output = "\n".join(imgs)
    else:
        output = "No relevant images found."
    print(f"[DEBUG] image_tool output:\n{output}\n")
    return output


def fetch_animated_videos(topic, num_videos=1):
    search_query = f"ytsearch{num_videos}:{topic} explaination video for science students "
    ydl_opts = {
        "quiet": True,
        "extract_flat": True,
        "force_generic_extractor": True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(search_query, download=False)
        if "entries" in info and len(info["entries"]) > 0:
            video = info["entries"][0]
            if video.get("duration",361 ) <= 360:  # only pick videos ≤ 5 min
                url = f"https://www.youtube.com/watch?v={video['id']}"
                return {
                    "title": video["title"],
                    "url": url,
                    "id": video["id"]
                }
    return None


@tool
def video_tool(topic: str) -> str:
    """Finds short animated explainer videos for science concepts."""
    print(f"[DEBUG] video_tool called with topic: {topic}")
    
    if "youtube.com" in topic.lower() or "http" in topic.lower():
        output = "Skipping video search on likely video URL."
        print(f"[DEBUG] video_tool output:\n{output}\n")
        return output
    
    result = fetch_animated_videos(topic)
    if result:
        output = f"{result['title']} (YouTube: {result['url']})"
    else:
        output = "No animation video found for this topic."
    
    print(f"[DEBUG] video_tool output:\n{output}\n")
    return output