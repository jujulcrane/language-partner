/**
 * Talking Tanuki - Bluetooth Audio Sink
 *
 * Simple Bluetooth A2DP audio receiver that outputs to I2S speaker amplifier.
 * The phone app handles all AI processing, and this ESP32 just plays audio.
 *
 * Hardware:
 * - ESP32 (any model with Bluetooth)
 * - MAX98357A I2S amplifier (or similar)
 * - Speaker (3-4 ohms, 3W recommended)
 *
 * Pin Connections:
 * - GPIO 14 → BCLK (Bit Clock)
 * - GPIO 15 → LRC (Left/Right Clock / Word Select)
 * - GPIO 22 → DIN (Data In)
 * - 5V → Vin (amplifier power)
 * - GND → GND
 *
 * Libraries Required:
 * - ESP32-AudioI2S by Phil Schatzmann
 * - ESP32-A2DP by Phil Schatzmann
 *
 * Installation:
 * Arduino IDE: Tools → Manage Libraries → Search "ESP32-AudioI2S" and "ESP32-A2DP"
 * PlatformIO: See platformio.ini
 */

#include <AudioTools.h>
#include <BluetoothA2DPSink.h>

// Create I2S stream for audio output
I2SStream i2s;

// Create Bluetooth A2DP sink (receiver) that outputs to I2S
BluetoothA2DPSink a2dp_sink(i2s);

void setup() {
  // Configure I2S pins for MAX98357A or similar I2S amplifier
  auto cfg = i2s.defaultConfig();
  cfg.pin_bck = 14;   // BCLK to GPIO14
  cfg.pin_ws = 15;    // LRC to GPIO15
  cfg.pin_data = 22;  // DIN to GPIO22

  // Start I2S
  i2s.begin(cfg);

  // Start Bluetooth with device name "TALKING TANUKI"
  // This name will appear in phone's Bluetooth settings
  a2dp_sink.start("TALKING TANUKI");

  // No Serial output needed - device is fully autonomous
}

void loop() {
  /*
   * Nothing to do here!
   *
   * Bluetooth audio is handled by DMA (Direct Memory Access) in the background.
   * Audio data flows: Bluetooth → DMA → I2S → Speaker
   *
   * The ESP32 will automatically:
   * - Accept Bluetooth connections
   * - Receive audio data
   * - Output to I2S speaker
   * - Handle disconnections
   */
}
