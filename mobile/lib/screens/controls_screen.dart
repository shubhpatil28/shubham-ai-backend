import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ControlsScreen extends StatefulWidget {
  final ApiService apiService;
  const ControlsScreen({Key? key, required this.apiService}) : super(key: key);

  @override
  State<ControlsScreen> createState() => _ControlsScreenState();
}

class _ControlsScreenState extends State<ControlsScreen> {
  // Tabs
  int _activeTab = 0; // 0: PC Apps, 1: WhatsApp, 2: Memory Vault

  // WhatsApp mappings
  List<dynamic> _contacts = [];
  List<dynamic> _schedules = [];

  // Memory list
  List<dynamic> _memories = [];

  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() => _loading = true);
    final contacts = await widget.apiService.getContacts();
    final schedules = await widget.apiService.getSchedules();
    final memories = await widget.apiService.getAllMemories();
    setState(() {
      _contacts = contacts;
      _schedules = schedules;
      _memories = memories;
      _loading = false;
    });
  }

  void _sendPcCommand(String command) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Executing command: '$command'")),
    );
    await widget.apiService.sendChatMessage(command);
  }

  // --- Add Nickname Dialog ---
  void _showAddContactDialog() {
    final nicknameCtrl = TextEditingController();
    final contactNameCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Add Nickname Mapping", style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nicknameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "Nickname (e.g., Aaila, Mitra)",
                labelStyle: TextStyle(color: Color(0xFF06B6D4)),
              ),
            ),
            TextField(
              controller: contactNameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "WhatsApp Contact Name (Exactly as saved)",
                labelStyle: TextStyle(color: Color(0xFF06B6D4)),
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
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF06B6D4)),
            onPressed: () async {
              final ok = await widget.apiService.saveContact(nicknameCtrl.text, contactNameCtrl.text);
              if (ok) {
                Navigator.pop(context);
                _loadData();
              }
            },
            child: const Text("Add"),
          ),
        ],
      ),
    );
  }

  // --- Add Memory Dialog ---
  void _showAddMemoryDialog() {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    String category = "fact";
    final tagsCtrl = TextEditingController();
    double importance = 5.0;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF1E293B),
            title: const Text("Remember New Fact", style: TextStyle(color: Colors.white)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: "Title",
                      labelStyle: TextStyle(color: Color(0xFF06B6D4)),
                    ),
                  ),
                  TextField(
                    controller: contentCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: "Content / Memory Details",
                      labelStyle: TextStyle(color: Color(0xFF06B6D4)),
                    ),
                    maxLines: 3,
                  ),
                  DropdownButtonFormField<String>(
                    dropdownColor: const Color(0xFF1E293B),
                    value: category,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: "Category"),
                    items: const [
                      DropdownMenuItem(value: "goal", child: Text("Goal")),
                      DropdownMenuItem(value: "project", child: Text("Project")),
                      DropdownMenuItem(value: "ui_style", child: Text("UI Preference")),
                      DropdownMenuItem(value: "routine", child: Text("Routine")),
                      DropdownMenuItem(value: "contact", child: Text("Contact")),
                      DropdownMenuItem(value: "business_idea", child: Text("Business Idea")),
                      DropdownMenuItem(value: "fact", child: Text("General Fact")),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => category = val);
                      }
                    },
                  ),
                  TextField(
                    controller: tagsCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: "Tags (space separated)",
                      labelStyle: TextStyle(color: Color(0xFF06B6D4)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text("Importance: ", style: TextStyle(color: Colors.white)),
                      Expanded(
                        child: Slider(
                          value: importance,
                          min: 1,
                          max: 10,
                          divisions: 9,
                          activeColor: const Color(0xFF06B6D4),
                          inactiveColor: Colors.white24,
                          label: importance.round().toString(),
                          onChanged: (val) {
                            setModalState(() => importance = val);
                          },
                        ),
                      ),
                      Text(importance.round().toString(), style: const TextStyle(color: Colors.white)),
                    ],
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel", style: TextStyle(color: Colors.white54)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF06B6D4)),
                onPressed: () async {
                  final ok = await widget.apiService.saveMemory(
                    titleCtrl.text,
                    contentCtrl.text,
                    category,
                    tagsCtrl.text,
                    importance.round(),
                  );
                  if (ok) {
                    Navigator.pop(context);
                    _loadData();
                  }
                },
                child: const Text("Remember"),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text("Control Dashboard", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadData,
          )
        ],
      ),
      body: Column(
        children: [
          // Segmented Navigation Header
          Container(
            color: const Color(0xFF1E293B),
            child: Row(
              children: [
                _buildSegmentButton(0, "PC Apps", Icons.computer),
                _buildSegmentButton(1, "WhatsApp", Icons.message),
                _buildSegmentButton(2, "Memory Vault", Icons.psychology),
              ],
            ),
          ),

          // Main View Panel
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
                : _activeTab == 0
                    ? _buildPcAppsPanel()
                    : _activeTab == 1
                        ? _buildWhatsAppPanel()
                        : _buildMemoryPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(int index, String label, IconData icon) {
    final active = _activeTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? const Color(0xFF06B6D4) : Colors.transparent,
                width: 3.0,
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: active ? const Color(0xFF06B6D4) : Colors.white54, size: 20),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white54,
                  fontSize: 12,
                  fontWeight: active ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- PC Apps Panel ---
  Widget _buildPcAppsPanel() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          "LAUNCH COMPUTER APPLICATIONS",
          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
        ),
        const SizedBox(height: 16),
        _buildAppCommandRow("Notepad Editor", "Notepad app open kar", Icons.description),
        _buildAppCommandRow("System Calculator", "Calculator open kar", Icons.calculate),
        _buildAppCommandRow("Chrome Web Browser", "Chrome open kar", Icons.web),
        _buildAppCommandRow("Command Prompt", "Terminal open kar", Icons.terminal),
        const SizedBox(height: 24),
        const Text(
          "SYSTEM UTILITIES",
          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
        ),
        const SizedBox(height: 16),
        _buildAppCommandRow("Check Battery", "Battery status check kar", Icons.battery_charging_full),
        _buildAppCommandRow("PC Volume Up", "Volume level 80 kar", Icons.volume_up),
        _buildAppCommandRow("Close Notepad", "Notepad window close kar", Icons.close),
      ],
    );
  }

  Widget _buildAppCommandRow(String title, String voiceCommand, IconData icon) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF06B6D4), size: 24),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(voiceCommand, style: const TextStyle(color: Colors.white38, fontSize: 11)),
                ],
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.play_circle_fill, color: Color(0xFF06B6D4), size: 30),
            onPressed: () => _sendPcCommand(voiceCommand),
          ),
        ],
      ),
    );
  }

  // --- WhatsApp Panel ---
  Widget _buildWhatsAppPanel() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "CONTACT NICKNAMES MAPPINGS",
              style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold),
            ),
            TextButton.icon(
              icon: const Icon(Icons.add, size: 16, color: Color(0xFF06B6D4)),
              label: const Text("Add Nickname", style: TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
              onPressed: _showAddContactDialog,
            ),
          ],
        ),
        if (_contacts.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12.0),
            child: Text("No nickname mappings configured yet.", style: TextStyle(color: Colors.white30, fontSize: 13)),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _contacts.length,
            itemBuilder: (context, index) {
              final c = _contacts[index];
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white.withOpacity(0.04)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c["nickname"] ?? "", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text(c["contact_name"] ?? "", style: const TextStyle(color: Colors.white38, fontSize: 11)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.redAccent, size: 18),
                      onPressed: () async {
                        if (c["id"] != null) {
                          await widget.apiService.deleteContact(c["id"]);
                          _loadData();
                        }
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        const SizedBox(height: 24),
        const Text(
          "SCHEDULED MESSAGES",
          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        if (_schedules.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12.0),
            child: Text("No scheduled messages at this time.", style: TextStyle(color: Colors.white30, fontSize: 13)),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _schedules.length,
            itemBuilder: (context, index) {
              final s = _schedules[index];
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 6),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("To: ${s['recipient']}", style: const TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.redAccent, size: 18),
                          onPressed: () async {
                            if (s["id"] != null) {
                              await widget.apiService.deleteSchedule(s["id"]);
                              _loadData();
                            }
                          },
                        ),
                      ],
                    ),
                    Text(s["message"] ?? "", style: const TextStyle(color: Colors.white, fontSize: 13)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.access_time, color: Colors.white30, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          s["scheduled_time"] ?? "",
                          style: const TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  // --- Memory Vault Panel ---
  Widget _buildMemoryPanel() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "STORED MEMORY RECORDS",
              style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold),
            ),
            TextButton.icon(
              icon: const Icon(Icons.add, size: 16, color: Color(0xFF06B6D4)),
              label: const Text("Remember Fact", style: TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
              onPressed: _showAddMemoryDialog,
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_memories.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24.0),
            child: Center(
              child: Text("Memory is currently empty. Teach me something!", style: TextStyle(color: Colors.white30)),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _memories.length,
            itemBuilder: (context, index) {
              final m = _memories[index];
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 6),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF06B6D4).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            (m["category"] ?? "fact").toString().toUpperCase(),
                            style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                          onPressed: () async {
                            if (m["id"] != null) {
                              await widget.apiService.deleteMemory(m["id"]);
                              _loadData();
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(m["title"] ?? "", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(m["content"] ?? "", style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amberAccent, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          "Importance: ${m['importance']}/10",
                          style: const TextStyle(color: Colors.white30, fontSize: 10),
                        ),
                        const Spacer(),
                        if (m["tags"] != null && m["tags"].toString().trim().isNotEmpty)
                          Text(
                            "Tags: ${m['tags']}",
                            style: const TextStyle(color: Colors.white24, fontSize: 9, fontStyle: FontStyle.italic),
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}
