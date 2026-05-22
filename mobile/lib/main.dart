import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/controls_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const ShubhamRemoteApp());
}

class ShubhamRemoteApp extends StatelessWidget {
  const ShubhamRemoteApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shubham OS Remote',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate 900
        primaryColor: const Color(0xFF06B6D4), // Cyan
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          secondary: Color(0xFF8B5CF6),
          background: Color(0xFF0F172A),
          surface: Color(0xFF1E293B),
        ),
        fontFamily: 'Roboto',
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({Key? key}) : super(key: key);

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  final ApiService _apiService = ApiService();
  int _currentIndex = 0;

  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      DashboardScreen(apiService: _apiService),
      ChatScreen(apiService: _apiService),
      ControlsScreen(apiService: _apiService),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B), // Slate 800
        selectedItemColor: const Color(0xFF06B6D4), // Cyan
        unselectedItemColor: Colors.white38,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.blur_circular),
            activeIcon: Icon(Icons.blur_circular, color: Color(0xFF06B6D4)),
            label: 'Reactor Core',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble, color: Color(0xFF06B6D4)),
            label: 'AI Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_customize),
            activeIcon: Icon(Icons.dashboard, color: Color(0xFF06B6D4)),
            label: 'Controls',
          ),
        ],
      ),
    );
  }
}
