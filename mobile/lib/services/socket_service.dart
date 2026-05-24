import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  late IO.Socket socket;
  
  // Listeners can subscribe to voice state changes
  ValueNotifier<String> voiceState = ValueNotifier<String>('idle');
  ValueNotifier<String> transcript = ValueNotifier<String>('');

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  void initSocket(String serverUrl) {
    socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();

    socket.onConnect((_) {
      print('[Socket] Connected to PC Core');
    });

    socket.on('voice_state', (data) {
      if (data != null) {
        if (data['state'] != null) {
          voiceState.value = data['state'];
        }
        if (data['text'] != null) {
          transcript.value = data['text'];
        }
      }
    });

    socket.onDisconnect((_) => print('[Socket] Disconnected from PC Core'));
  }

  void toggleListening(bool enable) {
    socket.emit('toggle_listening', {'enable': enable});
  }

  void dispose() {
    socket.dispose();
  }
}
