import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vault.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    tags TEXT NOT NULL,
    key_takeaways TEXT NOT NULL,
    source_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    image_url TEXT,
    is_pinned INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    memory_ids TEXT NOT NULL,
    content TEXT NOT NULL,
    score INTEGER,
    total_questions INTEGER,
    created_at TEXT NOT NULL
  );
`);

// Seed default user if not exists
const defaultUserId = 'user-alex-101';
const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(defaultUserId);
if (!existingUser) {
  db.prepare(`
    INSERT INTO users (id, email, name, avatar, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    defaultUserId,
    'alex.chen@mindvault.ai',
    'Alex Chen',
    '/src/assets/images/default_user_avatar_1793590168049.jpg',
    new Date().toISOString()
  );
}

// Seed rich initial memories if database is empty
const memoryCount = db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
if (memoryCount.count === 0) {
  const seedMemories = [
    {
      id: 'mem-seed-1',
      user_id: defaultUserId,
      type: 'document',
      title: 'Attention Mechanism in Modern Transformer Architectures',
      content: `The Transformer architecture replaces recurrent neural networks with multi-head self-attention mechanisms. Self-attention allows the model to associate each position with all other positions in a sequence directly, avoiding the vanishing gradient bottlenecks of standard LSTMs.
Key mathematical components include Query (Q), Key (K), and Value (V) projections:
Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
Multi-head attention applies this across h different representation subspaces. Positional encodings (sinusoidal or RoPE) preserve word order since attention is permutation-invariant.
Practical impact: Parallelizable training across GPUs, massive scaling up to trillions of parameters, foundational for LLMs like Gemini and GPT.`,
      summary: 'Comprehensive breakdown of Transformer self-attention mechanics, Query-Key-Value vector operations, positional encodings, and GPU scaling benefits.',
      category: 'Research',
      tags: JSON.stringify(['transformers', 'machine-learning', 'attention', 'nlp', 'ai-architecture']),
      key_takeaways: JSON.stringify([
        'Self-attention calculates pairwise relationships across all tokens simultaneously in O(1) sequential operations.',
        'Scaled dot-product attention scales by 1/sqrt(d_k) to prevent softmax gradients from vanishing at high dimensions.',
        'Multi-head attention enables the model to jointly attend to information from different representation subspaces at different positions.'
      ]),
      source_url: 'https://arxiv.org/abs/1706.03762',
      file_name: 'transformer_attention_mechanics.pdf',
      file_size: 482000,
      image_url: null,
      is_pinned: 1,
      is_favorite: 1,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'mem-seed-2',
      user_id: defaultUserId,
      type: 'note',
      title: 'Q4 Product Roadmap & Core AI Memory Objectives',
      content: `Objectives for Q4 2026:
1. Low-Latency Vector Search & Grounding: Target sub-50ms query response on 50,000 personal notes using hybrid BM25 and semantic embeddings.
2. Multimodal Memory Capture: Enable one-click screenshot, PDF extract, and web clipper bookmarking with background auto-tagging.
3. Spaced Repetition Study Engine: Implement Leitner flashcard algorithms and automated quiz generation for students preparing for licensing exams.
4. Privacy First: All user documents encrypted at rest with local SQLite caching and secure server-side proxying.
Milestones:
- Oct 15: Alpha release with note editor and PDF drag-and-drop.
- Nov 10: AI Chat assistant with document citations.
- Dec 01: Multi-modal study cards and revision summaries.`,
      summary: 'Q4 strategic roadmap prioritizing sub-50ms retrieval, multi-modal ingestion, spaced repetition study modules, and privacy-preserving storage.',
      category: 'Work',
      tags: JSON.stringify(['roadmap', 'product-strategy', 'spaced-repetition', 'q4-2026', 'engineering']),
      key_takeaways: JSON.stringify([
        'Sub-50ms hybrid retrieval latency target for over 50,000 documents.',
        'Spaced repetition study engine rollout scheduled for December.',
        'Strict privacy-first architecture using encrypted storage and server-side model proxies.'
      ]),
      source_url: null,
      file_name: null,
      file_size: null,
      image_url: null,
      is_pinned: 1,
      is_favorite: 0,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      id: 'mem-seed-3',
      user_id: defaultUserId,
      type: 'link',
      title: 'Next-Gen Clean Energy & Solid-State Battery Innovations',
      content: `Article Analysis:
Solid-state lithium batteries are transitioning from laboratory prototypes to pilot vehicle test fleets. By replacing flammable liquid organic electrolytes with solid ceramic or polymer electrolytes, these cells deliver:
- 400+ Wh/kg specific energy density (vs ~270 Wh/kg in conventional NMC lithium-ion cells).
- Non-flammable safety profile eliminating thermal runaway risks under physical puncture.
- Fast charging capability: 10% to 80% state-of-charge achieved in 12 minutes without dendritic degradation.
Leading manufacturers are solving the interface resistance problem through micro-thin atomic layer deposition (ALD) coatings.`,
      summary: 'Analysis of solid-state lithium battery tech delivering 400+ Wh/kg energy density, 12-minute rapid charging, and non-flammable safety through ceramic separators.',
      category: 'Technology',
      tags: JSON.stringify(['clean-energy', 'battery-tech', 'solid-state', 'sustainability', 'materials-science']),
      key_takeaways: JSON.stringify([
        'Energy density jumps to over 400 Wh/kg, representing a ~45% improvement over liquid electrolyte cells.',
        'Thermal runaway hazard is virtually eliminated via solid non-combustible ceramic electrolytes.',
        'ALD coatings resolve mechanical boundary resistance during repetitive expansion-contraction cycles.'
      ]),
      source_url: 'https://energy-insights.org/solid-state-breakthroughs-2026',
      file_name: null,
      file_size: null,
      image_url: null,
      is_pinned: 0,
      is_favorite: 1,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
    },
    {
      id: 'mem-seed-4',
      user_id: defaultUserId,
      type: 'note',
      title: 'Neuroscience of Deep Work and Memory Consolidation',
      content: `Key principles from cognitive neuroscience for long-term knowledge retention:
1. Hippocampal Replay: Sleep and quiet wakefulness periods are essential for transferring short-term memory traces from the hippocampus into distributed neocortical networks.
2. Active Recall vs Passive Re-reading: Testing oneself on material forces retrieval pathway strengthening, yielding up to 3x higher retention after 1 week compared to passive review.
3. Interleaving: Mixing distinct but related problem sets during study sessions prevents over-reliance on surface cues and fosters conceptual problem solving.
4. Ultradian Rhythms: Focused high-cognitive load work should cap around 90-minute blocks followed by 15-20 minutes of non-screen sensory decompression.`,
      summary: 'Actionable cognitive neuroscience protocols for optimizing knowledge retention, covering hippocampal replay, active recall testing, and ultradian work cycles.',
      category: 'Study',
      tags: JSON.stringify(['neuroscience', 'deep-work', 'learning', 'active-recall', 'productivity']),
      key_takeaways: JSON.stringify([
        'Active self-testing yields 3x higher retention than passive highlight/re-read methods.',
        'Memory consolidation heavily depends on sleep and diffuse-mode wakefulness.',
        'Limit deep focus sessions to 90-minute ultradian cycles.'
      ]),
      source_url: null,
      file_name: null,
      file_size: null,
      image_url: null,
      is_pinned: 0,
      is_favorite: 1,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
    },
    {
      id: 'mem-seed-5',
      user_id: defaultUserId,
      type: 'pdf',
      title: 'Decentralized Vector Indexing & HNSW Graph Specification',
      content: `Hierarchical Navigable Small World (HNSW) graphs are the current gold standard for approximate nearest neighbor (ANN) search in high-dimensional vector spaces.
The algorithm constructs a multi-layer graph where upper layers have longer skip connections (analogous to skip-lists) and lower layers have dense short-range connections.
Search starts at top layer with greedy routing toward nearest neighbor, then descends layer by layer until reaching ground layer 0 for beam search.
Hyperparameters:
- M: maximum number of bidirectional links per node (typical 16 to 64).
- efConstruction: size of dynamic candidate list during graph building (typical 100 to 400).
- efSearch: size of candidate list during query execution.
Provides logarithmic search complexity O(log N) with 99%+ recall on million-scale datasets.`,
      summary: 'Technical architecture of HNSW graph construction and multi-layer skip routing for sub-millisecond approximate nearest neighbor vector search.',
      category: 'Research',
      tags: JSON.stringify(['hnsw', 'vector-search', 'algorithms', 'similarity-search', 'data-structures']),
      key_takeaways: JSON.stringify([
        'Multi-layer hierarchy provides logarithmic O(log N) search scaling.',
        'efConstruction controls indexing time vs graph quality; efSearch trades latency vs recall.',
        'Bidirectional connections ensure graph navigation does not get trapped in local topological dead-ends.'
      ]),
      source_url: null,
      file_name: 'hnsw_graph_spec.pdf',
      file_size: 914000,
      image_url: null,
      is_pinned: 0,
      is_favorite: 0,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    }
  ];

  const insertMemory = db.prepare(`
    INSERT INTO memories (
      id, user_id, type, title, content, summary, category, tags, key_takeaways,
      source_url, file_name, file_size, image_url, is_pinned, is_favorite, created_at, updated_at
    ) VALUES (
      @id, @user_id, @type, @title, @content, @summary, @category, @tags, @key_takeaways,
      @source_url, @file_name, @file_size, @image_url, @is_pinned, @is_favorite, @created_at, @updated_at
    )
  `);

  for (const mem of seedMemories) {
    insertMemory.run(mem);
  }
}

export { db, defaultUserId };
