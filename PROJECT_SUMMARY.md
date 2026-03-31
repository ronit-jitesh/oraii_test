# Clinical Co-Pilot: AI-Powered Clinical Documentation Assistant

## Abstract
**Clinical Co-Pilot** is a specialized web application designed to alleviate the documentation burden on healthcare providers by automating the creation of clinical notes from patient-doctor conversations. By leveraging cutting-edge Speech-to-Text and Large Language Model (LLM) technologies, the system transforms raw audio into structured, actionable medical records.

### Key Capabilities
- **Real-Time Medical Transcription**: Utilizes Deepgram’s `nova-2-medical` model to transcribe clinical dialogue with high specialized accuracy.
- **Intelligent Speaker Diarization**: Automatically distinguishes between "Speaker 0" and "Speaker 1" in real-time.
- **AI Role Identification**: Employs linguistic analysis via GPT-4o to dynamically determine the "Healthcare Provider" vs. the "Patient" based on conversational patterns.
- **Automated SOAP Note Generation**: Synthesizes the transcript into a structured **Subjective, Objective, Assessment, and Plan (SOAP)** format.
- **Clinical Entity Extraction**: Identifies and categorizes key medical data, including **Symptoms, Medications, Diagnoses, and Tests Ordered**.
- **Secure Data Management**: Features a secure authentication system and history workspace powered by Supabase, ensuring data persistence and HIPAA-ready privacy controls through Row Level Security (RLS).

### Problem Solved
Healthcare professionals currently spend significant hours on administrative documentation, detracting from patient care. Clinical Co-Pilot provides a "hands-free" documentation experience, allowing providers to focus entirely on the patient while the AI captures the clinical essence of the encounter.

### Tech Stack
- **Frontend**: Next.js (App Router, TypeScript, TailwindCSS)
- **Speech Engine**: Deepgram (Real-time Streaming)
- **Intelligence Layer**: OpenAI (GPT-4o)
- **Backend/Auth**: Supabase (PostgreSQL, RLS, Auth)
