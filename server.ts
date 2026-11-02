import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { db, defaultUserId } from './server/db.ts';
import { autoOrganizeMemory, askMemoryVault, generateStudyModule } from './server/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to format memory row
function formatMemoryRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    summary: row.summary || '',
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    keyTakeaways: JSON.parse(row.key_takeaways || '[]'),
    sourceUrl: row.source_url || undefined,
    fileName: row.file_name || undefined,
    fileSize: row.file_size || undefined,
    imageUrl: row.image_url || undefined,
    isPinned: Boolean(row.is_pinned),
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ----------------- API ROUTES -----------------

// 1. Dashboard Stats
app.get('/api/stats', (req, res) => {
  try {
    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM memories').get() as any).count;
    const noteCount = (db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'note'").get() as any).count;
    const docCount = (db.prepare("SELECT COUNT(*) as count FROM memories WHERE type IN ('pdf', 'document')").get() as any).count;
    const linkCount = (db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'link'").get() as any).count;
    const imageCount = (db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'image'").get() as any).count;

    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM memories 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    const recentMemories = db.prepare(`
      SELECT * FROM memories 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all().map(formatMemoryRow);

    const studySessionsCount = (db.prepare('SELECT COUNT(*) as count FROM study_sessions').get() as any).count;

    res.json({
      totalMemories: totalCount,
      notes: noteCount,
      documents: docCount,
      links: linkCount,
      images: imageCount,
      categories,
      recentMemories,
      studySessionsCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Memories with filtering and search
app.get('/api/memories', (req, res) => {
  try {
    const { category, type, search, sort = 'newest', favorite } = req.query;

    let query = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (type && type !== 'all') {
      if (type === 'documents') {
        query += " AND type IN ('pdf', 'document')";
      } else {
        query += ' AND type = ?';
        params.push(type);
      }
    }

    if (favorite === 'true') {
      query += ' AND is_favorite = 1';
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ?)';
      params.push(term, term, term, term);
    }

    // Sort order
    if (sort === 'oldest') {
      query += ' ORDER BY is_pinned DESC, created_at ASC';
    } else if (sort === 'title') {
      query += ' ORDER BY title ASC';
    } else {
      query += ' ORDER BY is_pinned DESC, created_at DESC';
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(formatMemoryRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single memory
app.get('/api/memories/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(formatMemoryRow(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Auto-Organize with Gemini
app.post('/api/memories/auto-organize', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required for AI organization' });
    }
    const result = await autoOrganizeMemory(title || 'Untitled Memory', content);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Parse website URL
app.post('/api/parse-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch URL contents
    const fetchRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: `Failed to fetch URL: ${fetchRes.statusText}` });
    }

    const html = await fetchRes.text();

    // Extract title, description, and readable body
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Strip HTML scripts, styles, and tags for clean content text
    const cleanContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    // Auto-organize via Gemini
    const aiOrganized = await autoOrganizeMemory(title, cleanContent || description || title);

    res.json({
      title,
      description,
      content: cleanContent || description || `Content extracted from ${parsedUrl.hostname}`,
      sourceUrl: url,
      category: aiOrganized.category,
      tags: aiOrganized.tags,
      summary: aiOrganized.summary,
      keyTakeaways: aiOrganized.keyTakeaways,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Could not parse URL: ' + err.message });
  }
});

// 6. Parse PDF Base64
app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const buffer = Buffer.from(base64Data.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    const pdfData = await pdfParse(buffer);

    const title = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : 'Uploaded PDF Document';
    const textContent = (pdfData.text || '').replace(/\s+/g, ' ').trim();

    if (!textContent) {
      return res.status(400).json({ error: 'No readable text could be extracted from this PDF' });
    }

    // Auto-organize with Gemini
    const aiOrganized = await autoOrganizeMemory(title, textContent.slice(0, 10000));

    res.json({
      title,
      content: textContent,
      category: aiOrganized.category,
      tags: aiOrganized.tags,
      summary: aiOrganized.summary,
      keyTakeaways: aiOrganized.keyTakeaways,
      pages: pdfData.numpages,
      fileSize: buffer.length,
    });
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ error: 'Failed to parse PDF document: ' + err.message });
  }
});

// 7. Create Memory
app.post('/api/memories', async (req, res) => {
  try {
    const {
      title,
      content,
      type = 'note',
      category,
      tags = [],
      summary,
      keyTakeaways = [],
      sourceUrl,
      fileName,
      fileSize,
      imageUrl,
      autoAnalyze = false,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let finalCategory = category;
    let finalTags = tags;
    let finalSummary = summary;
    let finalTakeaways = keyTakeaways;

    if (autoAnalyze || !finalSummary || !finalCategory) {
      const aiResult = await autoOrganizeMemory(title, content);
      finalCategory = finalCategory || aiResult.category;
      finalTags = finalTags.length ? finalTags : aiResult.tags;
      finalSummary = finalSummary || aiResult.summary;
      finalTakeaways = finalTakeaways.length ? finalTakeaways : aiResult.keyTakeaways;
    }

    const id = 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO memories (
        id, user_id, type, title, content, summary, category, tags, key_takeaways,
        source_url, file_name, file_size, image_url, is_pinned, is_favorite, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `);

    insert.run(
      id,
      defaultUserId,
      type,
      title,
      content,
      finalSummary,
      finalCategory || 'Personal',
      JSON.stringify(finalTags),
      JSON.stringify(finalTakeaways),
      sourceUrl || null,
      fileName || null,
      fileSize || null,
      imageUrl || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
    res.status(201).json(formatMemoryRow(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Update Memory
app.put('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const {
      title,
      content,
      summary,
      category,
      tags,
      keyTakeaways,
      isPinned,
      isFavorite,
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE memories SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        summary = COALESCE(?, summary),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        key_takeaways = COALESCE(?, key_takeaways),
        is_pinned = COALESCE(?, is_pinned),
        is_favorite = COALESCE(?, is_favorite),
        updated_at = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : null,
      content !== undefined ? content : null,
      summary !== undefined ? summary : null,
      category !== undefined ? category : null,
      tags !== undefined ? JSON.stringify(tags) : null,
      keyTakeaways !== undefined ? JSON.stringify(keyTakeaways) : null,
      isPinned !== undefined ? (isPinned ? 1 : 0) : null,
      isFavorite !== undefined ? (isFavorite ? 1 : 0) : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
    res.json(formatMemoryRow(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Delete Memory
app.delete('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. AI Chat Assistant with Grounding & Document Citations
app.post('/api/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Retrieve all memories for retrieval context
    const allMemories = db.prepare('SELECT id, title, content, summary, category, type FROM memories').all() as any[];

    // Save user message to database
    const userMsgId = 'msg-' + Date.now() + '-u';
    db.prepare(`
      INSERT INTO chat_messages (id, user_id, role, content, sources, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userMsgId, defaultUserId, 'user', query, null, new Date().toISOString());

    // Call grounded Gemini chat
    const result = await askMemoryVault(query, allMemories);

    // Save assistant message to database
    const assistantMsgId = 'msg-' + (Date.now() + 1) + '-a';
    db.prepare(`
      INSERT INTO chat_messages (id, user_id, role, content, sources, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      assistantMsgId,
      defaultUserId,
      'assistant',
      result.answer,
      JSON.stringify(result.sources),
      new Date().toISOString()
    );

    res.json({
      answer: result.answer,
      sources: result.sources,
      messageId: assistantMsgId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Chat History
app.get('/api/chat/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 100').all() as any[];
    const history = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      role: r.role,
      content: r.content,
      sources: r.sources ? JSON.parse(r.sources) : undefined,
      createdAt: r.created_at,
    }));
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Clear Chat History
app.delete('/api/chat/history', (req, res) => {
  try {
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(defaultUserId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Study Assistant: Generate Quiz, Flashcards, or Revision
app.post('/api/study/generate', async (req, res) => {
  try {
    const { memoryIds = [], type = 'quiz', title = 'Study Session' } = req.body;

    let targetMemories: any[] = [];
    if (memoryIds.length > 0) {
      const placeholders = memoryIds.map(() => '?').join(',');
      targetMemories = db.prepare(`SELECT id, title, content, category FROM memories WHERE id IN (${placeholders})`).all(...memoryIds);
    } else {
      // Use top 5 memories
      targetMemories = db.prepare('SELECT id, title, content, category FROM memories ORDER BY created_at DESC LIMIT 6').all();
    }

    if (targetMemories.length === 0) {
      return res.status(400).json({ error: 'Please save at least one document or note to generate study material.' });
    }

    const generated = await generateStudyModule(targetMemories, type);

    const sessionId = 'study-' + Date.now();
    db.prepare(`
      INSERT INTO study_sessions (id, user_id, type, title, memory_ids, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      defaultUserId,
      type,
      title,
      JSON.stringify(targetMemories.map((m) => m.id)),
      JSON.stringify(generated),
      new Date().toISOString()
    );

    res.json({
      sessionId,
      type,
      title,
      data: generated,
      sources: targetMemories.map((m) => ({ id: m.id, title: m.title, category: m.category })),
    });
  } catch (err: any) {
    console.error('Study generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 14. Study Sessions History
app.get('/api/study/sessions', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM study_sessions ORDER BY created_at DESC LIMIT 20').all() as any[];
    const sessions = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      memoryIds: JSON.parse(r.memory_ids || '[]'),
      content: JSON.parse(r.content || '{}'),
      score: r.score,
      totalQuestions: r.total_questions,
      createdAt: r.created_at,
    }));
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Record Quiz Score
app.put('/api/study/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { score, totalQuestions } = req.body;
    db.prepare('UPDATE study_sessions SET score = ?, total_questions = ? WHERE id = ?').run(score, totalQuestions, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. User profile / Auth
app.get('/api/auth/me', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(defaultUserId) as any;
    if (user) {
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/update-profile', (req, res) => {
  try {
    const { name, email } = req.body;
    db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?').run(
      name || null,
      email || null,
      defaultUserId
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(defaultUserId) as any;
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17. Reset sample data endpoint
app.post('/api/admin/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM memories').run();
    db.prepare('DELETE FROM chat_messages').run();
    db.prepare('DELETE FROM study_sessions').run();

    // Re-seed by running seed statements
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

    res.json({ success: true, count: seedMemories.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindVault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
