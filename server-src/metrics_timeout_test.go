package main

import (
	"testing"
	"time"
)

func TestMetricsTimeoutConfiguration(t *testing.T) {
	for _, tc := range []struct {
		value string
		want  time.Duration
	}{
		{"", 5 * time.Second}, {"2", 2 * time.Second}, {"0.25", 250 * time.Millisecond},
		{"150ms", 150 * time.Millisecond}, {"1m", time.Minute},
		{"0", 5 * time.Second}, {"-1s", 5 * time.Second}, {"invalid", 5 * time.Second},
	} {
		t.Run(tc.value, func(t *testing.T) {
			t.Setenv("DSD_METRICS_TIMEOUT", tc.value)
			if got := metricsTimeout(); got != tc.want {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
		})
	}
}
