package middlewares

import "net/http"

type Middlewares func(http.Handler) http.Handler

type Manager struct {
	globalMiddlewares []Middlewares
}

func NewManager() *Manager {
	return &Manager{
		globalMiddlewares: make([]Middlewares, 0),
	}
}

func (m *Manager) Use(middlewares ...Middlewares) {
	m.globalMiddlewares = append(m.globalMiddlewares, middlewares...)
}

func (m *Manager) With(handler http.Handler, middlewares ...Middlewares) http.Handler {
	for _, mw := range middlewares {
		handler = mw(handler)
	}
	return handler
}

func (m *Manager) WrapMux(next http.Handler) http.Handler {
	h := next
	for _, mw := range m.globalMiddlewares {
		h = mw(h)
	}
	return h
}
