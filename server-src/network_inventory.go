package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strings"

	cerrdefs "github.com/containerd/errdefs"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	"github.com/ggwhite/go-masker/v3"
	"github.com/gorilla/mux"
)

const networkObservation = "Configuration and service specifications do not prove end-to-end connectivity. Endpoints and peers are observations from the queried Docker daemon and may omit remote overlay endpoints. Absent optional fields mean unavailable or not reported, not a healthy connectivity result."

type networkFilter struct {
	Name   string `json:"name,omitempty" jsonschema:"Case-insensitive network name or ID substring."`
	Stack  string `json:"stack,omitempty" jsonschema:"Exact network or attached service stack."`
	Driver string `json:"driver,omitempty" jsonschema:"Exact network driver."`
	Scope  string `json:"scope,omitempty" jsonschema:"Exact network scope."`
}
type networkService struct {
	ID           string             `json:"id"`
	Name         string             `json:"name"`
	Stack        string             `json:"stack"`
	Aliases      []string           `json:"aliases"`
	EndpointMode string             `json:"endpointMode"`
	VirtualIPs   []string           `json:"virtualIPs"`
	Ports        []swarm.PortConfig `json:"ports"`
}

// Pointer flags preserve unknown metadata for missing references in REST and MCP.
type networkMetadata struct {
	network.Inspect
	Internal   *bool `json:"Internal"`
	Attachable *bool `json:"Attachable"`
	Ingress    *bool `json:"Ingress"`
}

type networkEntry struct {
	Network  networkMetadata  `json:"network"`
	Missing  bool             `json:"missing"`
	Services []networkService `json:"services"`
}
type networkInventory struct {
	Networks    []networkEntry `json:"networks"`
	Observation string         `json:"observation"`
}

func sanitizeNetwork(n network.Inspect) networkMetadata {
	n.Services = nil // Service attachments use the explicit specification projection below.
	if isEnvMaskingEnabled() {
		n.Labels = maskLabels(n.Labels)
		n.Options = maskNetworkOptions(n.Driver, n.Options)
		n.IPAM.Options = maskLabels(n.IPAM.Options)
	}
	return networkMetadata{Inspect: n, Internal: &n.Internal, Attachable: &n.Attachable, Ingress: &n.Ingress}
}

// Driver options are not labels: preserve only explicitly known configuration
// keys. Unknown driver/plugin options retain the conservative masking policy.
func maskNetworkOptions(driver string, options map[string]string) map[string]string {
	masked := make(map[string]string, len(options))
	// Do not inherit the structural-label prefix exemption for arbitrary options.
	for key, value := range options {
		masked[key] = value
		if value != "" {
			masked[key] = masker.Password(value)
		}
		known := driver == "overlay" && (key == "encrypted" || key == "com.docker.network.driver.overlay.vxlanid_list" || key == "com.docker.network.driver.mtu")
		known = known || ((driver == "macvlan" || driver == "ipvlan") && key == "parent")
		known = known || (driver == "macvlan" && key == "macvlan_mode")
		known = known || (driver == "ipvlan" && (key == "ipvlan_mode" || key == "ipvlan_flag"))
		if known {
			masked[key] = value
		}
	}
	return masked
}

// Inventory uses one list and one service query, never per-network inspection.
func queryNetworkInventory(ctx context.Context, filter networkFilter) (networkInventory, error) {
	result := networkInventory{Networks: []networkEntry{}, Observation: networkObservation}
	cli, err := getCli()
	if err != nil {
		return result, errors.New("docker client unavailable")
	}
	networks, err := cli.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		return result, errors.New("failed to list networks")
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return result, errors.New("failed to list service network attachments")
	}
	entries := map[string]*networkEntry{}
	for _, n := range networks {
		entries[n.ID] = &networkEntry{Network: sanitizeNetwork(n), Services: []networkService{}}
	}
	for _, s := range services {
		refs := s.Spec.TaskTemplate.Networks
		if len(refs) == 0 {
			refs = s.Spec.Networks //nolint:staticcheck // Docker API versions before v1.44 use service-level network attachments.
		}
		attached := map[string]*networkService{}
		add := func(id string) *networkService {
			if c := attached[id]; c != nil {
				return c
			}
			if entries[id] == nil {
				entries[id] = &networkEntry{Network: networkMetadata{Inspect: network.Inspect{ID: id}}, Missing: true, Services: []networkService{}}
			}
			c := &networkService{ID: s.ID, Name: s.Spec.Name, Stack: s.Spec.Labels["com.docker.stack.namespace"], Aliases: []string{}, VirtualIPs: []string{}, Ports: []swarm.PortConfig{}}
			c.EndpointMode = string(s.Endpoint.Spec.Mode)
			if s.Spec.EndpointSpec != nil {
				if s.Spec.EndpointSpec.Mode != "" {
					c.EndpointMode = string(s.Spec.EndpointSpec.Mode)
				}
				c.Ports = append(c.Ports, s.Spec.EndpointSpec.Ports...)
			}
			// Observed ports include dynamically assigned published ports.
			if len(s.Endpoint.Ports) > 0 {
				c.Ports = append([]swarm.PortConfig{}, s.Endpoint.Ports...)
			}
			attached[id] = c
			return c
		}
		for _, ref := range refs {
			c := add(ref.Target)
			c.Aliases = append(c.Aliases, ref.Aliases...)
		}
		for _, vip := range s.Endpoint.VirtualIPs {
			c := add(vip.NetworkID)
			c.VirtualIPs = append(c.VirtualIPs, vip.Addr)
		}
		for id, c := range attached {
			entries[id].Services = append(entries[id].Services, *c)
		}
	}
	for _, e := range entries {
		n := e.Network
		if filter.Name != "" && !strings.Contains(strings.ToLower(n.Name+" "+n.ID), strings.ToLower(filter.Name)) {
			continue
		}
		if filter.Driver != "" && n.Driver != filter.Driver {
			continue
		}
		if filter.Scope != "" && n.Scope != filter.Scope {
			continue
		}
		if filter.Stack != "" {
			matches := n.Labels["com.docker.stack.namespace"] == filter.Stack
			for _, s := range e.Services {
				matches = matches || s.Stack == filter.Stack
			}
			if !matches {
				continue
			}
		}
		sort.Slice(e.Services, func(i, j int) bool { return e.Services[i].Name+e.Services[i].ID < e.Services[j].Name+e.Services[j].ID })
		result.Networks = append(result.Networks, *e)
	}
	sort.Slice(result.Networks, func(i, j int) bool {
		return result.Networks[i].Network.Name+result.Networks[i].Network.ID < result.Networks[j].Network.Name+result.Networks[j].Network.ID
	})
	return result, nil
}

type networkDetail struct {
	networkEntry
	Observation string `json:"observation"`
}

func queryNetworkDetail(ctx context.Context, id string) (networkDetail, error) {
	inventory, err := queryNetworkInventory(ctx, networkFilter{})
	if err != nil {
		return networkDetail{}, err
	}
	for _, entry := range inventory.Networks {
		if entry.Network.ID != id {
			continue
		}
		result := networkDetail{networkEntry: entry, Observation: networkObservation}
		if entry.Missing {
			return result, nil
		}
		cli, err := getCli()
		if err != nil {
			return result, errors.New("docker client unavailable")
		}
		n, err := cli.NetworkInspect(ctx, id, network.InspectOptions{Verbose: true})
		if cerrdefs.IsNotFound(err) {
			result.Missing = true
			return result, nil
		}
		if err != nil {
			return result, errors.New("failed to inspect network")
		}
		result.Network = sanitizeNetwork(n)
		return result, nil
	}
	return networkDetail{}, errDashboardEntityNotFound
}
func networkInventoryHandler(w http.ResponseWriter, r *http.Request) {
	var result any
	var err error
	if id := mux.Vars(r)["id"]; id != "" {
		result, err = queryNetworkDetail(r.Context(), id)
	} else {
		q := r.URL.Query()
		result, err = queryNetworkInventory(r.Context(), networkFilter{Name: q.Get("name"), Stack: q.Get("stack"), Driver: q.Get("driver"), Scope: q.Get("scope")})
	}
	if errors.Is(err, errDashboardEntityNotFound) {
		http.Error(w, "Network not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		return
	}
}
