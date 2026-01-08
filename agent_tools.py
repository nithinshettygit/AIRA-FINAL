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

def fetch_educational_videos(topic, num_videos=3):
    """
    Fetch educational science videos for older students.
    Focuses on clear scientific explanations rather than just animations.
    """
    print(f"[DEBUG] fetch_educational_videos searching for: {topic}")
    
    # Clean and prepare the topic
    cleaned_topic = clean_video_topic(topic)
    if not cleaned_topic:
        print("[DEBUG] Topic is empty after cleaning")
        return None
    
    # Search strategies for older students - focus on explanations
    search_strategies = [
        # Primary: direct scientific explanation
        f"{cleaned_topic} science explanation",
        # Secondary: educational channels
        f"{cleaned_topic} crash course",
        f"{cleaned_topic} khan academy",
        f"{cleaned_topic} ted ed",
        # Tertiary: broader educational search
        f"{cleaned_topic} educational video",
        f"{cleaned_topic} how it works",
        f"{cleaned_topic} documentary",
        # Fallback: simple explanation
        f"{cleaned_topic} explained"
    ]
    
    # Expanded list of reliable educational channels for older students
    reliable_channels = [
        "crash course", "khan academy", "ted-ed", "ted ed", "veritasium", 
        "vsauce", "sci show", "minute physics", "asap science", "pbs digital",
        "national geographic", "nova", "deep look", "smarter every day",
        "numberphile", "periodic videos", "sixty symbols", "the royal institution",
        "mit opencourseware", "stanford", "harvard", "nature video",
        "science magazine", "new scientist", "discovery channel", "history channel",
        "national geographic", "bbc earth", "bbc documentary", "it's okay to be smart",
        "physics girl", "scishow", "the science asylum", "fermilab", "nasa"
    ]
    
    seen_video_ids = set()
    
    for search_query in search_strategies:
        try:
            print(f"[DEBUG] Trying search: {search_query}")
            
            ydl_opts = {
                "quiet": True,
                "extract_flat": True,
                "force_generic_extractor": True,
                "socket_timeout": 30,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch{num_videos*2}:{search_query}", download=False)
                
                if "entries" in info and info["entries"]:
                    for video in info["entries"]:
                        if not video or not video.get('id'):
                            continue
                            
                        video_id = video['id']
                        if video_id in seen_video_ids:
                            continue
                            
                        seen_video_ids.add(video_id)
                        
                        # Check if video meets criteria for older students
                        if is_suitable_educational_video(video, cleaned_topic, reliable_channels):
                            url = f"https://www.youtube.com/watch?v={video_id}"
                            print(f"[DEBUG] Found suitable educational video: {video['title']}")
                            return {
                                "title": video["title"],
                                "url": url,
                                "id": video_id,
                                "channel": video.get('uploader', 'Unknown')
                            }
                            
        except Exception as e:
            print(f"[DEBUG] Search failed for '{search_query}': {e}")
            continue
    
    # Final attempt with relaxed criteria
    return try_educational_fallback(cleaned_topic, seen_video_ids)


def clean_video_topic(topic: str) -> str:
    """Clean and optimize the topic for video search."""
    if not topic:
        return ""
    
    # Remove common question phrases
    remove_phrases = [
        "what is", "what are", "explain", "tell me about", "can you teach",
        "i want to know about", "please explain", "define", "meaning of",
        "the concept of", "the process of", "how does", "how do", "why does",
        "can you explain", "could you explain", "would you explain"
    ]
    
    cleaned = topic.lower().strip()
    
    for phrase in remove_phrases:
        if cleaned.startswith(phrase):
            cleaned = cleaned[len(phrase):].strip()
            break
    
    # Remove punctuation and extra spaces
    import re
    cleaned = re.sub(r'[^\w\s]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned


def is_suitable_educational_video(video, topic, reliable_channels):
    """Check if a video is suitable for older students' educational purposes."""
    if not video or not video.get('title'):
        return False
    
    title = video['title'].lower()
    duration = video.get('duration', 361)
    channel = video.get('uploader', '').lower()
    
    # Duration check: prefer 1 minute to 20 minutes
    # Allow longer videos for reliable channels and complex topics
    if duration < 60:  # Too short for proper explanation
        return False
    
    # Check for reliable educational channels
    is_reliable_channel = any(channel_name in channel for channel_name in reliable_channels)
    
    if is_reliable_channel:
        # More lenient duration for trusted channels (up to 30 minutes)
        if duration <= 1800:  # 30 minutes for reliable channels
            return True
    
    # For other channels, check content quality
    # Look for educational indicators in title
    educational_indicators = [
        "explained", "explanation", "educational", "science", "how it works",
        "introduction to", "basics of", "fundamentals of", "principles of",
        "concept", "theory", "demonstration", "experiment", "documentary",
        "lecture", "tutorial", "guide", "overview", "understanding", "what is"
    ]
    
    has_educational_indicator = any(indicator in title for indicator in educational_indicators)
    
    # Check for topic relevance
    topic_words = set(topic.lower().split())
    topic_match_score = sum(1 for word in topic_words if len(word) > 3 and word in title)
    
    # Avoid unwanted content types
    unwanted_indicators = [
        "for kids", "for children", "preschool", "elementary", "baby",
        "nursery", "cartoon", "animated series", "song", "music video",
        "movie trailer", "review", "unboxing", "gaming", "vlog",
        "my opinion", "reaction", "prank", "comedy", "funny"
    ]
    
    has_unwanted = any(unwanted in title for unwanted in unwanted_indicators)
    
    # Advanced content indicators (we want to include these for older students)
    advanced_indicators = [
        "advanced", "college", "university", "phd", "quantum", "research",
        "conference", "graduate", "professional", "expert", "deep dive"
    ]
    
    has_advanced = any(advanced in title for advanced in advanced_indicators)
    
    # Final decision criteria
    suitable_duration = duration <= 1200  # 20 minutes max for non-reliable channels
    
    return (has_educational_indicator and 
            topic_match_score >= 1 and 
            not has_unwanted and 
            suitable_duration)


def try_educational_fallback(topic, seen_video_ids):
    """Final attempt to find any relevant educational video."""
    print(f"[DEBUG] Trying educational fallback for: {topic}")
    
    try:
        ydl_opts = {
            "quiet": True,
            "extract_flat": True,
            "force_generic_extractor": True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Broader search for educational content
            info = ydl.extract_info(f"ytsearch5:{topic} science educational", download=False)
            
            if "entries" in info and info["entries"]:
                for video in info["entries"]:
                    if not video or not video.get('id'):
                        continue
                    
                    video_id = video['id']
                    if video_id in seen_video_ids:
                        continue
                    
                    # Very relaxed criteria for final fallback
                    duration = video.get('duration', 361)
                    title = video.get('title', '').lower()
                    
                    # Basic checks: reasonable duration and some relevance
                    if (60 <= duration <= 2400 and  # 1-40 minutes
                        any(word in title for word in topic.lower().split() if len(word) > 3)):
                        url = f"https://www.youtube.com/watch?v={video_id}"
                        print(f"[DEBUG] Found fallback educational video: {video['title']}")
                        return {
                            "title": video["title"],
                            "url": url,
                            "id": video_id,
                            "channel": video.get('uploader', 'Unknown')
                        }
                        
    except Exception as e:
        print(f"[DEBUG] Educational fallback failed: {e}")
    
    return None


@tool
def video_tool(topic: str) -> str:
    """Finds educational science videos for older students."""
    print(f"[DEBUG] video_tool called with topic: {topic}")
    
    # Skip if input looks like a URL
    if any(domain in topic.lower() for domain in ["youtube.com", "youtu.be", "http://", "https://"]):
        output = "Skipping video search on likely video URL."
        print(f"[DEBUG] video_tool output:\n{output}\n")
        return output
    
    # Ensure we have a valid topic
    if not topic or len(topic.strip()) < 3:
        output = "Please provide a more specific topic for video search."
        print(f"[DEBUG] video_tool output:\n{output}\n")
        return output
    
    result = fetch_educational_videos(topic)
    
    if result:
        output = f"{result['title']} (YouTube: {result['url']})"
        print(f"[DEBUG] video_tool found educational video: {result['title']}")
    else:
        # Ultimate fallback - provide a reliable science education channel
        # Using Crash Course as a reliable source
        fallback_videos = {
            "biology": ("Introduction to Biology", "https://www.youtube.com/watch?v=Le1V3Tk4IY0"),
            "chemistry": ("Chemistry Fundamentals", "https://www.youtube.com/watch?v=5MI1gY1KQ6U"),
            "physics": ("Physics - Basic Introduction", "https://www.youtube.com/watch?v=b1t41Q3xRM8"),
            "astronomy": ("Introduction to Astronomy", "https://www.youtube.com/watch?v=Kq9z1q8qkOY"),
            "geology": ("Geology: Earth Systems", "https://www.youtube.com/watch?v=wlP-kgVlnpY")
        }
        
        # Try to match topic category
        topic_lower = topic.lower()
        matched_category = None
        for category in fallback_videos:
            if category in topic_lower:
                matched_category = category
                break
        
        if matched_category:
            title, url = fallback_videos[matched_category]
            output = f"{title} (YouTube: {url})"
        else:
            # Generic science fallback
            output = "Science Concepts Explained (YouTube: https://www.youtube.com/watch?v=2KZb2_vcNTg)"
        
        print(f"[DEBUG] video_tool using educational fallback")
    
    print(f"[DEBUG] video_tool output:\n{output}\n")
    return output