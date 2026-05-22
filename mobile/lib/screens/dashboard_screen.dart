import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final ApiService apiService;
  const DashboardScreen({Key? key, required this.apiService}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TickerProviderStateMixin {
  // Speech to Text
  final SpeechToText _speechToText = SpeechToText();
  bool _speechEnabled = false;
  String _wordsSpoken = "";
  bool _isListening = false;

  // Connection status
  String _backendStatus = "checking";
  bool _voiceActiveOnPc = false;

  // Animations
  late AnimationController _orbController;
  late AnimationController _breathingController;
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _checkServerStatus();

    // Orb rotation animation
    _orbController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    // Orb breathing animation
    _breathingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    // Audio wave pulsing animation
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
  }

  @override
  void dispose() {
    _orbController.dispose();
    _breathingController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  // Initialize Speech to Text
  void _initSpeech() async {
    try {
      _speechEnabled = await _speechToText.initialize();
      setState(() {});
    } catch (e) {
      print("Speech initialization error: $e");
    }
  }

  // Start listening locally
  void _startListening() async {
    if (!_speechEnabled) return;
    _waveController.repeat(reverse: true);
    setState(() {
      _isListening = true;
      _wordsSpoken = "Listening...";
    });

    await _speechToText.listen(
      onResult: _onSpeechResult,
      localeId: 'en_IN', // Target Indian accent (can capture mixed Hindi/Marathi terms)
    );
  }

  // Stop listening locally
  void _stopListening() async {
    _waveController.stop();
    _waveController.reset();
    await _speechToText.stop();
    setState(() {
      _isListening = false;
    });

    if (_wordsSpoken.isNotEmpty && _wordsSpoken != "Listening...") {
      _sendToBackend(_wordsSpoken);
    }
  }

  // Speech callback
  void _onSpeechResult(SpeechRecognitionResult result) {
    setState(() {
      _wordsSpoken = result.recognizedWords;
    });
  }

  // Send query to PC Flask API
  void _sendToBackend(String text) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Sending: '$text' to Shubham OS...")),
    );
    final response = await widget.apiService.sendChatMessage(text);
    if (response.containsKey("error")) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: ${response['error']}"),
          backgroundColor: Colors.redAccent,
        ),
      );
    } else {
      final reply = response['response'] ?? "No response";
      final actionResult = response['action_result'];
      
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A).withOpacity(0.9),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFF06B6D4), width: 1.5),
          ),
          title: Row(
            children: const [
              Icon(Icons.smart_toy, color: Color(0xFF06B6D4)),
              SizedBox(width: 8),
              Text("AI Buddy Response", style: TextStyle(color: Colors.white)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                reply,
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),
              if (actionResult != null) ...[
                const SizedBox(height: 12),
                Text(
                  "Action Executed: $actionResult",
                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 13, fontStyle: FontStyle.italic),
                ),
              ]
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("OK", style: TextStyle(color: Color(0xFF06B6D4))),
            ),
          ],
        ),
      );
    }
  }

  // Poll server status
  void _checkServerStatus() async {
    final status = await widget.apiService.getSystemStatus();
    if (status["status"] == "online") {
      setState(() {
        _backendStatus = "online";
        _voiceActiveOnPc = status["voice_active"] ?? false;
      });
    } else {
      setState(() {
        _backendStatus = "offline";
        _voiceActiveOnPc = false;
      });
    }
  }

  // Show IP configurations
  void _showSettingsDialog() async {
    final currentIp = await widget.apiService.getIp();
    final controller = TextEditingController(text: currentIp);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("PC Server Settings", style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Enter the Local IP Address and port of your PC (e.g., 192.168.1.15:5000)",
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "Server IP & Port",
                labelStyle: TextStyle(color: Color(0xFF06B6D4)),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF06B6D4)),
                ),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white30),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel", style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF06B6D4),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              await widget.apiService.saveIp(controller.text);
              Navigator.pop(context);
              _checkServerStatus();
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final primaryColor = const Color(0xFF06B6D4); // Neon Cyan
    final secondaryColor = const Color(0xFF8B5CF6); // Purple

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      body: Stack(
        children: [
          // Background subtle gradients for futuristic look
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: primaryColor.withOpacity(0.15),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            right: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: secondaryColor.withOpacity(0.15),
              ),
            ),
          ),

          // Main Screen Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // App Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "SHUBHAM OS",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2.0,
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _backendStatus == "online"
                                      ? Colors.greenAccent
                                      : (_backendStatus == "checking" ? Colors.amberAccent : Colors.redAccent),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _backendStatus == "online"
                                    ? "CONNECTED TO PC"
                                    : (_backendStatus == "checking" ? "SEARCHING PC..." : "DISCONNECTED"),
                                style: TextStyle(
                                  color: _backendStatus == "online"
                                      ? Colors.greenAccent
                                      : (_backendStatus == "checking" ? Colors.amberAccent : Colors.redAccent),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.refresh, color: Colors.white70),
                            onPressed: _checkServerStatus,
                          ),
                          IconButton(
                            icon: const Icon(Icons.settings, color: Colors.white70),
                            onPressed: _showSettingsDialog,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Spacer(),

                  // Futuristic AI Orb Visualization
                  GestureDetector(
                    onTap: _isListening ? _stopListening : _startListening,
                    child: Center(
                      child: AnimatedBuilder(
                        animation: Listenable.merge([_orbController, _breathingController]),
                        builder: (context, child) {
                          // Scaling factor based on breathing animation + voice state
                          final double breatheVal = _breathingController.value;
                          final double scale = 1.0 + (breatheVal * 0.05) + (_isListening ? 0.08 : 0.0);

                          return Transform.scale(
                            scale: scale,
                            child: SizedBox(
                              width: 200,
                              height: 200,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  // External glowing aura
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: (_isListening ? secondaryColor : primaryColor).withOpacity(0.25),
                                          blurRadius: 30 + (breatheVal * 15),
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Rotating Outer Concentric Ring
                                  Transform.rotate(
                                    angle: _orbController.value * 2 * math.pi,
                                    child: CustomPaint(
                                      painter: OrbRingPainter(
                                        color: primaryColor.withOpacity(0.6),
                                        dashCount: 8,
                                        strokeWidth: 2.0,
                                      ),
                                      size: const Size(190, 190),
                                    ),
                                  ),
                                  // Rotating Inner Concentric Ring
                                  Transform.rotate(
                                    angle: -_orbController.value * 4 * math.pi,
                                    child: CustomPaint(
                                      painter: OrbRingPainter(
                                        color: secondaryColor.withOpacity(0.8),
                                        dashCount: 5,
                                        strokeWidth: 1.5,
                                        radiusOffset: -20,
                                      ),
                                      size: const Size(190, 190),
                                    ),
                                  ),
                                  // Central Core Glowing Orb
                                  Container(
                                    width: 110,
                                    height: 110,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: RadialGradient(
                                        colors: [
                                          const Color(0xFFFFFFFF),
                                          (_isListening ? secondaryColor : primaryColor).withOpacity(0.8),
                                          (_isListening ? const Color(0xFF4C1D95) : const Color(0xFF0891B2)).withOpacity(0.9),
                                        ],
                                        stops: const [0.0, 0.4, 1.0],
                                      ),
                                    ),
                                    child: Icon(
                                      _isListening ? Icons.mic : Icons.online_prediction,
                                      color: Colors.white,
                                      size: 40,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Voice Wave visualizer
                  if (_isListening) ...[
                    AnimatedBuilder(
                      animation: _waveController,
                      builder: (context, child) {
                        return Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(7, (index) {
                            // Calculate variable bar heights dynamically using sinusoids
                            final val = math.sin((_waveController.value * 2 * math.pi) + (index * 0.8));
                            final height = 15.0 + (val.abs() * 35.0);

                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: 5,
                              height: height,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                gradient: LinearGradient(
                                  begin: Alignment.bottomCenter,
                                  end: Alignment.topCenter,
                                  colors: [secondaryColor, primaryColor],
                                ),
                              ),
                            );
                          }),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Speech Text Display
                  Container(
                    width: size.width,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: Text(
                      _isListening
                          ? (_wordsSpoken.isEmpty ? "Say something..." : _wordsSpoken)
                          : (_wordsSpoken.isEmpty ? "Tap AI Orb to Speak (Dost/Bhai voice control)" : "Latest Query: $_wordsSpoken"),
                      style: TextStyle(
                        color: _isListening ? Colors.white : Colors.white60,
                        fontSize: 14,
                        fontStyle: _isListening ? FontStyle.normal : FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Quick Command Shortcuts Widget
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "QUICK LAUNCH SHORTCUTS",
                        style: TextStyle(
                          color: Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildQuickShortcutCard(
                            icon: Icons.open_in_new,
                            title: "Open Notepad",
                            subtitle: "Notepad open kar",
                            onTap: () => _sendToBackend("Notepad open kar"),
                          ),
                          _buildQuickShortcutCard(
                            icon: Icons.language,
                            title: "Search YouTube",
                            subtitle: "YouTube search",
                            onTap: () => _sendToBackend("YouTube var software engineering videos search kar"),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickShortcutCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.06)),
          ),
          child: Row(
            children: [
              Icon(icon, color: const Color(0xFF06B6D4), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(color: Colors.white38, fontSize: 9),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Custom Painter to draw futuristic rotating dash rings
class OrbRingPainter extends CustomPainter {
  final Color color;
  final int dashCount;
  final double strokeWidth;
  final double radiusOffset;

  OrbRingPainter({
    required this.color,
    required this.dashCount,
    required this.strokeWidth,
    this.radiusOffset = 0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final double radius = (math.min(size.width, size.height) / 2) + radiusOffset;
    final Offset center = Offset(size.width / 2, size.height / 2);

    final double arcLength = (2 * math.pi) / (dashCount * 2);

    for (int i = 0; i < dashCount; i++) {
      final double startAngle = i * (2 * arcLength);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        arcLength,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
