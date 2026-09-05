import os
import asyncio
import subprocess
import imageio_ffmpeg
import edge_tts

ARTIFACTS_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\34a3b6c2-bcc5-4920-81a6-aaee05cd5dd9"
PROJECT_DIR = r"d:\Nexus_TIQ_Hackthonn"

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# Define narration script for each section matching compile_demo_video.py timings
# Total video duration: 230 seconds (3 minutes 50 seconds)
SECTIONS = [
    {
        "id": 1,
        "name": "Dashboard Overview",
        "duration": 20,
        "text": (
            "Welcome to Resolve IQ, an AI-powered Customer Support Resolution Assistant built for Track PS04. "
            "Here on our Executive Dashboard, customer operations leaders get real-time visibility into active case volumes, "
            "SLA compliance rates, resolution time metrics, AI automation success rates, and customer sentiment distribution."
        )
    },
    {
        "id": 2,
        "name": "Cases Inbox",
        "duration": 25,
        "text": (
            "Navigating to the Active Support Cases Inbox, customer support agents view incoming tickets prioritized by "
            "AI urgency scoring, complexity tier, and SLA risk. Each case card displays real-time status updates, "
            "issue categories, and assigned priority levels for seamless workflow management."
        )
    },
    {
        "id": 3,
        "name": "Case 1001 Overview",
        "duration": 30,
        "text": (
            "Opening Case 1001, we inspect a routine customer inquiry regarding subscription billing and plan upgrades. "
            "The workspace displays complete conversation history, user account details, transaction records, "
            "and previous support interactions on the left, giving agents full context at a single glance."
        )
    },
    {
        "id": 4,
        "name": "Case 1001 Resolution Intelligence & RAG",
        "duration": 60,
        "text": (
            "Clicking Analyze Case activates Resolve IQ's Grounded RAG intelligence powered by Google Gemini. "
            "In seconds, the system synthesizes exact policy documentation, retrieves relevant knowledge base articles, "
            "identifies the underlying root cause, and generates a structured resolution plan with verbatim policy citations. "
            "Support agents can review the AI recommendation, verify cited sources, edit the draft response, "
            "and approve the resolution with full audit logging and transparency."
        )
    },
    {
        "id": 5,
        "name": "Case 1003 Contradiction & Escalation",
        "duration": 60,
        "text": (
            "Now let's examine Case 1003—a complex scenario involving conflicting customer statements and policy rules. "
            "Resolve IQ's built-in guardrails detect factual contradictions between user claims and backend database records. "
            "Rather than producing uncertain or hallucinated answers, the AI automatically highlights the contradiction, "
            "generates a comprehensive Human Handoff Brief, and escalates the ticket to a senior specialist with complete context."
        )
    },
    {
        "id": 6,
        "name": "System Health & Governance",
        "duration": 25,
        "text": (
            "Moving to the System Health and Governance dashboard, judges and administrators can monitor vector database embedding metrics, "
            "Gemini model response latencies, contradiction detection accuracy, and end-to-end pipeline health in real time."
        )
    },
    {
        "id": 7,
        "name": "Conclusion",
        "duration": 10,
        "text": (
            "Resolve IQ transforms customer operations with grounded AI intelligence, human-in-the-loop workflows, "
            "and robust safety. Thank you for watching!"
        )
    }
]

TEMP_DIR = os.path.join(PROJECT_DIR, "temp_audio")
os.makedirs(TEMP_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"

async def generate_speech():
    print("Generating speech audio files using Edge-TTS...")
    for section in SECTIONS:
        sec_id = section["id"]
        text = section["text"]
        out_file = os.path.join(TEMP_DIR, f"sec_{sec_id}.mp3")
        print(f"Generating Section {sec_id}: {section['name']}...")
        communicate = edge_tts.Communicate(text, VOICE, rate="+3%")
        await communicate.save(out_file)
        print(f"[OK] Saved {out_file}")

def get_audio_duration(file_path):
    """Run ffprobe/ffmpeg to get duration of audio file in seconds."""
    cmd = [
        FFMPEG_EXE, "-i", file_path
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    # Parse duration line: Duration: 00:00:15.24
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            return float(h)*3600 + float(m)*60 + float(s)
    return 0.0

def build_composite_audio():
    print("\nBuilding synced composite audio track...")
    start_times = [0, 20, 45, 75, 135, 195, 220]
    
    input_args = []
    filter_parts = []
    mix_inputs = []
    
    for idx, section in enumerate(SECTIONS):
        sec_id = section["id"]
        file_path = os.path.join(TEMP_DIR, f"sec_{sec_id}.mp3")
        dur = get_audio_duration(file_path)
        start_ms = int(start_times[idx] * 1000)
        print(f"Section {sec_id} ({section['name']}): duration = {dur:.2f}s, start_time = {start_times[idx]}s")
        
        input_args.extend(["-i", file_path])
        filter_parts.append(f"[{idx}:a]adelay={start_ms}|{start_ms}[a{idx}]")
        mix_inputs.append(f"[a{idx}]")
    
    filter_complex = ";".join(filter_parts) + f";{''.join(mix_inputs)}amix=inputs={len(SECTIONS)}:duration=longest:dropout_transition=0[aout]"
    
    master_audio = os.path.join(TEMP_DIR, "master_narration.mp3")
    cmd = [
        FFMPEG_EXE, "-y"
    ] + input_args + [
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        master_audio
    ]
    
    print("\nRunning ffmpeg audio mix...")
    subprocess.run(cmd, check=True)
    print(f"[OK] Master narration created: {master_audio}")
    return master_audio

def merge_video_audio(master_audio):
    # First re-compile raw video if needed to ensure 3:50 duration
    subprocess.run(["python", "scripts/compile_demo_video.py"], check=True)
    raw_video = os.path.join(ARTIFACTS_DIR, "ResolveIQ_Hackathon_Demo.mp4")
    final_output = os.path.join(PROJECT_DIR, "ResolveIQ_Hackathon_Demo_Voiced.mp4")
    artifact_output = os.path.join(ARTIFACTS_DIR, "ResolveIQ_Hackathon_Demo.mp4")
    local_final = os.path.join(PROJECT_DIR, "ResolveIQ_Hackathon_Demo.mp4")
    
    print("\nMuxing 3m50s raw video and narration audio...")
    cmd = [
        FFMPEG_EXE, "-y",
        "-i", raw_video,
        "-i", master_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        final_output
    ]
    subprocess.run(cmd, check=True)
    print(f"[OK] Voiced video generated: {final_output}")
    
    # Overwrite main local file and artifact file with voiced video
    import shutil
    shutil.copyfile(final_output, local_final)
    shutil.copyfile(final_output, artifact_output)
    print(f"[OK] Replaced demo video in local workspace: {local_final}")
    print(f"[OK] Replaced demo video in artifacts folder: {artifact_output}")

if __name__ == "__main__":
    asyncio.run(generate_speech())
    master_audio = build_composite_audio()
    merge_video_audio(master_audio)
    print("\n[SUCCESS] ALL DONE! Explanation audio narration added successfully to ResolveIQ_Hackathon_Demo.mp4!")
