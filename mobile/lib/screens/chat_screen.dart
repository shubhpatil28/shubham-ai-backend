import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  final ApiService apiService;
  const ChatScreen({Key? key, required this.apiService}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadChatHistory();
  }

  void _loadChatHistory() async {
    setState(() => _isLoading = true);
    final history = await widget.apiService.getChatHistory();
    setState(() {
      _messages = history.map((e) => {
        "sender": e["sender"] ?? "User",
        "text": e["message"] ?? "",
        "timestamp": e["timestamp"] ?? DateTime.now().toIsoformatString(),
      }).toList();
      _isLoading = false;
    });
    _scrollToBottom();
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    final timestamp = DateTime.now().toIsoformatString();

    setState(() {
      _messages.add({
        "sender": "User",
        "text": text,
        "timestamp": timestamp,
      });
    });
    _scrollToBottom();

    final response = await widget.apiService.sendChatMessage(text);
    if (response.containsKey("error")) {
      setState(() {
        _messages.add({
          "sender": "Buddy",
          "text": "Server connect failed: ${response['error']}",
          "timestamp": DateTime.now().toIsoformatString(),
        });
      });
    } else {
      setState(() {
        _messages.add({
          "sender": "Buddy",
          "text": response["response"] ?? "No response",
          "timestamp": DateTime.now().toIsoformatString(),
        });
      });
    }
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF06B6D4); // Neon Cyan

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.greenAccent,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              "AI Buddy Chat",
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadChatHistory,
          ),
        ],
      ),
      body: Column(
        children: [
          // Message List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
                : _messages.isEmpty
                    ? const Center(
                        child: Text(
                          "No chat history found. Start chatting!",
                          style: TextStyle(color: Colors.white38),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isUser = msg["sender"].toString().toLowerCase() == "user";
                          return _buildChatBubble(msg["text"], isUser, msg["timestamp"]);
                        },
                      ),
          ),

          // Message Input Field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFF1E293B),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "Type message in Marathi/English...",
                      hintStyle: const TextStyle(color: Colors.white38),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatBubble(String text, bool isUser, String isoTimestamp) {
    // Format timestamp
    String formattedTime = "";
    try {
      final dt = DateTime.parse(isoTimestamp);
      formattedTime = DateFormat('hh:mm a').format(dt);
    } catch (_) {}

    final bubbleBg = isUser
        ? const Color(0xFF06B6D4).withOpacity(0.2)
        : const Color(0xFF8B5CF6).withOpacity(0.15);
    final borderCol = isUser ? const Color(0xFF06B6D4) : const Color(0xFF8B5CF6);

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: bubbleBg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: isUser ? const Radius.circular(12) : Radius.zero,
            bottomRight: isUser ? Radius.zero : const Radius.circular(12),
          ),
          border: Border.all(color: borderCol.withOpacity(0.4), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 15),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  formattedTime,
                  style: const TextStyle(color: Colors.white30, fontSize: 9),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

extension DateTimeExtensions on DateTime {
  String toIsoformatString() {
    return toIso8601String();
  }
}
