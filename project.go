package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var broadcast = make(chan Message)
var clients = make(map[*websocket.Conn]string)

type Message struct {
	Type     string `json:"type"`
	Username string `json:"username,omitempty"`
	Message  string `json:"message,omitempty"`
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	go handleConnection(conn)
}

var chatLogs []Message

func handleConnection(conn *websocket.Conn) {
	defer func() {
		delete(clients, conn)
		conn.Close()
	}()

	for {
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println(err)
			return
		}
		switch message.Type {
		case "JOIN":
			clients[conn] = message.Username
			log.Printf("%s joined the chat", message.Username)
		case "MESSAGE":
			message.Username = clients[conn]
			broadcast <- message
			chatLogs = append(chatLogs, message)
		}
	}
}

func BroadcastMessages() {
	for {
		message := <-broadcast
		for client := range clients {
			err := client.WriteJSON(message)
			if err != nil {
				log.Println(err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func getChatLogs(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(chatLogs)
}

func main() {
	go BroadcastMessages()
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(chatLogs)
	})
	fmt.Println("Server started on :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
