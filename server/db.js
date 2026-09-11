const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/petx';

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // Ignorar erros na inicialização se estiver usando JSON DB
  if (!useJsonDb) {
    console.error('Erro inesperado no cliente PostgreSQL:', err);
  }
});

let useJsonDb = false;
const jsonDbPath = path.join(__dirname, 'petx_db.json');

function initJsonDb() {
  if (!fs.existsSync(jsonDbPath)) {
    const initialData = {
      users: [],
      profiles: [],
      posts: [],
      post_images: [],
      likes: [],
      comments: [],
      conversations: [],
      messages: [],
      notifications: [],
    };
    fs.writeFileSync(jsonDbPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readJsonDb() {
  initJsonDb();
  return JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
}

function writeJsonDb(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf8');
}

async function executeJsonQuery(text, params = []) {
  const dbData = readJsonDb();
  const sql = text.trim().replace(/\s+/g, ' ');

  // 1. SELECT id FROM users WHERE email = $1
  if (sql.includes('SELECT id FROM users WHERE email = $1')) {
    const user = dbData.users.find(u => u.email === params[0]);
    return { rows: user ? [{ id: user.id }] : [] };
  }

  // 2. INSERT INTO users (id, email, password_hash)
  if (sql.includes('INSERT INTO users')) {
    dbData.users.push({
      id: params[0],
      email: params[1],
      password_hash: params[2],
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 3. INSERT INTO profiles
  if (sql.includes('INSERT INTO profiles')) {
    dbData.profiles.push({
      id: params[0],
      user_id: params[1],
      name: params[2],
      username: params[3],
      bio: params[4],
      avatar_url: params[5],
      city: params[6],
      state: params[7],
      account_type: params[8],
      is_verified: params[8] === 'ong',
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 4. SELECT * FROM users WHERE email = $1
  if (sql.includes('SELECT * FROM users WHERE email = $1')) {
    const user = dbData.users.find(u => u.email === params[0]);
    return { rows: user ? [user] : [] };
  }

  // 5. SELECT id, email FROM users WHERE id = $1
  if (sql.includes('SELECT id, email FROM users WHERE id = $1')) {
    const user = dbData.users.find(u => u.id === params[0]);
    return { rows: user ? [{ id: user.id, email: user.email }] : [] };
  }

  // 6. SELECT * FROM profiles WHERE user_id = $1
  if (sql.includes('SELECT * FROM profiles WHERE user_id = $1')) {
    const profile = dbData.profiles.find(p => p.user_id === params[0]);
    return { rows: profile ? [profile] : [] };
  }

  // 6.1. SELECT id, user_id FROM profiles WHERE username = $1 or LOWER(username) = LOWER($1)
  if (sql.includes('FROM profiles WHERE') && sql.toLowerCase().includes('username')) {
    const target = (params[0] || '').toLowerCase();
    const profile = dbData.profiles.find(p => (p.username || '').toLowerCase() === target);
    return { rows: profile ? [{ id: profile.id, user_id: profile.user_id }] : [] };
  }

  // 7. UPDATE profiles SET name = COALESCE($1, name) ...
  if (sql.includes('UPDATE profiles SET')) {
    const userId = params[6];
    const profile = dbData.profiles.find(p => p.user_id === userId);
    if (profile) {
      if (params[0] !== undefined && params[0] !== null) profile.name = params[0];
      if (params[1] !== undefined && params[1] !== null) profile.username = params[1];
      if (params[2] !== undefined && params[2] !== null) profile.bio = params[2];
      if (params[3] !== undefined && params[3] !== null) profile.avatar_url = params[3];
      if (params[4] !== undefined && params[4] !== null) profile.city = params[4];
      if (params[5] !== undefined && params[5] !== null) profile.state = params[5];
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // 8. SELECT p.id, p.user_id, p.type, p.content, p.likes_count, p.is_resolved, p.created_at ... FROM posts
  if (sql.includes('FROM posts p')) {
    const isUserFilter = sql.includes('WHERE p.user_id = $2');
    const targetUserId = isUserFilter ? params[1] : null;
    const currentUserId = params[0];
    const userLat = !isUserFilter && params[1] !== null && params[1] !== undefined ? parseFloat(params[1]) : null;
    const userLng = !isUserFilter && params[2] !== null && params[2] !== undefined ? parseFloat(params[2]) : null;
    const radiusKm = !isUserFilter && params[3] !== null && params[3] !== undefined ? parseFloat(params[3]) : null;

    let postList = dbData.posts;
    if (isUserFilter) {
      postList = postList.filter(p => p.user_id === targetUserId);
    }

    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    };

    let rows = postList.map(p => {
      const profile = dbData.profiles.find(pr => pr.user_id === p.user_id) || {};
      const images = dbData.post_images.filter(pi => pi.post_id === p.id).map(pi => pi.image_url);

      const comments = dbData.comments.filter(c => c.post_id === p.id).map(c => {
        const c_pr = dbData.profiles.find(pr => pr.user_id === c.user_id) || {};
        return {
          id: c.id,
          userId: c.user_id,
          content: c.content,
          time: c.created_at,
          user: c_pr.name || 'Usuário',
          avatar: c_pr.avatar_url
        };
      });

      const isLiked = dbData.likes.some(l => l.user_id === currentUserId && l.post_id === p.id);

      let distanceKm = null;
      const pLat = p.latitude !== undefined && p.latitude !== null ? parseFloat(p.latitude) : null;
      const pLng = p.longitude !== undefined && p.longitude !== null ? parseFloat(p.longitude) : null;
      if (userLat !== null && userLng !== null && pLat !== null && pLng !== null) {
        distanceKm = haversine(userLat, userLng, pLat, pLng);
      }

      return {
        id: p.id,
        user_id: p.user_id,
        type: p.type,
        content: p.content,
        latitude: pLat,
        longitude: pLng,
        post_city: p.city || '',
        post_state: p.state || '',
        neighborhood: p.neighborhood || '',
        is_approximate: Boolean(p.is_approximate),
        distance_km: distanceKm,
        likes_count: p.likes_count || 0,
        is_resolved: p.is_resolved || false,
        created_at: p.created_at,
        user_name: profile.name,
        avatar: profile.avatar_url,
        user_city: profile.city || '',
        user_state: profile.state || '',
        images,
        comments,
        is_liked: isLiked
      };
    });

    if (radiusKm !== null && userLat !== null && userLng !== null) {
      rows = rows.filter(r => r.distance_km === null || r.distance_km <= radiusKm);
      rows.sort((a, b) => {
        const aUrgent = a.type === 'perdido' || a.type === 'ong' ? 0 : 1;
        const bUrgent = b.type === 'perdido' || b.type === 'ong' ? 0 : 1;
        if (aUrgent !== bUrgent) return aUrgent - bUrgent;
        const aDist = a.distance_km !== null ? a.distance_km : 99999;
        const bDist = b.distance_km !== null ? b.distance_km : 99999;
        return aDist - bDist;
      });
    } else {
      // Ordenar por created_at DESC
      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return { rows };
  }

  // 9. INSERT INTO posts
  if (sql.includes('INSERT INTO posts')) {
    dbData.posts.push({
      id: params[0],
      user_id: params[1],
      type: params[2],
      content: params[3],
      latitude: params[4] || null,
      longitude: params[5] || null,
      city: params[6] || '',
      state: params[7] || '',
      neighborhood: params[8] || '',
      is_approximate: Boolean(params[9]),
      is_resolved: false,
      likes_count: 0,
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 10. INSERT INTO post_images
  if (sql.includes('INSERT INTO post_images')) {
    dbData.post_images.push({
      id: params[0],
      post_id: params[1],
      image_url: params[2],
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 11. SELECT id FROM likes WHERE user_id = $1 AND post_id = $2
  if (sql.includes('SELECT id FROM likes')) {
    const like = dbData.likes.find(l => l.user_id === params[0] && l.post_id === params[1]);
    return { rows: like ? [{ id: like.id }] : [] };
  }

  // 12. DELETE FROM likes
  if (sql.includes('DELETE FROM likes')) {
    dbData.likes = dbData.likes.filter(l => !(l.user_id === params[0] && l.post_id === params[1]));
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 13. INSERT INTO likes
  if (sql.includes('INSERT INTO likes')) {
    dbData.likes.push({
      id: params[0],
      user_id: params[1],
      post_id: params[2],
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 14. UPDATE posts SET likes_count = ...
  if (sql.includes('UPDATE posts SET likes_count')) {
    const postId = params[0];
    const post = dbData.posts.find(p => p.id === postId);
    if (post) {
      if (sql.includes('likes_count + 1')) {
        post.likes_count = (post.likes_count || 0) + 1;
      } else {
        post.likes_count = Math.max(0, (post.likes_count || 0) - 1);
      }
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // 15. SELECT user_id FROM posts WHERE id = $1
  if (sql.includes('SELECT user_id FROM posts WHERE id = $1')) {
    const post = dbData.posts.find(p => p.id === params[0]);
    return { rows: post ? [post] : [] };
  }

  // 16. UPDATE posts SET content = $1 WHERE id = $2
  if (sql.includes('UPDATE posts SET content = $1 WHERE id = $2')) {
    const post = dbData.posts.find(p => p.id === params[1]);
    if (post) {
      post.content = params[0];
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // 17. DELETE FROM posts WHERE id = $1
  if (sql.includes('DELETE FROM posts WHERE id = $1')) {
    dbData.posts = dbData.posts.filter(p => p.id !== params[0]);
    dbData.post_images = dbData.post_images.filter(pi => pi.post_id !== params[0]);
    dbData.comments = dbData.comments.filter(c => c.post_id !== params[0]);
    dbData.likes = dbData.likes.filter(l => l.post_id !== params[0]);
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 18. SELECT user_id, is_resolved FROM posts WHERE id = $1
  if (sql.includes('SELECT user_id, is_resolved FROM posts WHERE id = $1')) {
    const post = dbData.posts.find(p => p.id === params[0]);
    return { rows: post ? [post] : [] };
  }

  // 19. UPDATE posts SET is_resolved = $1 WHERE id = $2
  if (sql.includes('UPDATE posts SET is_resolved = $1 WHERE id = $2')) {
    const post = dbData.posts.find(p => p.id === params[1]);
    if (post) {
      post.is_resolved = params[0];
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // 20. INSERT INTO comments
  if (sql.includes('INSERT INTO comments')) {
    dbData.comments.push({
      id: params[0],
      user_id: params[1],
      post_id: params[2],
      content: params[3],
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 21. SELECT id, type, sender_name as user... FROM notifications
  if (sql.includes('FROM notifications WHERE user_id = $1')) {
    const rows = dbData.notifications.filter(n => n.user_id === params[0]).map(n => ({
      id: n.id,
      type: n.type,
      sender_name: n.sender_name,
      sender_avatar: n.sender_avatar,
      text: n.text,
      target_id: n.target_id,
      created_at: n.created_at,
      is_read: n.is_read
    }));
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows };
  }

  // 22. INSERT INTO notifications
  if (sql.includes('INSERT INTO notifications')) {
    dbData.notifications.push({
      id: params[0],
      user_id: params[1],
      type: params[2],
      sender_name: params[3],
      sender_avatar: params[4],
      text: params[5],
      target_id: params[6],
      is_read: params[7] || false,
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 23. UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2
  if (sql.includes('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2')) {
    const notif = dbData.notifications.find(n => n.id === params[0] && n.user_id === params[1]);
    if (notif) {
      notif.is_read = true;
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // 24. UPDATE notifications SET is_read = TRUE WHERE user_id = $1
  if (sql.includes('UPDATE notifications SET is_read = TRUE WHERE user_id = $1')) {
    dbData.notifications.forEach(n => {
      if (n.user_id === params[0]) n.is_read = true;
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 25. SELECT id FROM conversations WHERE (user1_id = $1 AND user2_id = $2)
  if (sql.includes('SELECT id FROM conversations WHERE (user1_id = $1 AND user2_id = $2)')) {
    const conv = dbData.conversations.find(c =>
      (c.user1_id === params[0] && c.user2_id === params[1]) ||
      (c.user1_id === params[1] && c.user2_id === params[0])
    );
    return { rows: conv ? [{ id: conv.id }] : [] };
  }

  // 26. INSERT INTO conversations
  if (sql.includes('INSERT INTO conversations')) {
    dbData.conversations.push({
      id: params[0],
      user1_id: params[1],
      user2_id: params[2],
      last_message: '',
      last_time: '',
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 27. SELECT c.id, c.last_message, c.last_time, c.created_at... FROM conversations c
  if (sql.includes('FROM conversations c')) {
    const currentUserId = params[0];
    const rows = dbData.conversations
      .filter(c => c.user1_id === currentUserId || c.user2_id === currentUserId)
      .map(c => {
        const recipientId = c.user1_id === currentUserId ? c.user2_id : c.user1_id;
        const recipientProfile = dbData.profiles.find(p => p.user_id === recipientId) || {};
        return {
          id: c.id,
          last_message: c.last_message,
          last_time: c.last_time,
          created_at: c.created_at,
          recipient_id: recipientId,
          recipient_name: recipientProfile.name || 'Usuário',
          recipient_avatar: recipientProfile.avatar_url
        };
      });
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows };
  }

  // 28. SELECT user1_id, user2_id FROM conversations WHERE id = $1
  if (sql.includes('SELECT user1_id, user2_id FROM conversations WHERE id = $1')) {
    const conv = dbData.conversations.find(c => c.id === params[0]);
    return { rows: conv ? [conv] : [] };
  }

  // 29. SELECT m.id, m.sender_id, m.text, m.created_at, pr.name as sender_name FROM messages m
  if (sql.includes('FROM messages m')) {
    const rows = dbData.messages
      .filter(m => m.conversation_id === params[0])
      .map(m => {
        const profile = dbData.profiles.find(pr => pr.user_id === m.sender_id) || {};
        return {
          id: m.id,
          sender_id: m.sender_id,
          text: m.text,
          created_at: m.created_at,
          sender_name: profile.name || 'Usuário'
        };
      });
    rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { rows };
  }

  // 30. INSERT INTO messages
  if (sql.includes('INSERT INTO messages')) {
    dbData.messages.push({
      id: params[0],
      conversation_id: params[1],
      sender_id: params[2],
      text: params[3],
      created_at: new Date().toISOString()
    });
    writeJsonDb(dbData);
    return { rows: [] };
  }

  // 31. UPDATE conversations SET last_message = $1, last_time = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3
  if (sql.includes('UPDATE conversations SET last_message = $1')) {
    const conv = dbData.conversations.find(c => c.id === params[2]);
    if (conv) {
      conv.last_message = params[0];
      conv.last_time = params[1];
      conv.created_at = new Date().toISOString();
      writeJsonDb(dbData);
    }
    return { rows: [] };
  }

  // default query response
  return { rows: [] };
}

module.exports = {
  query: async (text, params) => {
    if (useJsonDb) {
      return executeJsonQuery(text, params);
    }
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('⚠️ Conexão com PostgreSQL falhou. Ativando banco de dados JSON de fallback...', err.message);
      useJsonDb = true;
      initJsonDb();
      return executeJsonQuery(text, params);
    }
  },
  pool,
};
