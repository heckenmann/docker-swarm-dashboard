package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
)

var errDashboardEntityNotFound = errors.New("dashboard entity not found")

type clusterOverview struct {
	Services []swarm.Service `json:"services"`
	Nodes    []swarm.Node    `json:"nodes"`
	Tasks    []swarm.Task    `json:"tasks"`
}

// queryClusterOverview exposes the complete shared cluster data independently
// of UI layout, including service replication and unassigned tasks.
func queryClusterOverview(ctx context.Context) (clusterOverview, error) {
	services, err := queryServices(ctx)
	if err != nil {
		return clusterOverview{}, err
	}
	nodes, err := queryNodes(ctx)
	if err != nil {
		return clusterOverview{}, err
	}
	tasks, err := queryTasks(ctx, "", "")
	if err != nil {
		return clusterOverview{}, err
	}
	return clusterOverview{Services: services, Nodes: nodes, Tasks: tasks}, nil
}

func queryServices(ctx context.Context) ([]swarm.Service, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}
	return maskServicesEnv(services), nil
}

func queryNodes(ctx context.Context) ([]swarm.Node, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	return cli.NodeList(ctx, swarm.NodeListOptions{})
}

func queryTasks(ctx context.Context, serviceIdentifier, nodeIdentifier string) ([]swarm.Task, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}

	taskFilters := filters.NewArgs()
	if serviceIdentifier != "" {
		service, err := resolveService(ctx, cli, serviceIdentifier)
		if err != nil {
			return nil, err
		}
		taskFilters.Add("service", service.ID)
	}
	if nodeIdentifier != "" {
		node, err := resolveNode(ctx, cli, nodeIdentifier)
		if err != nil {
			return nil, err
		}
		taskFilters.Add("node", node.ID)
	}

	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		return nil, err
	}
	return maskTasksEnv(tasks), nil
}

func resolveService(ctx context.Context, cli *client.Client, identifier string) (swarm.Service, error) {
	if identifier == "" {
		return swarm.Service{}, fmt.Errorf("%w: empty service identifier", errDashboardEntityNotFound)
	}

	for _, filterKey := range []string{"id", "name"} {
		serviceFilters := filters.NewArgs()
		serviceFilters.Add(filterKey, identifier)
		services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{Filters: serviceFilters})
		if err != nil {
			return swarm.Service{}, err
		}
		for _, service := range services {
			if service.ID == identifier || service.Spec.Name == identifier {
				return service, nil
			}
		}
		if filterKey == "id" && len(services) == 1 && strings.HasPrefix(services[0].ID, identifier) {
			return services[0], nil
		}
	}

	return swarm.Service{}, fmt.Errorf("%w: service %q", errDashboardEntityNotFound, identifier)
}

func resolveNode(ctx context.Context, cli *client.Client, identifier string) (swarm.Node, error) {
	if identifier == "" {
		return swarm.Node{}, fmt.Errorf("%w: empty node identifier", errDashboardEntityNotFound)
	}

	for _, filterKey := range []string{"id", "name"} {
		nodeFilters := filters.NewArgs()
		nodeFilters.Add(filterKey, identifier)
		nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{Filters: nodeFilters})
		if err != nil {
			return swarm.Node{}, err
		}
		for _, node := range nodes {
			if node.ID == identifier || node.Spec.Name == identifier || node.Description.Hostname == identifier {
				return node, nil
			}
		}
		if filterKey == "id" && len(nodes) == 1 && strings.HasPrefix(nodes[0].ID, identifier) {
			return nodes[0], nil
		}
	}

	return swarm.Node{}, fmt.Errorf("%w: node %q", errDashboardEntityNotFound, identifier)
}

func resolveTask(ctx context.Context, cli *client.Client, identifier string) (swarm.Task, error) {
	if identifier == "" {
		return swarm.Task{}, fmt.Errorf("%w: empty task identifier", errDashboardEntityNotFound)
	}

	taskFilters := filters.NewArgs()
	taskFilters.Add("id", identifier)
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		return swarm.Task{}, err
	}
	for _, task := range tasks {
		if task.ID == identifier {
			return task, nil
		}
	}
	if len(tasks) == 1 && strings.HasPrefix(tasks[0].ID, identifier) {
		return tasks[0], nil
	}

	return swarm.Task{}, fmt.Errorf("%w: task %q", errDashboardEntityNotFound, identifier)
}

func queryServiceDetails(ctx context.Context, identifier string) (map[string]any, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	service, err := resolveService(ctx, cli, identifier)
	if err != nil {
		return nil, err
	}

	taskFilters := filters.NewArgs()
	taskFilters.Add("service", service.ID)
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		tasks = nil
	}
	sort.Slice(tasks, func(i, j int) bool {
		return tasks[i].UpdatedAt.After(tasks[j].UpdatedAt)
	})

	enriched := make([]map[string]any, 0, len(tasks))
	for _, task := range maskTasksEnv(tasks) {
		taskMap, err := toMap(task)
		if err != nil {
			return nil, err
		}

		nodeFilters := filters.NewArgs()
		nodeFilters.Add("id", task.NodeID)
		nodes, nodeErr := cli.NodeList(ctx, swarm.NodeListOptions{Filters: nodeFilters})
		if nodeErr == nil && len(nodes) > 0 {
			taskMap["Node"] = nodes[0]
		} else {
			taskMap["Node"] = nil
		}
		enriched = append(enriched, taskMap)
	}

	return map[string]any{
		"service": maskServiceEnv(service),
		"tasks":   enriched,
	}, nil
}

func queryNodeDetails(ctx context.Context, identifier string) (map[string]any, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	node, err := resolveNode(ctx, cli, identifier)
	if err != nil {
		return nil, err
	}

	taskFilters := filters.NewArgs()
	taskFilters.Add("node", node.ID)
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{Filters: taskFilters})
	if err != nil {
		tasks = nil
	}
	sort.Slice(tasks, func(i, j int) bool {
		return tasks[i].UpdatedAt.After(tasks[j].UpdatedAt)
	})

	enriched := make([]map[string]any, 0, len(tasks))
	for _, task := range maskTasksEnv(tasks) {
		taskMap, err := toMap(task)
		if err != nil {
			return nil, err
		}

		serviceFilters := filters.NewArgs()
		serviceFilters.Add("id", task.ServiceID)
		services, serviceErr := cli.ServiceList(ctx, swarm.ServiceListOptions{Filters: serviceFilters})
		if serviceErr == nil && len(services) > 0 {
			taskMap["Service"] = maskServiceEnv(services[0])
		} else {
			taskMap["Service"] = nil
		}
		enriched = append(enriched, taskMap)
	}

	return map[string]any{
		"node":  node,
		"tasks": enriched,
	}, nil
}

func queryTaskDetails(ctx context.Context, identifier string) (map[string]any, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	task, err := resolveTask(ctx, cli, identifier)
	if err != nil {
		return nil, err
	}

	taskMap, err := toMap(maskTaskEnv(task))
	if err != nil {
		return nil, err
	}

	if task.NodeID != "" {
		nodeFilters := filters.NewArgs()
		nodeFilters.Add("id", task.NodeID)
		nodes, nodeErr := cli.NodeList(ctx, swarm.NodeListOptions{Filters: nodeFilters})
		if nodeErr == nil && len(nodes) > 0 {
			nodeName := nodes[0].Description.Hostname
			if nodeName == "" {
				nodeName = nodes[0].ID
			}
			taskMap["NodeName"] = nodeName
		}
	}

	if task.ServiceID != "" {
		serviceFilters := filters.NewArgs()
		serviceFilters.Add("id", task.ServiceID)
		services, serviceErr := cli.ServiceList(ctx, swarm.ServiceListOptions{Filters: serviceFilters})
		if serviceErr == nil && len(services) > 0 {
			taskMap["ServiceName"] = services[0].Spec.Name
		}
	}

	return taskMap, nil
}

func queryStacks(ctx context.Context) ([]StacksHandlerSimpleStack, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	resultMap := make(map[string]StacksHandlerSimpleStack)
	for _, service := range services {
		stackName := service.Spec.Labels["com.docker.stack.namespace"]
		if stackName == "" {
			stackName = "(without stack)"
		}
		currentStack := resultMap[stackName]
		currentStack.Name = stackName

		simpleService := StackSimpleService{
			ID:          service.ID,
			ServiceName: service.Spec.Name,
			Replication: extractReplicationFromService(service),
			Created:     service.CreatedAt,
			Updated:     service.UpdatedAt,
		}
		if strings.HasPrefix(service.Spec.Name, stackName+"_") {
			simpleService.ShortName = strings.TrimPrefix(service.Spec.Name, stackName+"_")
		}
		currentStack.Services = append(currentStack.Services, simpleService)
		resultMap[stackName] = currentStack
	}

	result := make([]StacksHandlerSimpleStack, 0, len(resultMap))
	for _, stack := range resultMap {
		sort.SliceStable(stack.Services, func(i, j int) bool {
			return stack.Services[i].ServiceName < stack.Services[j].ServiceName
		})
		result = append(result, stack)
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result, nil
}

func queryPublishedPorts(ctx context.Context) ([]PortsHandlerSimplePort, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]PortsHandlerSimplePort, 0)
	for _, service := range services {
		if service.Spec.EndpointSpec == nil {
			continue
		}
		for _, port := range service.Spec.EndpointSpec.Ports {
			result = append(result, PortsHandlerSimplePort{
				PublishedPort: port.PublishedPort,
				TargetPort:    port.TargetPort,
				Protocol:      string(port.Protocol),
				PublishMode:   string(port.PublishMode),
				ServiceName:   service.Spec.Name,
				ServiceID:     service.ID,
				Stack:         service.Spec.Labels["com.docker.stack.namespace"],
			})
		}
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].PublishedPort < result[j].PublishedPort
	})
	return result, nil
}

func queryTimeline(ctx context.Context) ([]TimelineHandlerSimpleTask, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		return nil, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	serviceMap := make(map[string]swarm.Service, len(services))
	for _, service := range services {
		serviceMap[service.ID] = service
	}

	now := time.Now()
	result := make([]TimelineHandlerSimpleTask, 0, len(tasks))
	for _, task := range tasks {
		item := TimelineHandlerSimpleTask{
			ID:               task.ID,
			CreatedTimestamp: task.CreatedAt,
			State:            string(task.Status.State),
			DesiredState:     string(task.DesiredState),
			Slot:             task.Slot,
			ServiceID:        task.ServiceID,
		}
		if task.Status.State != swarm.TaskStateRunning || task.Status.ContainerStatus.PID == 0 {
			item.StoppedTimestamp = task.Status.Timestamp
		} else {
			item.StoppedTimestamp = now
		}
		if service, ok := serviceMap[task.ServiceID]; ok {
			item.ServiceName = service.Spec.Name
			item.Stack = service.Spec.Labels["com.docker.stack.namespace"]
		}
		result = append(result, item)
	}
	sort.SliceStable(result, func(i, j int) bool {
		if result[i].ServiceName == result[j].ServiceName {
			return result[i].Slot < result[j].Slot
		}
		return result[i].ServiceName < result[j].ServiceName
	})
	return result, nil
}

func queryDashboardH(ctx context.Context) (DashboardH, error) {
	result := DashboardH{}
	cli, err := getCli()
	if err != nil {
		return result, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return result, err
	}
	nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{})
	if err != nil {
		return result, err
	}
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		return result, err
	}
	tasks = maskTasksEnv(tasks)

	nodeTasks := make(map[string][]swarm.Task)
	for _, task := range tasks {
		nodeTasks[task.NodeID] = append(nodeTasks[task.NodeID], task)
	}
	for _, service := range services {
		result.Services = append(result.Services, SimpleService{
			ID:    service.ID,
			Name:  service.Spec.Name,
			Stack: service.Spec.Labels["com.docker.stack.namespace"],
		})
	}
	for _, node := range nodes {
		line := NodeLine{
			ID:            node.ID,
			Name:          node.Spec.Name,
			Hostname:      node.Description.Hostname,
			Role:          string(node.Spec.Role),
			StatusMessage: node.Status.Message,
			StatusState:   string(node.Status.State),
			Leader:        node.ManagerStatus != nil && node.ManagerStatus.Leader,
			Availability:  string(node.Spec.Availability),
			IP:            node.Status.Addr,
			Tasks:         make(map[string][]swarm.Task),
		}
		tasksForNode := nodeTasks[node.ID]
		sort.SliceStable(tasksForNode, func(i, j int) bool {
			return tasksForNode[i].CreatedAt.After(tasksForNode[j].CreatedAt)
		})
		for _, task := range tasksForNode {
			line.Tasks[task.ServiceID] = append(line.Tasks[task.ServiceID], task)
		}
		result.Nodes = append(result.Nodes, line)
	}
	sort.SliceStable(result.Nodes, func(i, j int) bool {
		return result.Nodes[i].Hostname < result.Nodes[j].Hostname
	})
	sort.SliceStable(result.Services, func(i, j int) bool {
		return result.Services[i].Name < result.Services[j].Name
	})
	return result, nil
}

func queryDashboardV(ctx context.Context) (DashboardV, error) {
	result := DashboardV{}
	cli, err := getCli()
	if err != nil {
		return result, err
	}
	nodes, err := cli.NodeList(ctx, swarm.NodeListOptions{})
	if err != nil {
		return result, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return result, err
	}
	tasks, err := cli.TaskList(ctx, swarm.TaskListOptions{})
	if err != nil {
		return result, err
	}
	tasks = maskTasksEnv(tasks)

	serviceNodeTasks := make(map[string]map[string][]swarm.Task)
	for _, task := range tasks {
		if serviceNodeTasks[task.ServiceID] == nil {
			serviceNodeTasks[task.ServiceID] = make(map[string][]swarm.Task)
		}
		serviceNodeTasks[task.ServiceID][task.NodeID] = append(serviceNodeTasks[task.ServiceID][task.NodeID], task)
	}
	for _, node := range nodes {
		result.Nodes = append(result.Nodes, SimpleNode{
			ID:       node.ID,
			Hostname: node.Description.Hostname,
			IP:       node.Status.Addr,
		})
	}
	for _, service := range services {
		line := ServiceLine{
			ID:          service.ID,
			Name:        service.Spec.Name,
			Stack:       service.Spec.Labels["com.docker.stack.namespace"],
			Replication: extractReplicationFromService(service),
			Tasks:       make(map[string][]swarm.Task),
		}
		for nodeID, nodeTasks := range serviceNodeTasks[service.ID] {
			sort.SliceStable(nodeTasks, func(i, j int) bool {
				return nodeTasks[i].CreatedAt.After(nodeTasks[j].CreatedAt)
			})
			line.Tasks[nodeID] = nodeTasks
		}
		result.Services = append(result.Services, line)
	}
	sort.SliceStable(result.Nodes, func(i, j int) bool {
		return result.Nodes[i].Hostname < result.Nodes[j].Hostname
	})
	sort.SliceStable(result.Services, func(i, j int) bool {
		return result.Services[i].Name < result.Services[j].Name
	})
	return result, nil
}

func queryLogServices(ctx context.Context) ([]LogsHandlerSimpleService, error) {
	cli, err := getCli()
	if err != nil {
		return nil, err
	}
	services, err := cli.ServiceList(ctx, swarm.ServiceListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]LogsHandlerSimpleService, 0, len(services))
	for _, service := range services {
		result = append(result, LogsHandlerSimpleService{
			ID:   service.ID,
			Name: service.Spec.Name,
		})
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result, nil
}

func toMap(value any) (map[string]any, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	return result, nil
}
