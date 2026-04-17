package main

import (
	"log"
	"net/http"
	"os"

	"github.com/docker/docker/client"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	dockerclient "heckenmann.de/docker-swarm-dashboard/v2/internal/docker"
)

var (
	httpPort   = getHTTPPort()
	pathPrefix = os.Getenv("DSD_PATH_PREFIX")
)

// getCli returns the shared Docker client.
// Delegates to internal/docker so all handlers share the same instance.
func getCli() *client.Client {
	return dockerclient.GetCli()
}

// SetCli injects a custom Docker client. Used by tests.
func SetCli(c *client.Client) {
	dockerclient.SetCli(c)
}

// ResetCli clears the cached Docker client. Used by tests.
func ResetCli() {
	dockerclient.ResetCli()
}

func main() {
	log.Println("Starting Docker Swarm Dashboard...")
	log.Println("Starting server setup")
	handler := buildHandler()
	log.Println("Ready! Waiting for connections on port " + httpPort + "...")
	log.Fatal(http.ListenAndServe(":"+httpPort, handler))
}

// buildHandler constructs the HTTP handler (router + middleware) without
// starting the server. Extracted to allow testing of routing and setup.
func buildHandler() http.Handler {
	router := mux.NewRouter().StrictSlash(true)
	var apiRouter *mux.Router

	if pathPrefix == "" {
		apiRouter = router
	} else {
		log.Println("Using path prefix:", pathPrefix)
		apiRouter = router.PathPrefix(pathPrefix).Subrouter()
	}

	// CORS Headers
	// https://stackoverflow.com/questions/40985920/making-golang-gorilla-cors-handler-work
	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})

	apiRouter.HandleFunc("/docker/services", dockerServicesHandler)
	apiRouter.HandleFunc("/docker/services/{id}", dockerServicesDetailsHandler)
	apiRouter.HandleFunc("/docker/services/{id}/metrics", serviceMetricsHandler)
	apiRouter.HandleFunc("/docker/nodes", dockerNodesHandler)
	apiRouter.HandleFunc("/docker/nodes/metrics", clusterMetricsHandler)
	apiRouter.HandleFunc("/docker/nodes/{id}/metrics", nodeMetricsHandler)
	apiRouter.HandleFunc("/docker/nodes/{id}", dockerNodesDetailsHandler)
	apiRouter.HandleFunc("/docker/tasks", dockerTasksHandler)
	apiRouter.HandleFunc("/docker/tasks/{id}", dockerTasksDetailsHandler)
	apiRouter.HandleFunc("/docker/tasks/{id}/metrics", taskMetricsHandler)
	if handlingLogs {
		apiRouter.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	}
	apiRouter.HandleFunc("/ui/dashboard-settings", dashboardSettingsHandler)
	apiRouter.HandleFunc("/ui/dashboardh", dashboardHHandler)
	apiRouter.HandleFunc("/ui/dashboardv", dashboardVHandler)
	apiRouter.HandleFunc("/ui/timeline", timelineHandler)
	apiRouter.HandleFunc("/ui/stacks", stacksHandler)
	apiRouter.HandleFunc("/ui/nodes", nodesHandler)
	apiRouter.HandleFunc("/ui/tasks", tasksHandler)
	apiRouter.HandleFunc("/ui/ports", portsHandler)
	apiRouter.HandleFunc("/ui/logs/services", logsServicesHandler)
	apiRouter.HandleFunc("/ui/version", versionHandler)

	apiRouter.HandleFunc("/health", healthHandler)

	if pathPrefix == "" || pathPrefix == "/" {
		router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build/"))))
	} else {
		router.PathPrefix(pathPrefix + "/").Handler(http.StripPrefix(pathPrefix+"/", http.FileServer(http.Dir("build/"))))
		router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, pathPrefix+"/", http.StatusTemporaryRedirect)
		})
	}

	corsRouter := handlers.CORS(headersOk, originsOk, methodsOk)(router)
	loggedRouter := handlers.LoggingHandler(os.Stdout, corsRouter)
	return handlers.CompressHandler(loggedRouter)
}

// getHTTPPort returns the configured HTTP port from DSD_HTTP_PORT, defaulting to 8080.
// or defaults to 8080 if the variable is not set.
func getHTTPPort() string {
	port := os.Getenv("DSD_HTTP_PORT")
	if port == "" {
		port = "8080"
	}
	return port
}
