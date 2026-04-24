package socket

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type Manager struct {
	mu      sync.RWMutex
	clients map[int]map[*websocket.Conn]struct{}
}

var (
	instance *Manager
	once     sync.Once
)

func GetManager() *Manager {
	once.Do(func() {
		instance = &Manager{
			clients: make(map[int]map[*websocket.Conn]struct{}),
		}
	})
	return instance
}

func (m *Manager) AddConnection(userID int, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.clients[userID] == nil {
		m.clients[userID] = make(map[*websocket.Conn]struct{})
	}
	m.clients[userID][conn] = struct{}{}
}

func (m *Manager) RemoveConnection(userID int, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.clients[userID] == nil {
		return
	}
	delete(m.clients[userID], conn)
	if len(m.clients[userID]) == 0 {
		delete(m.clients, userID)
	}
}

func (m *Manager) BroadcastToUser(userID int, event string, payload interface{}) {
	m.mu.RLock()
	connections := m.clients[userID]
	m.mu.RUnlock()

	if len(connections) == 0 {
		return
	}

	envelope := map[string]interface{}{
		"event": event,
		"data":  payload,
	}
	message, err := json.Marshal(envelope)
	if err != nil {
		return
	}

	for conn := range connections {
		if writeErr := conn.WriteMessage(websocket.TextMessage, message); writeErr != nil {
			_ = conn.Close()
			m.RemoveConnection(userID, conn)
		}
	}
}
