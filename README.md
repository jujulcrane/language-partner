# Talking Tanuki - Japanese Language Partner – Conversational AI Stuffed Animal

**A full-stack, hardware-integrated language learning companion for Japanese learners, powered by ESP32, cloud AI, and a cross-platform React Native app.**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Demo](#demo)
- [Hardware](#hardware)
- [Mobile App](#mobile-app)
- [Backend](#backend)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Roadmap](#development-roadmap)

## Overview

Japanese Language Partner (JLP) is an interactive, AI-powered stuffed animal designed to help Japanese learners practice speaking and listening in a natural, conversational way. The device uses an ESP32 microcontroller, high-quality microphone and speaker, and connects to cloud services for speech recognition, conversation AI, and text-to-speech. A companion React Native app allows users to view conversation logs, track progress, and customize their learning experience.

## Features

- **Real-time Japanese conversation** with natural voice input and output
- **JLPT level adaptation** (N5–N3) and grammar targeting
- **Conversation logging** and progress tracking
- **React Native mobile app** for settings, logs, and user feedback
- **Cloud-based AI** (STT, LLM, TTS) for accurate, personalized interaction
- **Portable, rechargeable hardware** embedded in a soft stuffed tanuki (Japanese raccoon dog)

## System Architecture

```
User speaks → Microphone (ESP32) → WiFi → Cloud Server
   → Speech-to-Text (STT, e.g. Whisper)
   → Conversation AI (LLM, e.g. GPT-4o)
   → Text-to-Speech (TTS, e.g. Google Cloud TTS)
   → Audio streamed back to ESP32 → Speaker → User hears response

Mobile app ↔ Firebase/Firestore ↔ Backend ↔ ESP32
```

## Demo

*Coming soon: video demo and screenshots.*

## Hardware

| Component                                   | Qty | Description                                  | Source                                            |
|----------------------------------------------|-----|----------------------------------------------|--------------------------------------------------------|
| ESP32-S3 DevKitC-1                          | 1   | Main microcontroller (WiFi, I2S, BT)         | Adafruit                                               |
| I2S MEMS Microphone (SPH0645LM4H)           | 1   | Digital audio input                          | Adafruit                                               |
| MAX98357A I2S Amplifier                     | 1   | Digital audio output to speaker              | Adafruit                                               |
| 3.7V 2500mAh LiPo Battery                   | 1   | Rechargeable power source                    | Adafruit                                               |
| Micro-Lipo Charger (MicroUSB)               | 1   | Battery charging                             | Adafruit                                               |
| 4Ω 3W Speaker (or 8Ω 1W for prototyping)    | 1   | Audio output                                 | Digi-Key/Adafruit                                      |
| MicroSD Card Module & 16GB MicroSD Card     | 1   | Removable storage                            | Amazon                                                 |
| Breadboard, wires, resistors, LEDs, buttons | 1ea | Prototyping and user feedback                | SparkFun/Amazon                                        |
| Stuffed Animal Shell                        | 1   | Physical enclosure                           | Amazon                                                 |


## Mobile App

- Built with **React Native**
- Features:
  - Device pairing and setup
  - Conversation log and playback
  - JLPT level and grammar settings
  - User authentication (Firebase)

## Backend

- Handles:
  - Audio streaming from ESP32
  - Calls to Speech-to-Text, AI, and TTS APIs
  - Conversation management and context
  - Communication with Firebase and the mobile app
- Built with Node.js and Express
- Deployable as serverless functions or on a cloud VM

## Database Schema

**Firestore Collections:**

| Collection      | Fields/Docs                                    | Description                        |
|-----------------|------------------------------------------------|------------------------------------|
| users           | displayName, email, jlptLevel, grammarTargets  | User profile and preferences       |
| conversations   | userId, startedAt, jlptLevel, messages         | Conversation sessions and logs     |
| progress        | grammar, vocabulary                            | Per-user learning progress         |
| settings        | notifications, theme                           | User-specific app settings         |


## Getting Started

### Hardware

1. Assemble the ESP32, microphone, amplifier, speaker, and power system on a breadboard.
2. Flash the ESP32 firmware from `/esp32-firmware`.
3. Connect to WiFi and test audio input/output.

### Backend

1. Install dependencies in `/backend`.
2. Set up API keys for STT, AI, and TTS providers.
3. Deploy backend (locally or to cloud).

### Mobile App

1. Install dependencies in `/`.
2. Set up Firebase project and configure in `/src/services/firebase.js`.
3. Run with `npx react-native run-ios` or `run-android`.

See `/docs/setup.md` for detailed instructions.

## Project Structure

```
/hardware           # Schematics, BOM, wiring diagrams
/esp32-firmware     # ESP32 code (C++/Arduino or ESP-IDF)
/backend            # Backend server/API code
/src                # React Native app source
/docs               # Documentation, setup guides
```

## Development Roadmap

- [x] Hardware prototype (audio I/O, WiFi)
- [x] Cloud backend (STT, AI, TTS integration)
- [x] React Native app (device pairing, logs)
- [ ] User progress dashboard
- [ ] Advanced grammar/vocab tracking
- [ ] Production-ready PCB design
- [ ] Demo video and deployment guide

**Impress employers by building a full-stack, hardware-integrated, AI-powered language learning companion—demonstrating skills in embedded systems, cloud, mobile, and user experience!**
