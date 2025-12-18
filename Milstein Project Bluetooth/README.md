# Talking Tanuki - Bluetooth Speaker Version

This is the **currently deployed** firmware on your ESP32 device. It's a simple Bluetooth A2DP audio receiver that turns your ESP32 into a wireless speaker.

## 🎯 What This Does

```
Phone (Talking Tanuki App) → Bluetooth → ESP32 → I2S Amplifier → Speaker
```

The phone app:
1. Captures audio from phone microphone
2. Sends to backend for AI processing
3. Receives TTS audio response
4. Plays audio via Bluetooth to ESP32

The ESP32:
1. Receives Bluetooth audio
2. Outputs to speaker via I2S
3. That's it! (DMA-driven, no code in loop)

## 📋 Hardware Requirements

- **ESP32** (any model with Bluetooth - ESP32, ESP32-S3, ESP32-C3, etc.)
- **I2S Audio Amplifier:** MAX98357A (recommended) or similar
- **Speaker:** 3-4 ohms, 3W recommended
- **Power:** 5V via USB or battery

## 🔌 Pin Connections

```
ESP32 GPIO 14 → MAX98357A BCLK (Bit Clock)
ESP32 GPIO 15 → MAX98357A LRC (Left/Right Clock)
ESP32 GPIO 22 → MAX98357A DIN (Data In)
ESP32 5V      → MAX98357A Vin
ESP32 GND     → MAX98357A GND

MAX98357A Speaker Outputs:
  - SPK+ → Speaker positive
  - SPK- → Speaker negative
```

## 📦 Required Libraries

### Arduino IDE
1. Open Arduino IDE
2. Go to **Tools → Manage Libraries**
3. Search and install:
   - **ESP32-AudioI2S** by Phil Schatzmann
   - **ESP32-A2DP** by Phil Schatzmann

### PlatformIO
Already configured in `platformio.ini`:
```ini
lib_deps =
    https://github.com/pschatzmann/arduino-audio-tools
    https://github.com/pschatzmann/ESP32-A2DP
```

## 🚀 How to Upload

### Arduino IDE
1. Connect ESP32 to computer via USB
2. **Tools → Board → ESP32 Dev Module** (or your specific ESP32 board)
3. **Tools → Port** → Select your ESP32's COM port
4. Click **Upload** button (→)
5. Wait for "Hard resetting via RTS pin..."

### PlatformIO (VSCode)
```bash
pio run --target upload
```

Or use the PlatformIO toolbar:
- Click "Upload" button (→)

## ✅ How to Test

1. **Power on ESP32**
2. **Open Bluetooth settings on your phone**
3. **Look for "TALKING TANUKI"** in available devices
4. **Connect to it**
5. **Open Talking Tanuki app**
6. **Speak** → AI responds → **Hear audio from ESP32 speaker**

## 🔧 Troubleshooting

### Device not showing up in Bluetooth
- Check ESP32 is powered on
- Wait 5-10 seconds after power on
- Try restarting ESP32
- Check if Bluetooth is enabled on phone

### No audio output
- Check speaker wiring (positive/negative)
- Verify I2S pins (GPIO 14, 15, 22)
- Test with another audio source (music app)
- Check amplifier power (5V connected)

### Audio is distorted/crackling
- Check power supply (USB cable quality)
- Try lower volume on phone
- Check speaker impedance (3-4 ohms recommended)
- Verify all GND connections

### Bluetooth disconnects frequently
- ESP32 might be too far from phone (>10m)
- Check power supply stability
- Try disabling WiFi to reduce interference:
  ```cpp
  WiFi.mode(WIFI_OFF);  // Add to setup()
  ```

## 📊 Comparison: Bluetooth vs WiFi Version

| Feature | **Bluetooth (This Version)** | **WiFi (Other Folder)** |
|---------|----------------------------|------------------------|
| **Microphone** | Phone microphone | INMP441 I2S microphone |
| **Processing** | Phone does all AI | ESP32 → Backend |
| **Connectivity** | Bluetooth only | WiFi only |
| **Range** | ~10 meters | WiFi network range |
| **Power** | Lower | Higher (WiFi radio) |
| **Code Size** | 15 lines | 300+ lines |
| **Status** | ✅ Working | 🚧 In progress |

## 🎨 Customization

### Change Bluetooth Device Name
```cpp
a2dp_sink.start("YOUR NAME HERE");
```

### Change I2S Pins
```cpp
cfg.pin_bck = 26;   // Your BCLK pin
cfg.pin_ws = 27;    // Your LRC pin
cfg.pin_data = 25;  // Your DIN pin
```

### Adjust Volume (if supported by amplifier)
Some amplifiers like MAX98357A support gain control:
- Connect GAIN pin to GND = 9dB gain
- Connect GAIN pin to VDD = 12dB gain
- Connect GAIN pin to GPIO = 15dB gain
- Leave GAIN floating = 3dB gain

## 📚 Technical Details

### Audio Specifications
- **Protocol:** Bluetooth A2DP (Advanced Audio Distribution Profile)
- **Codec:** SBC (SubBand Coding) - standard Bluetooth audio codec
- **Sample Rate:** 44.1 kHz (standard CD quality)
- **Bit Depth:** 16-bit
- **Latency:** ~100-200ms (typical Bluetooth latency)

### Memory Usage
- **Flash:** ~1.2 MB (program storage)
- **RAM:** ~50-80 KB (runtime memory)
- **PSRAM:** Not required

### Power Consumption
- **Idle:** ~80 mA @ 5V
- **Playing Audio:** ~150-250 mA @ 5V (depends on volume/speaker)
- **Speaker Amplifier:** Additional 50-500 mA (depends on volume)

## 🔗 Related Documentation

- [Complete Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
- [WiFi Version with Microphone](../Milstein%20Project/)
- [Main Project README](../README.md)

## 📝 License

Part of the Talking Tanuki project. See main project LICENSE.
