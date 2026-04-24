package repo

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type Message struct {
	ID         int        `json:"id" db:"id"`
	SenderID   int        `json:"sender_id" db:"sender_id"`
	ReceiverID int        `json:"receiver_id" db:"receiver_id"`
	PostID     *int       `json:"post_id" db:"post_id"`
	Content    string     `json:"content" db:"content"`
	IsRead     bool       `json:"is_read" db:"is_read"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty" db:"updated_at"`
}

type MessageDTO struct {
	ID         int    `json:"id"`
	SenderID   int    `json:"senderId"`
	ReceiverID int    `json:"receiverId"`
	PostID     *int   `json:"postId,omitempty"`
	Content    string `json:"content"`
	IsRead     bool   `json:"isRead"`
	Timestamp  string `json:"timestamp"`
}

type Conversation struct {
	UserID      int          `json:"userId" db:"user_id"`
	UserName    string       `json:"userName" db:"user_name"`
	UserPhoto   *string      `json:"userPhoto" db:"user_photo"`
	LastMessage string       `json:"lastMessage" db:"last_message"`
	UnreadCount int64        `json:"unreadCount" db:"unread_count"`
	Messages    []MessageDTO `json:"messages"`
}

type MessageRepo interface {
	SendMessage(senderID, receiverID int, postID *int, content string) (*MessageDTO, error)
	GetConversations(userID, perConversationLimit int) ([]Conversation, error)
	GetConversationHistory(userID, otherUserID, limit, offset int) ([]MessageDTO, error)
	MarkAsRead(receiverID, senderID int) (int64, error)
	GetUnreadCount(userID int) (int64, error)
}

type messageRepo struct {
	db *sqlx.DB
}

func NewMessageRepo(db *sqlx.DB) MessageRepo {
	return &messageRepo{db: db}
}

func (r *messageRepo) SendMessage(senderID, receiverID int, postID *int, content string) (*MessageDTO, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, fmt.Errorf("message content cannot be empty")
	}

	query := `
		INSERT INTO messages (sender_id, receiver_id, post_id, content, is_read)
		VALUES ($1, $2, $3, $4, false)
		RETURNING id, sender_id, receiver_id, post_id, content, is_read, created_at
	`

	var msg Message
	err := r.db.QueryRowx(query, senderID, receiverID, postID, content).StructScan(&msg)
	if err != nil {
		return nil, err
	}

	dto := toMessageDTO(msg)
	return &dto, nil
}

func (r *messageRepo) GetConversations(userID, perConversationLimit int) ([]Conversation, error) {
	if perConversationLimit <= 0 {
		perConversationLimit = 50
	}

	query := `
		SELECT
			u.id AS user_id,
			u.name AS user_name,
			u.avatar_url AS user_photo,
			lm.content AS last_message,
			COALESCE(uc.unread_count, 0) AS unread_count
		FROM (
			SELECT
				CASE
					WHEN sender_id = $1 THEN receiver_id
					ELSE sender_id
				END AS other_user_id,
				MAX(created_at) AS last_time
			FROM messages
			WHERE sender_id = $1 OR receiver_id = $1
			GROUP BY 1
		) conv
		JOIN users u ON u.id = conv.other_user_id
		JOIN LATERAL (
			SELECT content, created_at
			FROM messages m2
			WHERE
				(m2.sender_id = $1 AND m2.receiver_id = conv.other_user_id)
				OR
				(m2.sender_id = conv.other_user_id AND m2.receiver_id = $1)
			ORDER BY m2.created_at DESC, m2.id DESC
			LIMIT 1
		) lm ON true
		LEFT JOIN (
			SELECT sender_id, COUNT(*)::bigint AS unread_count
			FROM messages
			WHERE receiver_id = $1 AND is_read = false
			GROUP BY sender_id
		) uc ON uc.sender_id = conv.other_user_id
		ORDER BY conv.last_time DESC
	`

	var conversations []Conversation
	err := r.db.Select(&conversations, query, userID)
	if err != nil {
		return nil, err
	}

	if conversations == nil {
		return []Conversation{}, nil
	}

	for i := range conversations {
		history, histErr := r.GetConversationHistory(userID, conversations[i].UserID, perConversationLimit, 0)
		if histErr != nil {
			return nil, histErr
		}
		conversations[i].Messages = history
	}

	return conversations, nil
}

func (r *messageRepo) GetConversationHistory(userID, otherUserID, limit, offset int) ([]MessageDTO, error) {
	if limit <= 0 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, sender_id, receiver_id, post_id, content, is_read, created_at
		FROM messages
		WHERE
			(sender_id = $1 AND receiver_id = $2)
			OR
			(sender_id = $2 AND receiver_id = $1)
		ORDER BY created_at ASC, id ASC
		LIMIT $3 OFFSET $4
	`

	var rows []Message
	err := r.db.Select(&rows, query, userID, otherUserID, limit, offset)
	if err != nil {
		return nil, err
	}

	if rows == nil {
		return []MessageDTO{}, nil
	}

	result := make([]MessageDTO, 0, len(rows))
	for _, row := range rows {
		dto := toMessageDTO(row)
		result = append(result, dto)
	}

	return result, nil
}

func (r *messageRepo) MarkAsRead(receiverID, senderID int) (int64, error) {
	query := `
		UPDATE messages
		SET is_read = true
		WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
	`
	res, err := r.db.Exec(query, receiverID, senderID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *messageRepo) GetUnreadCount(userID int) (int64, error) {
	query := `SELECT COUNT(*)::bigint FROM messages WHERE receiver_id = $1 AND is_read = false`
	var count sql.NullInt64
	err := r.db.Get(&count, query, userID)
	if err != nil {
		return 0, err
	}
	if !count.Valid {
		return 0, nil
	}
	return count.Int64, nil
}

func toMessageDTO(msg Message) MessageDTO {
	return MessageDTO{
		ID:         msg.ID,
		SenderID:   msg.SenderID,
		ReceiverID: msg.ReceiverID,
		PostID:     msg.PostID,
		Content:    msg.Content,
		IsRead:     msg.IsRead,
		Timestamp:  msg.CreatedAt.Format(time.RFC3339),
	}
}
