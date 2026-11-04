package main

import "testing"

func TestLogChannelSizeConfiguration(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  int
	}{
		{name: "default", want: defaultLogChannelSize},
		{name: "configured", value: "128", want: 128},
		{name: "trimmed", value: " 256 ", want: 256},
		{name: "invalid", value: "many", want: defaultLogChannelSize},
		{name: "zero", value: "0", want: defaultLogChannelSize},
		{name: "negative", value: "-1", want: defaultLogChannelSize},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("DSD_LOG_BUFFER_SIZE", tt.value)
			if got := logChannelSize(); got != tt.want {
				t.Fatalf("logChannelSize() = %d, want %d", got, tt.want)
			}
		})
	}
}
