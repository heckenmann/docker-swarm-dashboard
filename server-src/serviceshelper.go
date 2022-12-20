package main

import (
	"github.com/docker/docker/api/types/swarm"
	"strconv"
)

func extractReplicationFromService(service swarm.Service) string {
	if service.Spec.Mode.Replicated != nil {
		return strconv.FormatUint(*service.Spec.Mode.Replicated.Replicas, 10)
	} else if service.Spec.Mode.Global != nil {
		return "global"
	} else {
		return "unknown"
	}
}
