package message

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"livesync-backend/util"
)

type sendMessageRequest struct {
	ReceiverID  int    `json:"receiverId"`
	ReceiverID2 int    `json:"receiver_id"`
	PostID      *int   `json:"postId,omitempty"`
	PostID2     *int   `json:"post_id,omitempty"`
	Content     string `json:"content"`
}

func (h *Handler) GetConversations(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		util.SendError(w, http.StatusUnauthorized, "Invalid user context")
		return
	}

	conversations, err := h.messageRepo.GetConversations(userID, 100)
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch conversations")
		return
	}

	util.SendData(w, http.StatusOK, conversations)
}

func (h *Handler) SendMessage(w http.ResponseWriter, r *http.Request) {
	senderID, ok := getUserIDFromContext(r)
	if !ok {
		util.SendError(w, http.StatusUnauthorized, "Invalid user context")
		return
	}

	var req sendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		util.SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	receiverID := req.ReceiverID
	if receiverID == 0 {
		receiverID = req.ReceiverID2
	}
	if receiverID == 0 {
		util.SendError(w, http.StatusBadRequest, "receiverId is required")
		return
	}
	if receiverID == senderID {
		util.SendError(w, http.StatusBadRequest, "cannot send message to self")
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		util.SendError(w, http.StatusBadRequest, "message content is required")
		return
	}
	if len(content) > 2000 {
		util.SendError(w, http.StatusBadRequest, "message content too long")
		return
	}

	postID := req.PostID
	if postID == nil {
		postID = req.PostID2
	}

	msg, err := h.messageRepo.SendMessage(senderID, receiverID, postID, content)
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	h.socketManager.BroadcastToUser(receiverID, "receive_message", msg)
	h.socketManager.BroadcastToUser(senderID, "message_sent", msg)

	util.SendData(w, http.StatusCreated, msg)
}

func (h *Handler) GetConversationHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		util.SendError(w, http.StatusUnauthorized, "Invalid user context")
		return
	}

	otherUserRaw := r.URL.Query().Get("user_id")
	if otherUserRaw == "" {
		util.SendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	otherUserID, err := strconv.Atoi(otherUserRaw)
	if err != nil || otherUserID <= 0 {
		util.SendError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	limit := 100
	offset := 0
	if limitRaw := r.URL.Query().Get("limit"); limitRaw != "" {
		if v, convErr := strconv.Atoi(limitRaw); convErr == nil && v > 0 && v <= 500 {
			limit = v
		}
	}
	if offsetRaw := r.URL.Query().Get("offset"); offsetRaw != "" {
		if v, convErr := strconv.Atoi(offsetRaw); convErr == nil && v >= 0 {
			offset = v
		}
	}

	messages, getErr := h.messageRepo.GetConversationHistory(userID, otherUserID, limit, offset)
	if getErr != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch message history")
		return
	}

	util.SendData(w, http.StatusOK, messages)
}

func (h *Handler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		util.SendError(w, http.StatusUnauthorized, "Invalid user context")
		return
	}

	senderRaw := r.URL.Query().Get("sender_id")
	if senderRaw == "" {
		util.SendError(w, http.StatusBadRequest, "sender_id is required")
		return
	}

	senderID, err := strconv.Atoi(senderRaw)
	if err != nil || senderID <= 0 {
		util.SendError(w, http.StatusBadRequest, "invalid sender_id")
		return
	}

	affected, markErr := h.messageRepo.MarkAsRead(userID, senderID)
	if markErr != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to mark messages as read")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"updated": affected,
	})
}

func (h *Handler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		util.SendError(w, http.StatusUnauthorized, "Invalid user context")
		return
	}

	count, err := h.messageRepo.GetUnreadCount(userID)
	if err != nil {
		util.SendError(w, http.StatusInternalServerError, "Failed to fetch unread count")
		return
	}

	util.SendData(w, http.StatusOK, map[string]interface{}{
		"unread_count": count,
	})
}

func getUserIDFromContext(r *http.Request) (int, bool) {
	userID := r.Context().Value("userID")
	if userID == nil {
		return 0, false
	}

	switch v := userID.(type) {
	case int:
		return v, true
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			return 0, false
		}
		return id, true
	default:
		return 0, false
	}
}
