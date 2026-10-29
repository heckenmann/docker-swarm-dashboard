package main

import "sync"

var clusterCPUSamples = struct {
	sync.Mutex
	values map[string][4]float64
}{values: make(map[string][4]float64)}

// sampleClusterCPU derives utilization from counter changes between observations.
func sampleClusterCPU(nodeID string, metrics []CPUMetric) (float64, float64) {
	var total, idle float64
	for _, metric := range metrics {
		if metric.Mode == "guest" || metric.Mode == "guest_nice" {
			continue
		}
		total += metric.Value
		if metric.Mode == "idle" {
			idle += metric.Value
		}
	}
	clusterCPUSamples.Lock()
	defer clusterCPUSamples.Unlock()
	previous, exists := clusterCPUSamples.values[nodeID]
	delta, idleDelta := total-previous[0], idle-previous[1]
	if exists && delta == 0 && idleDelta == 0 {
		return previous[2], previous[3]
	}
	clusterCPUSamples.values[nodeID] = [4]float64{total, idle, 0, 0}
	if !exists || delta <= 0 || idleDelta < 0 || idleDelta > delta {
		return 0, 0
	}
	clusterCPUSamples.values[nodeID] = [4]float64{total, idle, delta - idleDelta, delta}
	return delta - idleDelta, delta
}

// sampleClusterCPUCapacity weights each node by CPU capacity rather than the
// duration of its counter interval, which may span missed exporter scrapes.
func sampleClusterCPUCapacity(nodeID string, metrics *ParsedMetrics) (float64, float64) {
	busy, total := sampleClusterCPU(nodeID, metrics.CPU)
	if total <= 0 || metrics.System.NumCPUs <= 0 {
		return 0, 0
	}
	cores := float64(metrics.System.NumCPUs)
	return (busy / total) * cores, cores
}
