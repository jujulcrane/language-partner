#include "microphone.h"

#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0
#define BUFFER_SIZE 1024

static int32_t i2s_buffer[BUFFER_SIZE];

void mic_setup()
{
  i2s_config_t i2s_config = {
      .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = 16000,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_I2S,
      .intr_alloc_flags = 0,
      .dma_buf_count = 4,
      .dma_buf_len = BUFFER_SIZE,
      .use_apll = false,
      .tx_desc_auto_clear = false,
      .fixed_mclk = 0};

  i2s_pin_config_t pin_config = {
      .bck_io_num = I2S_SCK,
      .ws_io_num = I2S_WS,
      .data_out_num = -1,
      .data_in_num = I2S_SD};

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_start(I2S_PORT);

  Serial.println("I2S Microphone initialized");
}

void mic_read_and_print()
{
  size_t bytes_read = 0;
  esp_err_t result = i2s_read(I2S_PORT, (void *)i2s_buffer, sizeof(i2s_buffer), &bytes_read, portMAX_DELAY);
  if (result == ESP_OK && bytes_read > 0)
  {
    int samples_read = bytes_read / sizeof(int32_t);
    Serial.print("Samples: ");
    for (int i = 0; i < min(samples_read, 10); i++)
    {
      Serial.print(i2s_buffer[i]);
      Serial.print(" ");
    }
    Serial.println();
  }
}
