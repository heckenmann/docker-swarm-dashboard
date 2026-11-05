package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/docker/docker/api/types/swarm"
	"github.com/gorilla/mux"
)

// List projections never include payloads. Detail content uses independent
// opt-in visibility settings; never serialize complete Docker objects.
type resourceMetadata struct {
	ID        string             `json:"id"`
	Name      string             `json:"name"`
	Version   uint64             `json:"version"`
	Created   time.Time          `json:"created"`
	Updated   time.Time          `json:"updated"`
	Stack     string             `json:"stack"`
	Labels    map[string]string  `json:"labels"`
	Missing   bool               `json:"missing"`
	Usage     string             `json:"usage"`
	Consumers []resourceConsumer `json:"consumers"`
}

type resourceConsumer struct {
	ServiceID   string `json:"serviceId"`
	ServiceName string `json:"serviceName"`
	Stack       string `json:"stack"`
	Target      string `json:"target"`
	UID         string `json:"uid"`
	GID         string `json:"gid"`
	Mode        string `json:"mode"`
	Runtime     bool   `json:"runtime"`
}

type resourceInventory struct {
	Resources  []resourceMetadata `json:"resources"`
	UsageKnown bool               `json:"usageKnown"`
	Message    string             `json:"message,omitempty"`
}

type resourceFilter struct {
	Name  string `json:"name,omitempty" jsonschema:"Optional case-insensitive resource name or ID substring."`
	Stack string `json:"stack,omitempty" jsonschema:"Optional exact resource or consuming-service stack name."`
	Usage string `json:"usage,omitempty" jsonschema:"Optional referenced, unreferenced, or unknown usage state."`
}

func queryResourceInventory(ctx context.Context, kind string, filter resourceFilter) (resourceInventory, error) {
	result := resourceInventory{Resources: []resourceMetadata{}}
	cli, err := getCli()
	if err != nil {
		return result, errors.New("docker client unavailable")
	}
	resources := map[string]*resourceMetadata{}
	add := func(id string, meta swarm.Meta, annotations swarm.Annotations) {
		labels := annotations.Labels
		if isEnvMaskingEnabled() {
			labels = maskLabels(labels)
		}
		resources[id] = &resourceMetadata{ID: id, Name: annotations.Name, Version: meta.Version.Index, Created: meta.CreatedAt, Updated: meta.UpdatedAt, Stack: annotations.Labels["com.docker.stack.namespace"], Labels: labels, Usage: "unknown", Consumers: []resourceConsumer{}}
	}
	switch kind {
	case "configs":
		configs, err := cli.ConfigList(ctx, swarm.ConfigListOptions{})
		if err != nil {
			return result, errors.New("failed to list configs")
		}
		for _, config := range configs {
			add(config.ID, config.Meta, config.Spec.Annotations)
		}
	case "secrets":
		secrets, err := cli.SecretList(ctx, swarm.SecretListOptions{})
		if err != nil {
			return result, errors.New("failed to list secrets")
		}
		for _, secret := range secrets {
			add(secret.ID, secret.Meta, secret.Spec.Annotations)
		}
	default:
		return result, errors.New("unknown resource kind")
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	result.UsageKnown = err == nil
	if err != nil {
		result.Message = "Service inventory unavailable; resource usage is unknown."
	}
	if result.UsageKnown {
		for _, resource := range resources {
			resource.Usage = "unreferenced"
		}
		for _, service := range services {
			spec := service.Spec.TaskTemplate.ContainerSpec
			if spec == nil {
				continue
			}
			consumer := resourceConsumer{ServiceID: service.ID, ServiceName: service.Spec.Name, Stack: service.Spec.Labels["com.docker.stack.namespace"]}
			attach := func(id, name string, c resourceConsumer) {
				resource, exists := resources[id]
				if !exists {
					resource = &resourceMetadata{ID: id, Name: name, Missing: true, Consumers: []resourceConsumer{}}
					resources[id] = resource
				}
				resource.Usage = "referenced"
				resource.Consumers = append(resource.Consumers, c)
			}
			if kind == "configs" {
				for _, ref := range spec.Configs {
					if ref == nil {
						continue
					}
					c := consumer
					if ref.File != nil {
						c.Target = ref.File.Name
						c.UID = ref.File.UID
						c.GID = ref.File.GID
						c.Mode = formatResourceMode(uint32(ref.File.Mode))
					}
					c.Runtime = ref.Runtime != nil
					attach(ref.ConfigID, ref.ConfigName, c)
				}
			} else {
				for _, ref := range spec.Secrets {
					if ref == nil {
						continue
					}
					c := consumer
					if ref.File != nil {
						c.Target = ref.File.Name
						c.UID = ref.File.UID
						c.GID = ref.File.GID
						c.Mode = formatResourceMode(uint32(ref.File.Mode))
					}
					attach(ref.SecretID, ref.SecretName, c)
				}
			}
		}
	}
	for _, resource := range resources {
		if filter.Name != "" && !strings.Contains(strings.ToLower(resource.Name+" "+resource.ID), strings.ToLower(filter.Name)) {
			continue
		}
		if filter.Usage != "" && resource.Usage != filter.Usage {
			continue
		}
		if filter.Stack != "" {
			matches := resource.Stack == filter.Stack
			for _, consumer := range resource.Consumers {
				matches = matches || consumer.Stack == filter.Stack
			}
			if !matches {
				continue
			}
		}
		sort.Slice(resource.Consumers, func(i, j int) bool {
			a, b := resource.Consumers[i], resource.Consumers[j]
			return a.ServiceName+"\x00"+a.ServiceID+"\x00"+a.Target < b.ServiceName+"\x00"+b.ServiceID+"\x00"+b.Target
		})
		result.Resources = append(result.Resources, *resource)
	}
	sort.Slice(result.Resources, func(i, j int) bool {
		a, b := result.Resources[i], result.Resources[j]
		return a.Name+"\x00"+a.ID < b.Name+"\x00"+b.ID
	})
	return result, nil
}

func resourceInventoryHandler(kind string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		result, err := queryResourceInventory(r.Context(), kind, resourceFilter{Name: q.Get("name"), Stack: q.Get("stack"), Usage: q.Get("usage")})
		if err != nil {
			http.Error(w, err.Error(), http.StatusServiceUnavailable)
			return
		}
		var response any = result
		if id := mux.Vars(r)["id"]; id != "" {
			resource, err := findResource(result, id)
			if err != nil {
				http.Error(w, "Resource not found", http.StatusNotFound)
				return
			}
			response = queryResourceDetail(r.Context(), kind, resource)
			w.Header().Set("Cache-Control", "no-store")
		}
		w.Header().Set("Content-Type", "application/json")
		// Only explicit metadata and content projections are serialized.
		if err := json.NewEncoder(w).Encode(response); err != nil {
			return
		}
	}
}

func formatResourceMode(mode uint32) string { return fmt.Sprintf("%04o", mode) }

func findResource(inventory resourceInventory, id string) (resourceMetadata, error) {
	for _, resource := range inventory.Resources {
		if resource.ID == id {
			return resource, nil
		}
	}
	return resourceMetadata{}, errors.New("resource not found")
}

// Resource payload visibility is independent of DSD_MASK_ENV. Invalid settings
// fail closed, just like unset settings.
func hideConfigContent() bool {
	value := strings.TrimSpace(os.Getenv("DSD_HIDE_CONFIG_CONTENT"))
	hidden, err := strconv.ParseBool(value)
	return err != nil || hidden
}

type resourceContent struct {
	Status   string `json:"status"`
	Encoding string `json:"encoding,omitempty"`
	Value    string `json:"value"`
	Message  string `json:"message,omitempty"`
}

type resourceDetail struct {
	resourceMetadata
	Content *resourceContent `json:"content,omitempty"`
}

func queryConfigContent(ctx context.Context, resource resourceMetadata) resourceContent {
	if hideConfigContent() {
		return resourceContent{Status: "hidden", Message: "Content is hidden by server configuration."}
	}
	if resource.Missing {
		return resourceContent{Status: "unavailable", Message: "The referenced resource is missing."}
	}
	cli, err := getCli()
	if err != nil {
		return resourceContent{Status: "unavailable", Message: "Docker client unavailable."}
	}
	config, _, err := cli.ConfigInspectWithRaw(ctx, resource.ID)
	if err != nil {
		return resourceContent{Status: "unavailable", Message: "Unable to retrieve config content from Docker."}
	}
	data := config.Spec.Data

	if utf8.Valid(data) && bytes.IndexByte(data, 0) < 0 {
		return resourceContent{Status: "available", Encoding: "utf-8", Value: string(data)}
	}
	return resourceContent{Status: "available", Encoding: "base64", Value: base64.StdEncoding.EncodeToString(data)}
}

func queryResourceDetail(ctx context.Context, kind string, resource resourceMetadata) resourceDetail {
	detail := resourceDetail{resourceMetadata: resource}
	if kind == "configs" {
		content := queryConfigContent(ctx, resource)
		detail.Content = &content
	}
	return detail
}
