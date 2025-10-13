from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from agent import ask_agent #
import uuid
import os
from fastapi.staticfiles import StaticFiles
from tempfile import NamedTemporaryFile
import subprocess
import shutil

# Optional local transcription deps
LOCAL_WHISPER = os.environ.get("LOCAL_WHISPER", "0") == "1"
try:
    if LOCAL_WHISPER:
        from faster_whisper import WhisperModel  # type: ignore
except Exception:
    WhisperModel = None  # type: ignore

try:
    # openai==2.x client
    from openai import OpenAI  # type: ignore
except Exception:
    OpenAI = None  # Fallback if not installed

# Optional SpeechRecognition + pydub fallback
try:
    import speech_recognition as sr  # type: ignore
    from pydub import AudioSegment  # type: ignore
except Exception:
    sr = None  # type: ignore
    AudioSegment = None  # type: ignore

app = FastAPI(
    title="AI Science Teacher",
    version="1.0",
    description="A FastAPI server for the AI Science Teacher LangChain agent."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust this in production for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve images statically from the project's images folder
IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
if os.path.isdir(IMAGES_DIR):
    print(f"[DEBUG] Static images directory mounted at /images -> {IMAGES_DIR}")
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")
else:
    print(f"[WARN] Images directory not found: {IMAGES_DIR}")

@app.get("/")
def home():
    return {"message": "AI Science Teacher Backend is running!"}

class ChatRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None
    interruption_context: Optional[str] = ""


@app.post("/chat")
def chat(
    # Prefer JSON body from frontend; keep query params as a backward-compatible fallback
    body: Optional[ChatRequest] = Body(default=None),
    query: Optional[str] = None,
    thread_id: Optional[str] = None,
    interruption_context: Optional[str] = "",
):
    """
    Handles user queries and routes them to the AI Teacher Agent.
    Accepts either a JSON body or query parameters for backward compatibility.
    Always returns a 200 with a friendly message so the frontend doesn't show a generic error.
    """
    try:
        # Merge inputs with body taking precedence
        effective_query = (body.query if body and body.query is not None else query) or ""
        effective_thread_id = (body.thread_id if body and body.thread_id else thread_id) or str(uuid.uuid4())
        effective_interruption = (
            body.interruption_context if body and body.interruption_context is not None else interruption_context or ""
        )

        if not effective_query.strip():
            return {"response": "Please provide a question to ask the AI Teacher."}

        if effective_interruption:
            full_query = (
                f"Before we paused, we were discussing: '{effective_interruption}'. "
                f"A student asked: '{effective_query}'. "
                f"Please answer the question clearly and then smoothly continue the lesson from there."
            )
        else:
            full_query = effective_query

        response = ask_agent(full_query, thread_id=effective_thread_id) #
        return {"response": response}
    except Exception as exc:  # noqa: BLE001 - surface a friendly message to UI
        # Keep status 200 so the UI shows the message instead of a generic fallback
        return {"response": f"Sorry, something went wrong handling your request: {exc}"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio using OpenAI Whisper (if OPENAI_API_KEY is set).
    Accepts multipart/form-data with field name 'file'. Returns JSON: { text: str }.
    """
    try:
        suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # Prefer local faster-whisper if enabled
            if LOCAL_WHISPER:
                if WhisperModel is None:
                    raise HTTPException(status_code=500, detail="faster-whisper not available on server")
                model_name = os.environ.get("LOCAL_WHISPER_MODEL", "base.en")
                device = os.environ.get("LOCAL_WHISPER_DEVICE", "cpu")
                compute_type = os.environ.get("LOCAL_WHISPER_COMPUTE", "int8")
                print(f"[TRANSCRIBE] Using local faster-whisper model={model_name} device={device} compute={compute_type}")
                model = WhisperModel(model_name, device=device, compute_type=compute_type)
                segments, info = model.transcribe(
                    tmp_path,
                    beam_size=5,
                    temperature=0,
                    language="en",
                )
                try:
                    print(f"[TRANSCRIBE] faster-whisper language={getattr(info, 'language', None)} duration={getattr(info, 'duration', None)}s")
                except Exception:
                    pass
                text = " ".join([s.text.strip() for s in segments if s.text])
                return {"text": text.strip()}

            # Otherwise try OpenAI Whisper API if key present
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key and OpenAI is not None:
                client = OpenAI(api_key=api_key)
                model_name = os.environ.get("OPENAI_TRANSCRIBE_MODEL", "whisper-1")
                with open(tmp_path, "rb") as audio_f:
                    result = client.audio.transcriptions.create(  # type: ignore[attr-defined]
                        model=model_name,
                        file=audio_f,
                        response_format="json",
                        temperature=0
                    )
                text = getattr(result, "text", None) or (result.get("text") if isinstance(result, dict) else None)
                if not text:
                    raise HTTPException(status_code=502, detail="Transcription service returned no text")
                return {"text": text}

            # Finally, use SpeechRecognition (Google Web Speech, no key) as a simple fallback
            if sr is None or AudioSegment is None:
                raise HTTPException(status_code=500, detail="SpeechRecognition/pydub not available on server")

            # Convert to WAV with pydub (requires ffmpeg installed on system PATH)
            wav_tmp = tmp_path + ".wav"
            try:
                audio_seg = AudioSegment.from_file(tmp_path)
                audio_seg = audio_seg.set_channels(1).set_frame_rate(16000)
                # Normalize loudness to improve ASR (target ~ -20 dBFS)
                try:
                    target_dbfs = -20.0
                    if audio_seg.dBFS != float("-inf"):
                        gain = target_dbfs - float(audio_seg.dBFS)
                        audio_seg = audio_seg.apply_gain(gain)
                        print(f"[SR] Loudness normalization applied: dBFS_before={float(audio_seg.dBFS)-gain:.1f} gain={gain:.1f}dB")
                except Exception:
                    pass
                audio_seg.export(wav_tmp, format="wav")
                try:
                    print(f"[SR] Converted to wav: duration_ms={len(audio_seg)}")
                except Exception:
                    pass
            except Exception as conv_exc:
                raise HTTPException(status_code=500, detail=f"Audio conversion failed (ffmpeg required): {conv_exc}")

            # If the audio is extremely quiet even after normalization, try ffmpeg CLI with strong normalization
            try:
                need_ffmpeg_boost = False
                try:
                    if audio_seg.dBFS == float("-inf") or float(audio_seg.dBFS) < -50:
                        need_ffmpeg_boost = True
                except Exception:
                    pass
                if need_ffmpeg_boost and shutil.which("ffmpeg"):
                    boosted_wav = tmp_path + ".boost.wav"
                    cmd = [
                        "ffmpeg", "-y", "-i", tmp_path,
                        "-ac", "1", "-ar", "16000",
                        "-af", "loudnorm=I=-18:TP=-1.5:LRA=11",
                        boosted_wav
                    ]
                    try:
                        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        wav_tmp = boosted_wav
                        print("[SR] Applied ffmpeg loudnorm boost via CLI")
                    except Exception:
                        pass
            except Exception:
                pass

            rec = sr.Recognizer()
            lang = os.environ.get("GOOGLE_SPEECH_LANG", "en-US")
            with sr.AudioFile(wav_tmp) as source:
                # Match sample: 1s ambient calibration
                rec.adjust_for_ambient_noise(source, duration=1.0)
                # Make detection a bit more permissive
                rec.pause_threshold = 0.6
                rec.dynamic_energy_threshold = True
                # Record the whole clip (frontend already limits length)
                audio_data = rec.record(source)
            try:
                # First attempt with configured language, request alternatives
                result = rec.recognize_google(audio_data, language=lang, show_all=True)  # type: ignore[call-arg]
                text = ""
                if isinstance(result, dict):
                    alts = result.get("alternative") or []
                    if isinstance(alts, list) and len(alts) > 0:
                        best = alts[0]
                        text = best.get("transcript", "")
                elif isinstance(result, str):
                    text = result
                if not text:
                    raise sr.UnknownValueError  # type: ignore[attr-defined]
            except sr.UnknownValueError:  # type: ignore[attr-defined]
                print("[SR] Google recognizer could not understand audio with lang=", lang)
                # Retry with common English variants
                text = ""
                for fallback_lang in ["en-IN", "en-US", "en-GB"]:
                    if fallback_lang == lang:
                        continue
                    try:
                        text_try = rec.recognize_google(audio_data, language=fallback_lang)
                        if text_try:
                            print(f"[SR] Fallback language succeeded: {fallback_lang}")
                            text = text_try
                            break
                    except Exception:
                        continue
            except sr.RequestError as e:  # type: ignore[attr-defined]
                raise HTTPException(status_code=502, detail=f"Google SR request error: {e}")
            finally:
                try:
                    os.remove(wav_tmp)
                except Exception:
                    pass
            return {"text": text}
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
    except HTTPException:
        raise
    except Exception as exc:
        return {"text": "", "error": f"Transcription failed: {exc}"}