"""
🧠 Shubham AI Memory Engine
============================
A comprehensive semantic memory system with:
- Structured SQLite storage (goals, projects, contacts, routines, ideas, preferences)
- Semantic similarity search using TF-IDF vectorization
- JSON backup & restore for portability
- Auto-categorization of memories
- Memory importance scoring and decay
- Contextual recall based on current conversation

Architecture:
  MemoryEngine
  ├── StructuredMemory (SQLite tables with categories)
  ├── SemanticIndex (TF-IDF + cosine similarity for recall)
  ├── JSONBackup (full export/import)
  └── MemoryInsights (summaries, patterns, recommendations)
"""

import os
import json
import math
import sqlite3
import datetime
import re
from collections import Counter, defaultdict
from config import DB_PATH

# ============================================================
# TF-IDF Semantic Memory (No external API needed)
# ============================================================

class SemanticIndex:
    """
    Lightweight TF-IDF based semantic search engine.
    Uses term frequency-inverse document frequency for similarity.
    No external dependencies — pure Python! 🐍
    """

    def __init__(self):
        self.documents = {}      # doc_id -> original text
        self.doc_vectors = {}    # doc_id -> {term: tfidf_score}
        self.idf_cache = {}      # term -> IDF value
        self.vocab = set()

    def _tokenize(self, text):
        """Simple tokenizer: lowercase, split on non-alphanumeric, remove stopwords."""
        stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
            'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
            'through', 'after', 'over', 'between', 'out', 'up', 'it', 'its',
            'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
            'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
            'and', 'but', 'or', 'not', 'no', 'so', 'if', 'then', 'than',
            'very', 'just', 'also', 'more', 'some', 'any', 'all', 'each',
            # Marathi common particles
            'cha', 'chi', 'che', 'la', 'madhe', 'var', 'ani', 'pan', 'tar',
            'ka', 'kay', 'ahe', 'aahe', 'hota', 'hoti', 'kela', 'keli',
        }
        tokens = re.findall(r'[a-zA-Z0-9\u0900-\u097F]+', text.lower())
        return [t for t in tokens if t not in stopwords and len(t) > 1]

    def _compute_tf(self, tokens):
        """Term frequency: count / total tokens."""
        counter = Counter(tokens)
        total = len(tokens) if tokens else 1
        return {term: count / total for term, count in counter.items()}

    def _recompute_idf(self):
        """Inverse document frequency across all indexed documents."""
        n_docs = len(self.documents)
        if n_docs == 0:
            return
        term_doc_count = Counter()
        for doc_id, text in self.documents.items():
            tokens = set(self._tokenize(text))
            for token in tokens:
                term_doc_count[token] += 1
        self.idf_cache = {
            term: math.log((1 + n_docs) / (1 + count)) + 1
            for term, count in term_doc_count.items()
        }

    def _compute_tfidf(self, tokens):
        """TF-IDF vector for a list of tokens."""
        tf = self._compute_tf(tokens)
        return {
            term: tf_val * self.idf_cache.get(term, 1.0)
            for term, tf_val in tf.items()
        }

    def _cosine_similarity(self, vec_a, vec_b):
        """Cosine similarity between two sparse vectors (dicts)."""
        common_terms = set(vec_a.keys()) & set(vec_b.keys())
        if not common_terms:
            return 0.0
        dot_product = sum(vec_a[t] * vec_b[t] for t in common_terms)
        mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
        mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot_product / (mag_a * mag_b)

    def index_document(self, doc_id, text):
        """Add or update a document in the semantic index."""
        self.documents[doc_id] = text
        self._recompute_idf()
        # Recompute TF-IDF for all documents after IDF change
        for did, doc_text in self.documents.items():
            tokens = self._tokenize(doc_text)
            self.doc_vectors[did] = self._compute_tfidf(tokens)

    def remove_document(self, doc_id):
        """Remove a document from the index."""
        self.documents.pop(doc_id, None)
        self.doc_vectors.pop(doc_id, None)
        if self.documents:
            self._recompute_idf()

    def search(self, query, top_k=5, min_score=0.05):
        """
        Semantic search: find top-k most similar documents to the query.
        Returns list of (doc_id, similarity_score).
        """
        if not self.documents:
            return []
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
        query_vec = self._compute_tfidf(query_tokens)
        scores = []
        for doc_id, doc_vec in self.doc_vectors.items():
            sim = self._cosine_similarity(query_vec, doc_vec)
            if sim >= min_score:
                scores.append((doc_id, round(sim, 4)))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

    def get_stats(self):
        """Returns index statistics."""
        return {
            "total_documents": len(self.documents),
            "vocabulary_size": len(self.idf_cache),
            "top_terms": sorted(self.idf_cache.items(), key=lambda x: x[1], reverse=True)[:20]
        }


# ============================================================
# Memory Categories
# ============================================================

MEMORY_CATEGORIES = {
    "goal":         "User's personal and professional goals",
    "project":      "Ongoing projects, codebases, and builds",
    "ui_style":     "Favorite UI/UX design preferences and themes",
    "routine":      "Daily routines, habits, schedules",
    "contact":      "People, contacts, relationships",
    "business_idea": "Business ideas, startup concepts, monetization plans",
    "preference":   "General preferences (food, music, tech stack, etc.)",
    "fact":         "Random facts about the user",
    "skill":        "Skills and expertise areas",
    "note":         "General notes and observations",
}


# ============================================================
# Memory Engine Core
# ============================================================

class MemoryEngine:
    """
    🧠 The brain of Shubham AI.
    Handles structured storage, semantic recall, JSON backups,
    and intelligent memory management.
    """

    def __init__(self, db_path=None):
        self.db_path = db_path or DB_PATH
        self.semantic_index = SemanticIndex()
        self._init_tables()
        self._load_semantic_index()
        print("[MemoryEngine] Initialized with semantic index loaded.")

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self):
        """Create the semantic_memories table if it doesn't exist."""
        conn = self._get_conn()
        cursor = conn.cursor()

        # Main semantic memory table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS semantic_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL DEFAULT 'fact',
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                tags TEXT DEFAULT '',
                importance INTEGER DEFAULT 5,
                access_count INTEGER DEFAULT 0,
                last_accessed DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        """)

        # Memory associations table (links between memories)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memory_associations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory_id_a INTEGER NOT NULL,
                memory_id_b INTEGER NOT NULL,
                relationship TEXT DEFAULT 'related',
                strength REAL DEFAULT 1.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id_a) REFERENCES semantic_memories(id),
                FOREIGN KEY (memory_id_b) REFERENCES semantic_memories(id)
            )
        """)

        # Memory access log (tracks when memories are recalled)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memory_access_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory_id INTEGER NOT NULL,
                context TEXT,
                accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id) REFERENCES semantic_memories(id)
            )
        """)

        conn.commit()
        conn.close()

    def _load_semantic_index(self):
        """Load all active memories into the semantic index on startup."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, content, category, tags FROM semantic_memories WHERE is_active = 1")
        rows = cursor.fetchall()
        conn.close()
        for row in rows:
            doc_text = f"{row['category']} {row['title']} {row['content']} {row['tags']}"
            self.semantic_index.index_document(row['id'], doc_text)
        print(f"[MemoryEngine] Loaded {len(rows)} memories into semantic index.")

    # --------------------------------------------------------
    # CRUD Operations
    # --------------------------------------------------------

    def remember(self, title, content, category="fact", tags="", importance=5):
        """
        Store a new memory.
        Returns the memory ID.
        """
        category = category.lower().strip()
        if category not in MEMORY_CATEGORIES:
            category = "fact"

        conn = self._get_conn()
        cursor = conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO semantic_memories (category, title, content, tags, importance, created_at, updated_at, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (category, title.strip(), content.strip(), tags.strip(), importance, now, now, now))
        conn.commit()
        mem_id = cursor.lastrowid
        conn.close()

        # Index for semantic search
        doc_text = f"{category} {title} {content} {tags}"
        self.semantic_index.index_document(mem_id, doc_text)

        print(f"[MemoryEngine] Remembered: [{category}] {title} (ID: {mem_id})")
        return mem_id

    def recall(self, query, top_k=5, category=None):
        """
        Semantically recall memories related to a query.
        Optionally filter by category.
        Returns list of memory dicts with similarity scores.
        """
        results = self.semantic_index.search(query, top_k=top_k * 2)
        if not results:
            return []

        memory_ids = [r[0] for r in results]
        scores = {r[0]: r[1] for r in results}

        conn = self._get_conn()
        cursor = conn.cursor()

        placeholders = ','.join('?' * len(memory_ids))
        sql = f"SELECT * FROM semantic_memories WHERE id IN ({placeholders}) AND is_active = 1"
        params = list(memory_ids)

        if category:
            sql += " AND category = ?"
            params.append(category.lower())

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Update access count and last_accessed
        now = datetime.datetime.now().isoformat()
        for row in rows:
            cursor.execute(
                "UPDATE semantic_memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?",
                (now, row['id'])
            )
            cursor.execute(
                "INSERT INTO memory_access_log (memory_id, context, accessed_at) VALUES (?, ?, ?)",
                (row['id'], query[:200], now)
            )
        conn.commit()
        conn.close()

        # Build response with scores
        memories = []
        for row in rows:
            mem = dict(row)
            mem['similarity_score'] = scores.get(row['id'], 0)
            memories.append(mem)

        # Sort by similarity
        memories.sort(key=lambda x: x['similarity_score'], reverse=True)
        return memories[:top_k]

    def update_memory(self, memory_id, title=None, content=None, category=None, tags=None, importance=None):
        """Update an existing memory."""
        conn = self._get_conn()
        cursor = conn.cursor()

        # Fetch current values
        cursor.execute("SELECT * FROM semantic_memories WHERE id = ?", (memory_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False

        # Apply updates
        new_title = title or row['title']
        new_content = content or row['content']
        new_category = category or row['category']
        new_tags = tags if tags is not None else row['tags']
        new_importance = importance if importance is not None else row['importance']
        now = datetime.datetime.now().isoformat()

        cursor.execute("""
            UPDATE semantic_memories
            SET title = ?, content = ?, category = ?, tags = ?, importance = ?, updated_at = ?
            WHERE id = ?
        """, (new_title, new_content, new_category, new_tags, new_importance, now, memory_id))
        conn.commit()
        conn.close()

        # Re-index
        doc_text = f"{new_category} {new_title} {new_content} {new_tags}"
        self.semantic_index.index_document(memory_id, doc_text)
        return True

    def forget(self, memory_id):
        """Soft-delete a memory (mark as inactive)."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE semantic_memories SET is_active = 0 WHERE id = ?", (memory_id,))
        conn.commit()
        conn.close()
        self.semantic_index.remove_document(memory_id)
        print(f"[MemoryEngine] Forgot memory ID: {memory_id}")
        return True

    def hard_delete(self, memory_id):
        """Permanently delete a memory."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memory_associations WHERE memory_id_a = ? OR memory_id_b = ?",
                        (memory_id, memory_id))
        cursor.execute("DELETE FROM memory_access_log WHERE memory_id = ?", (memory_id,))
        cursor.execute("DELETE FROM semantic_memories WHERE id = ?", (memory_id,))
        conn.commit()
        conn.close()
        self.semantic_index.remove_document(memory_id)
        return True

    # --------------------------------------------------------
    # Category-Based Queries
    # --------------------------------------------------------

    def get_by_category(self, category, limit=20):
        """Get all memories in a category."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM semantic_memories WHERE category = ? AND is_active = 1 ORDER BY importance DESC, updated_at DESC LIMIT ?",
            (category.lower(), limit)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_goals(self):
        return self.get_by_category("goal")

    def get_projects(self):
        return self.get_by_category("project")

    def get_ui_preferences(self):
        return self.get_by_category("ui_style")

    def get_routines(self):
        return self.get_by_category("routine")

    def get_contacts(self):
        return self.get_by_category("contact")

    def get_business_ideas(self):
        return self.get_by_category("business_idea")

    def get_all_memories(self, include_inactive=False):
        """Get all memories, optionally including inactive ones."""
        conn = self._get_conn()
        cursor = conn.cursor()
        if include_inactive:
            cursor.execute("SELECT * FROM semantic_memories ORDER BY updated_at DESC")
        else:
            cursor.execute("SELECT * FROM semantic_memories WHERE is_active = 1 ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # --------------------------------------------------------
    # Memory Associations
    # --------------------------------------------------------

    def associate(self, memory_id_a, memory_id_b, relationship="related", strength=1.0):
        """Create an association between two memories."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO memory_associations (memory_id_a, memory_id_b, relationship, strength)
            VALUES (?, ?, ?, ?)
        """, (memory_id_a, memory_id_b, relationship, strength))
        conn.commit()
        conn.close()
        return True

    def get_associated(self, memory_id):
        """Get all memories associated with a given memory."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sm.*, ma.relationship, ma.strength
            FROM memory_associations ma
            JOIN semantic_memories sm ON (
                CASE WHEN ma.memory_id_a = ? THEN ma.memory_id_b ELSE ma.memory_id_a END
            ) = sm.id
            WHERE (ma.memory_id_a = ? OR ma.memory_id_b = ?) AND sm.is_active = 1
        """, (memory_id, memory_id, memory_id))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # --------------------------------------------------------
    # Auto-Categorization
    # --------------------------------------------------------

    def auto_categorize(self, text):
        """
        Automatically determine the category of a memory based on keywords.
        Returns the best-guess category string.
        """
        text_lower = text.lower()

        category_keywords = {
            "goal": ["goal", "target", "achieve", "aim", "objective", "want to", "dream",
                     "udyog", "dhyey", "mission", "plan", "aspiration"],
            "project": ["project", "build", "develop", "code", "app", "website", "repo",
                        "github", "deploy", "framework", "api", "frontend", "backend",
                        "flutter", "react", "python", "banav"],
            "ui_style": ["design", "ui", "ux", "color", "theme", "font", "layout",
                         "dark mode", "glassmorphism", "animation", "css", "tailwind",
                         "futuristic", "premium", "aesthetic"],
            "routine": ["routine", "morning", "evening", "daily", "wake up", "sleep",
                        "exercise", "gym", "study", "schedule", "habit", "rozcha"],
            "contact": ["contact", "friend", "family", "phone", "email", "call",
                        "whatsapp", "person", "colleague", "mitra", "dost", "bhai"],
            "business_idea": ["business", "startup", "idea", "revenue", "profit",
                              "market", "customer", "product", "saas", "agency",
                              "freelance", "monetize", "earn", "income", "paisa"],
            "preference": ["prefer", "like", "favorite", "love", "enjoy", "best",
                           "avadta", "choice", "taste"],
            "skill": ["skill", "learn", "know", "expert", "proficient", "experience",
                      "certificate", "course", "tutorial"],
        }

        scores = {}
        for cat, keywords in category_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[cat] = score

        if scores:
            return max(scores, key=scores.get)
        return "note"

    def smart_remember(self, text, importance=5):
        """
        Automatically categorize and store a memory.
        Splits title from content if possible.
        """
        category = self.auto_categorize(text)

        # Use first sentence or first 60 chars as title
        sentences = re.split(r'[.!?\n]', text, maxsplit=1)
        title = sentences[0].strip()[:80]
        content = text

        # Auto-generate tags from significant words
        tokens = self.semantic_index._tokenize(text)
        tag_counts = Counter(tokens)
        tags = " ".join([t for t, _ in tag_counts.most_common(5)])

        return self.remember(title, content, category, tags, importance)

    # --------------------------------------------------------
    # Context Builder for AI Prompts
    # --------------------------------------------------------

    def build_context(self, query="", max_items=10):
        """
        Build a context string for the AI prompt based on:
        1. Semantically relevant memories (if query provided)
        2. High-importance memories
        3. Recently accessed memories
        """
        context_parts = []

        # 1. Semantic recall
        if query:
            semantic_results = self.recall(query, top_k=max_items // 2)
            if semantic_results:
                context_parts.append("=== Relevant Memories ===")
                for mem in semantic_results:
                    context_parts.append(
                        f"[{mem['category'].upper()}] {mem['title']}: {mem['content'][:150]} "
                        f"(importance: {mem['importance']}/10, score: {mem.get('similarity_score', 0)})"
                    )

        # 2. High-importance memories
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM semantic_memories
            WHERE is_active = 1 AND importance >= 7
            ORDER BY importance DESC, updated_at DESC
            LIMIT ?
        """, (max_items // 2,))
        important = cursor.fetchall()
        conn.close()

        if important:
            context_parts.append("\n=== Important Facts ===")
            for row in important:
                context_parts.append(
                    f"[{row['category'].upper()}] {row['title']}: {row['content'][:150]}"
                )

        return "\n".join(context_parts) if context_parts else "No memories stored yet."

    # --------------------------------------------------------
    # JSON Backup & Restore
    # --------------------------------------------------------

    def export_to_json(self, filepath=None):
        """Export all memories to a JSON file for backup."""
        if not filepath:
            backup_dir = os.path.join(os.path.dirname(self.db_path), "backups")
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(backup_dir, f"memory_backup_{timestamp}.json")

        conn = self._get_conn()
        cursor = conn.cursor()

        # Export memories
        cursor.execute("SELECT * FROM semantic_memories")
        memories = [dict(r) for r in cursor.fetchall()]

        # Export associations
        cursor.execute("SELECT * FROM memory_associations")
        associations = [dict(r) for r in cursor.fetchall()]

        # Export access log
        cursor.execute("SELECT * FROM memory_access_log ORDER BY accessed_at DESC LIMIT 500")
        access_log = [dict(r) for r in cursor.fetchall()]

        conn.close()

        backup_data = {
            "export_timestamp": datetime.datetime.now().isoformat(),
            "version": "2.0",
            "engine": "ShubhamAI_MemoryEngine",
            "statistics": {
                "total_memories": len(memories),
                "active_memories": sum(1 for m in memories if m.get('is_active')),
                "total_associations": len(associations),
                "categories": dict(Counter(m['category'] for m in memories)),
            },
            "memories": memories,
            "associations": associations,
            "access_log": access_log,
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)

        print(f"[MemoryEngine] Exported {len(memories)} memories to {filepath}")
        return filepath

    def import_from_json(self, filepath, merge=True):
        """
        Import memories from a JSON backup file.
        If merge=True, adds new memories without deleting existing ones.
        If merge=False, replaces all memories.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Backup file not found: {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)

        conn = self._get_conn()
        cursor = conn.cursor()

        if not merge:
            # Wipe existing data
            cursor.execute("DELETE FROM memory_access_log")
            cursor.execute("DELETE FROM memory_associations")
            cursor.execute("DELETE FROM semantic_memories")

        imported_count = 0
        id_mapping = {}  # old_id -> new_id

        for mem in backup_data.get("memories", []):
            cursor.execute("""
                INSERT INTO semantic_memories (category, title, content, tags, importance, access_count,
                    last_accessed, created_at, updated_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                mem.get('category', 'fact'),
                mem.get('title', ''),
                mem.get('content', ''),
                mem.get('tags', ''),
                mem.get('importance', 5),
                mem.get('access_count', 0),
                mem.get('last_accessed'),
                mem.get('created_at'),
                mem.get('updated_at'),
                mem.get('is_active', 1),
            ))
            new_id = cursor.lastrowid
            old_id = mem.get('id')
            if old_id is not None:
                id_mapping[old_id] = new_id
            imported_count += 1

        # Import associations with mapped IDs
        for assoc in backup_data.get("associations", []):
            old_a = assoc.get('memory_id_a')
            old_b = assoc.get('memory_id_b')
            new_a = id_mapping.get(old_a)
            new_b = id_mapping.get(old_b)
            if new_a and new_b:
                cursor.execute("""
                    INSERT INTO memory_associations (memory_id_a, memory_id_b, relationship, strength)
                    VALUES (?, ?, ?, ?)
                """, (new_a, new_b, assoc.get('relationship', 'related'), assoc.get('strength', 1.0)))

        conn.commit()
        conn.close()

        # Reload semantic index
        self._load_semantic_index()

        print(f"[MemoryEngine] Imported {imported_count} memories from {filepath}")
        return imported_count

    # --------------------------------------------------------
    # Memory Insights & Analytics
    # --------------------------------------------------------

    def get_insights(self):
        """Generate insights about stored memories."""
        conn = self._get_conn()
        cursor = conn.cursor()

        # Category distribution
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM semantic_memories WHERE is_active = 1
            GROUP BY category ORDER BY count DESC
        """)
        category_dist = {row['category']: row['count'] for row in cursor.fetchall()}

        # Most accessed memories
        cursor.execute("""
            SELECT id, title, category, access_count, importance
            FROM semantic_memories WHERE is_active = 1
            ORDER BY access_count DESC LIMIT 5
        """)
        most_accessed = [dict(r) for r in cursor.fetchall()]

        # Recently added
        cursor.execute("""
            SELECT id, title, category, created_at
            FROM semantic_memories WHERE is_active = 1
            ORDER BY created_at DESC LIMIT 5
        """)
        recent = [dict(r) for r in cursor.fetchall()]

        # Total stats
        cursor.execute("SELECT COUNT(*) as total FROM semantic_memories WHERE is_active = 1")
        total = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM memory_associations")
        total_assoc = cursor.fetchone()['total']

        conn.close()

        return {
            "total_memories": total,
            "total_associations": total_assoc,
            "category_distribution": category_dist,
            "most_accessed": most_accessed,
            "recently_added": recent,
            "semantic_index_stats": self.semantic_index.get_stats(),
        }

    def get_daily_summary(self):
        """Generate a daily summary of relevant memories for the AI prompt."""
        today = datetime.date.today().isoformat()
        day_name = datetime.date.today().strftime("%A")

        summary_parts = [f"📅 {day_name}, {today}"]

        # Active goals
        goals = self.get_goals()
        if goals:
            summary_parts.append("\n🎯 Active Goals:")
            for g in goals[:3]:
                summary_parts.append(f"  • {g['title']} (importance: {g['importance']}/10)")

        # Current projects
        projects = self.get_projects()
        if projects:
            summary_parts.append("\n🛠️ Active Projects:")
            for p in projects[:3]:
                summary_parts.append(f"  • {p['title']}: {p['content'][:80]}")

        # Today's routine
        routines = self.get_routines()
        if routines:
            summary_parts.append("\n⏰ Routines:")
            for r in routines[:3]:
                summary_parts.append(f"  • {r['title']}")

        # Business ideas
        ideas = self.get_business_ideas()
        if ideas:
            summary_parts.append("\n💡 Business Ideas:")
            for i in ideas[:2]:
                summary_parts.append(f"  • {i['title']}: {i['content'][:60]}")

        return "\n".join(summary_parts)


# ============================================================
# Singleton instance for global access
# ============================================================

_memory_engine_instance = None

def get_memory_engine():
    """Get or create the global MemoryEngine singleton."""
    global _memory_engine_instance
    if _memory_engine_instance is None:
        _memory_engine_instance = MemoryEngine()
    return _memory_engine_instance
