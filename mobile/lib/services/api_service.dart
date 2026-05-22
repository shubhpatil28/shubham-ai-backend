import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _defaultIp = "192.168.1.100:5000"; // Fallback default
  static const String _ipKey = "backend_ip";

  // Get active base URL
  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString(_ipKey) ?? _defaultIp;
    // Ensure protocol is included
    if (!ip.startsWith("http://") && !ip.startsWith("https://")) {
      return "http://$ip";
    }
    return ip;
  }

  // Save backend IP address
  Future<void> saveIp(String ip) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_ipKey, ip.trim());
  }

  // Fetch current IP setting
  Future<String> getIp() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_ipKey) ?? _defaultIp;
  }

  // Chat API
  Future<Map<String, dynamic>> sendChatMessage(String message) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/chat"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"message": message}),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {"error": "Server error: ${response.statusCode}"};
      }
    } catch (e) {
      return {"error": "Connection failed: $e"};
    }
  }

  // Chat History
  Future<List<dynamic>> getChatHistory() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/chat-history"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Chat history error: $e");
    }
    return [];
  }

  // System Status
  Future<Map<String, dynamic>> getSystemStatus() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/status"))
          .timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Status connection error: $e");
    }
    return {"status": "offline", "voice_active": false};
  }

  // Memory Vault APIs
  Future<List<dynamic>> getAllMemories() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/memory"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Memory retrieval error: $e");
    }
    return [];
  }

  Future<List<dynamic>> searchMemory(String query) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/api/memory/search?query=${Uri.encodeComponent(query)}"),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Memory search error: $e");
    }
    return [];
  }

  Future<Map<String, dynamic>> getMemoryInsights() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/memory/insights"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Memory insights error: $e");
    }
    return {};
  }

  Future<bool> saveMemory(String title, String content, String category, String tags, int importance) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/memory"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "title": title,
          "content": content,
          "category": category,
          "tags": tags,
          "importance": importance
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Save memory error: $e");
      return false;
    }
  }

  Future<bool> deleteMemory(int id) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.delete(Uri.parse("$baseUrl/api/memory/$id"));
      return response.statusCode == 200;
    } catch (e) {
      print("Delete memory error: $e");
      return false;
    }
  }

  // WhatsApp APIs
  Future<List<dynamic>> getContacts() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/whatsapp/contacts"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Get contacts error: $e");
    }
    return [];
  }

  Future<bool> saveContact(String nickname, String contactName) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/whatsapp/contacts"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"nickname": nickname, "contact_name": contactName}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Save contact error: $e");
      return false;
    }
  }

  Future<bool> deleteContact(int id) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.delete(Uri.parse("$baseUrl/api/whatsapp/contacts/$id"));
      return response.statusCode == 200;
    } catch (e) {
      print("Delete contact error: $e");
      return false;
    }
  }

  Future<List<dynamic>> getSchedules() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(Uri.parse("$baseUrl/api/whatsapp/schedule"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Get schedules error: $e");
    }
    return [];
  }

  Future<bool> saveSchedule(String recipient, String message, String scheduledTime, [String? filePath]) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/whatsapp/schedule"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "recipient": recipient,
          "message": message,
          "scheduled_time": scheduledTime,
          "file_path": filePath ?? ""
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print("Save schedule error: $e");
      return false;
    }
  }

  Future<bool> deleteSchedule(int id) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.delete(Uri.parse("$baseUrl/api/whatsapp/schedule/$id"));
      return response.statusCode == 200;
    } catch (e) {
      print("Delete schedule error: $e");
      return false;
    }
  }
}
