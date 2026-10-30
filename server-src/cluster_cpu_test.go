package main

import "testing"

func TestSampleClusterCPU(t *testing.T) {
	sample := func(id string, idle, busy float64) (float64, float64) {
		return sampleClusterCPU(id, []CPUMetric{{Mode: "idle", Value: idle}, {Mode: "user", Value: busy}, {Mode: "guest", Value: busy}})
	}
	if busy, total := sample(t.Name(), 80, 20); busy != 0 || total != 0 {
		t.Fatal("first sample must be unavailable")
	}
	if busy, total := sample(t.Name(), 150, 50); busy != 30 || total != 100 {
		t.Fatalf("got %v/%v, want 30/100", busy, total)
	}
	if busy, total := sample(t.Name(), 150, 50); busy != 30 || total != 100 {
		t.Fatal("identical scrape must retain the last utilization")
	}
	if busy, total := sample(t.Name(), 1, 1); busy != 0 || total != 0 {
		t.Fatal("counter reset must be unavailable")
	}
	if busy, total := sample(t.Name(), 1, 1); busy != 0 || total != 0 {
		t.Fatal("unchanged counters must be unavailable")
	}
}

func TestClusterCPUWeightsCapacityAcrossDifferentSamplingIntervals(t *testing.T) {
	sample := func(id string, cores int, idle, busy float64) (float64, float64) {
		metrics := &ParsedMetrics{CPU: []CPUMetric{{Mode: "idle", Value: idle}, {Mode: "user", Value: busy}}}
		metrics.System.NumCPUs = cores
		return sampleClusterCPUCapacity(t.Name()+id, metrics)
	}
	sample("healthy", 2, 100, 100)
	sample("recovering", 6, 100, 100)
	// Healthy node: 20% busy across one refresh. Recovered node: 80%
	// busy across ten refreshes. The longer interval must not add weight.
	healthyBusy, healthyCores := sample("healthy", 2, 180, 120)
	recoveringBusy, recoveringCores := sample("recovering", 6, 300, 900)
	percent := 100 * (healthyBusy + recoveringBusy) / (healthyCores + recoveringCores)
	if percent < 64.999 || percent > 65.001 {
		t.Fatalf("got %v%%, want capacity-weighted 65%%", percent)
	}
	if busy, cores := sample("cold", 4, 100, 100); busy != 0 || cores != 0 {
		t.Fatal("cold sample must not dilute utilization")
	}
	if busy, cores := sample("recovering", 6, 1, 1); busy != 0 || cores != 0 {
		t.Fatal("reset counters must not dilute utilization")
	}
	sample("no-cores", 0, 100, 100)
	if busy, cores := sample("no-cores", 0, 180, 120); busy != 0 || cores != 0 {
		t.Fatal("unknown CPU capacity must not contribute")
	}
}
