const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { username_generator } = require('./services/username_generator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'petx-secret-key-change-in-production';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos.'));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de acesso não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// Helper IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(7);

// Helper Relative Time
function formatRelativeTime(createdAt) {
  if (!createdAt) return 'Recente';
  const postDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - postDate.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Agora';
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays}d`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem`;
  return postDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username, bio, avatarUrl, accountType, city, state } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'E-mail, senha e nome são obrigatórios' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    await db.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [userId, email, hashedPassword]
    );

    const profileId = generateId();
    const generatedUsername = await username_generator(name);
    await db.query(
      'INSERT INTO profiles (id, user_id, name, username, bio, avatar_url, city, state, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [profileId, userId, name, generatedUsername, bio || '', avatarUrl || '', city || '', state || '', accountType || 'tutor']
    );

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    res.json({ token, user: { id: userId, email }, profile: profileRes.rows[0] });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno no servidor de registro' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);

    res.json({ token, user: { id: user.id, email: user.email }, profile: profileRes.rows[0] });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.userId]);
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json({ user: userRes.rows[0], profile: profileRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
  }
});

app.get('/api/auth/check-username', authenticateToken, async (req, res) => {
  const rawUsername = req.query.username;
  if (!rawUsername) return res.status(400).json({ error: 'Username é obrigatório' });
  const cleanUsername = rawUsername.trim().startsWith('@') ? rawUsername.trim() : `@${rawUsername.trim()}`;
  try {
    const exists = await db.query('SELECT id, user_id FROM profiles WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
    if (exists.rows.length > 0 && exists.rows[0].user_id !== req.user.userId) {
      const suggestion = await username_generator(cleanUsername);
      return res.json({ available: false, suggestion });
    }
    return res.json({ available: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  let { name, username, bio, avatarUrl, city, state, neighborhood, latitude, longitude, hideExactLocation } = req.body;
  try {
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]);
    if (profileRes.rows.length <= 0) return res.status(404).json({ error: 'Perfil não encontrado' });
    const currentProfile = profileRes.rows[0];

    if (username !== undefined && username !== null && username.trim() !== '') {
      const cleanUsername = username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`;
      
      // Se for diferente do username atual do usuário, verifica se já pertence a outro
      if (cleanUsername.toLowerCase() !== (currentProfile.username || '').toLowerCase()) {
        const exists = await db.query('SELECT id, user_id FROM profiles WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
        if (exists.rows.length > 0 && exists.rows[0].user_id !== req.user.userId) {
          const suggestion = await username_generator(cleanUsername);
          return res.status(400).json({
            error: 'Este nome de usuário já está em uso.',
            suggestion,
          });
        }
      }
      username = cleanUsername;
    }

    await db.query(
      `UPDATE profiles SET 
        name = COALESCE($1, name), 
        username = COALESCE($2, username), 
        bio = COALESCE($3, bio), 
        avatar_url = COALESCE($4, avatar_url), 
        city = COALESCE($5, city), 
        state = COALESCE($6, state),
        neighborhood = COALESCE($7, neighborhood),
        latitude = COALESCE($8, latitude),
        longitude = COALESCE($9, longitude),
        hide_exact_location = COALESCE($10, hide_exact_location)
       WHERE user_id = $11`,
      [name, username, bio, avatarUrl, city, state, neighborhood, latitude, longitude, hideExactLocation, req.user.userId]
    );

    const updated = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

app.get('/api/users/:id/profile', async (req, res) => {
  const targetUserId = req.params.id;
  let currentUserId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
    } catch (err) {
      // Token opcional
    }
  }

  try {
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [targetUserId]);
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const postsQuery = `
      SELECT p.id, p.user_id, p.type, p.content, p.likes_count, p.is_resolved, p.created_at,
             p.latitude, p.longitude, p.city as post_city, p.state as post_state, p.neighborhood, p.is_approximate,
             pr.name as user_name, pr.avatar_url as avatar, pr.city as user_city, pr.state as user_state,
             COALESCE(
               (SELECT json_agg(image_url) FROM post_images WHERE post_id = p.id),
               '[]'
             ) as images,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', c.id,
                 'content', c.content,
                 'time', c.created_at,
                 'user', c_pr.name,
                 'avatar', c_pr.avatar_url,
                 'userId', c.user_id
               ) ORDER BY c.created_at ASC)
                FROM comments c
                JOIN profiles c_pr ON c.user_id = c_pr.user_id
                WHERE c.post_id = p.id
             ),
             '[]'
           ) as comments,
           EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = p.id) as is_liked
      FROM posts p
      JOIN profiles pr ON p.user_id = pr.user_id
      WHERE p.user_id = $2
      ORDER BY p.created_at DESC
    `;
    const postsRes = await db.query(postsQuery, [currentUserId, targetUserId]);

    const formattedPosts = postsRes.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      user: row.user_name || 'Usuário',
      avatar: row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      city: row.post_city || row.user_city || '',
      state: row.post_state || row.user_state || '',
      neighborhood: row.neighborhood || '',
      latitude: row.latitude !== null ? parseFloat(row.latitude) : null,
      longitude: row.longitude !== null ? parseFloat(row.longitude) : null,
      isApproximate: Boolean(row.is_approximate),
      type: row.type,
      content: row.content,
      images: row.images,
      image: row.images && row.images.length > 0 ? row.images[0] : null,
      createdAt: row.created_at,
      time: formatRelativeTime(row.created_at),
      likesCount: row.likes_count || 0,
      isLiked: row.is_liked || false,
      isResolved: row.is_resolved || false,
      commentsCount: row.comments ? row.comments.length : 0,
      comments: row.comments.map(c => {
        const msgTime = new Date(c.time);
        const timeStr = `${msgTime.getHours().toString().padStart(2, '0')}:${msgTime.getMinutes().toString().padStart(2, '0')}`;
        return {
          id: c.id,
          userId: c.userId,
          user: c.user,
          avatar: c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          content: c.content,
          time: timeStr
        };
      })
    }));

    res.json({
      profile: profileRes.rows[0],
      posts: formattedPosts
    });
  } catch (err) {
    console.error('Erro ao buscar perfil do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// ==================== POSTS ROUTES ====================

app.get('/api/posts', async (req, res) => {
  let currentUserId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
    } catch (err) {
      // Ignorar token inválido
    }
  }

  const { lat, lng, radius_km, city, state } = req.query;
  const parsedLat = lat !== undefined && lat !== '' && !isNaN(Number(lat)) ? parseFloat(lat) : null;
  const parsedLng = lng !== undefined && lng !== '' && !isNaN(Number(lng)) ? parseFloat(lng) : null;
  const parsedRadius = radius_km !== undefined && radius_km !== '' && !isNaN(Number(radius_km)) ? parseFloat(radius_km) : null;
  const filterCity = city ? city.trim() : null;
  const filterState = state ? state.trim() : null;

  try {
    let whereClause = '';
    let orderByClause = 'ORDER BY p.created_at DESC';
    const queryParams = [currentUserId, parsedLat, parsedLng];

    if (parsedLat !== null && parsedLng !== null && parsedRadius !== null) {
      queryParams.push(parsedRadius, filterCity || '', filterState || '');
      whereClause = `
        WHERE (
          (p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0, 
                cos(radians($2::double precision)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($3::double precision)) +
                sin(radians($2::double precision)) * sin(radians(p.latitude))
              ))
            ) <= $4::double precision
          ))
          OR (
            p.latitude IS NULL AND (
              ($5::text <> '' AND LOWER(COALESCE(p.city, pr.city, '')) = LOWER($5::text))
              OR ($6::text <> '' AND LOWER(COALESCE(p.state, pr.state, '')) = LOWER($6::text))
            )
          )
        )
      `;
      orderByClause = `
        ORDER BY 
          CASE WHEN p.type IN ('perdido', 'ong') THEN 0 ELSE 1 END ASC,
          CASE WHEN p.latitude IS NOT NULL THEN (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0, 
                cos(radians($2::double precision)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($3::double precision)) +
                sin(radians($2::double precision)) * sin(radians(p.latitude))
              ))
            )
          ) ELSE 99999 END ASC,
          p.created_at DESC
      `;
    } else if (filterState && parsedRadius === null) {
      // Todo o estado
      queryParams.push(filterState);
      whereClause = `WHERE LOWER(COALESCE(p.state, pr.state, '')) = LOWER($4::text)`;
      if (parsedLat !== null && parsedLng !== null) {
        orderByClause = `
          ORDER BY 
            CASE WHEN p.type IN ('perdido', 'ong') THEN 0 ELSE 1 END ASC,
            CASE WHEN p.latitude IS NOT NULL THEN (
              6371 * acos(
                LEAST(1.0, GREATEST(-1.0, 
                  cos(radians($2::double precision)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($3::double precision)) +
                  sin(radians($2::double precision)) * sin(radians(p.latitude))
                ))
              )
            ) ELSE 99999 END ASC,
            p.created_at DESC
        `;
      }
    } else if (filterCity) {
      queryParams.push(filterCity);
      whereClause = `WHERE LOWER(COALESCE(p.city, pr.city, '')) = LOWER($4::text)`;
    } else if (filterState) {
      queryParams.push(filterState);
      whereClause = `WHERE LOWER(COALESCE(p.state, pr.state, '')) = LOWER($4::text)`;
    }

    const query = `
      SELECT p.id, p.user_id, p.type, p.content, p.likes_count, p.is_resolved, p.created_at,
             p.latitude, p.longitude, p.city as post_city, p.state as post_state, p.neighborhood, p.is_approximate,
             pr.name as user_name, pr.avatar_url as avatar, pr.city as user_city, pr.state as user_state,
             COALESCE(
               (SELECT json_agg(image_url) FROM post_images WHERE post_id = p.id),
               '[]'
             ) as images,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', c.id,
                 'content', c.content,
                 'time', c.created_at,
                 'user', c_pr.name,
                 'avatar', c_pr.avatar_url
               ) ORDER BY c.created_at ASC)
                FROM comments c
                JOIN profiles c_pr ON c.user_id = c_pr.user_id
                WHERE c.post_id = p.id
             ),
             '[]'
           ) as comments,
           EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = p.id) as is_liked,
           CASE 
             WHEN $2::double precision IS NOT NULL AND $3::double precision IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
               ROUND((6371 * acos(
                 LEAST(1.0, GREATEST(-1.0, 
                   cos(radians($2::double precision)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($3::double precision)) +
                   sin(radians($2::double precision)) * sin(radians(p.latitude))
                 ))
               ))::numeric, 1)
             ELSE NULL
           END AS distance_km
      FROM posts p
      JOIN profiles pr ON p.user_id = pr.user_id
      ${whereClause}
      ${orderByClause}
    `;

    const result = await db.query(query, queryParams);

    const formatted = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      user: row.user_name || 'Usuário',
      avatar: row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      city: row.post_city || row.user_city || '',
      state: row.post_state || row.user_state || '',
      neighborhood: row.neighborhood || '',
      latitude: row.latitude !== null ? parseFloat(row.latitude) : null,
      longitude: row.longitude !== null ? parseFloat(row.longitude) : null,
      isApproximate: Boolean(row.is_approximate),
      distanceKm: row.distance_km !== null ? parseFloat(row.distance_km) : null,
      type: row.type,
      content: row.content,
      images: row.images,
      image: row.images && row.images.length > 0 ? row.images[0] : null,
      createdAt: row.created_at,
      time: formatRelativeTime(row.created_at),
      likesCount: row.likes_count || 0,
      isLiked: row.is_liked || false,
      isResolved: row.is_resolved || false,
      commentsCount: row.comments ? row.comments.length : 0,
      comments: row.comments.map(c => {
        const msgTime = new Date(c.time);
        const timeStr = `${msgTime.getHours().toString().padStart(2, '0')}:${msgTime.getMinutes().toString().padStart(2, '0')}`;
        return {
          id: c.id,
          user: c.user,
          avatar: c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          content: c.content,
          time: timeStr
        };
      })
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Erro ao listar posts:', err);
    res.status(500).json({ error: 'Erro ao buscar publicações' });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  const { type, content, images, latitude, longitude, city, state, neighborhood, isApproximate, is_approximate } = req.body;
  if (!content) return res.status(400).json({ error: 'O conteúdo do post é obrigatório' });

  const postLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? parseFloat(latitude) : null;
  const postLng = longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? parseFloat(longitude) : null;
  const approx = Boolean(isApproximate !== undefined ? isApproximate : is_approximate);

  try {
    const postId = generateId();
    await db.query(
      `INSERT INTO posts (id, user_id, type, content, latitude, longitude, city, state, neighborhood, is_approximate, is_resolved) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)`,
      [postId, req.user.userId, type || 'outro', content, postLat, postLng, city || '', state || '', neighborhood || '', approx]
    );

    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        await db.query(
          'INSERT INTO post_images (id, post_id, image_url) VALUES ($1, $2, $3)',
          [generateId(), postId, imgUrl]
        );
      }
    }

    res.status(201).json({ id: postId, message: 'Post criado com sucesso' });
  } catch (err) {
    console.error('Erro ao criar post:', err);
    res.status(500).json({ error: 'Erro ao publicar post' });
  }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'O conteúdo do post é obrigatório' });

  try {
    const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });
    if (postRes.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado para editar este post' });
    }

    await db.query('UPDATE posts SET content = $1 WHERE id = $2', [content, postId]);
    res.json({ message: 'Post atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar post' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  try {
    const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });
    if (postRes.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado para excluir este post' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [postId]);
    res.json({ message: 'Post excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir post' });
  }
});

app.put('/api/posts/:id/resolve', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  try {
    const postRes = await db.query('SELECT user_id, is_resolved FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });
    if (postRes.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado para modificar este post' });
    }

    const newResolvedState = !postRes.rows[0].is_resolved;
    await db.query('UPDATE posts SET is_resolved = $1 WHERE id = $2', [newResolvedState, postId]);
    res.json({ resolved: newResolvedState });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar status de resolução do post' });
  }
});

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const existing = await db.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      await db.query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [postId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO likes (id, user_id, post_id) VALUES ($1, $2, $3)', [generateId(), userId, postId]);
      await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);

      // Auto-create notification for the post owner if it's not the same user
      const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      if (postRes.rows.length > 0 && postRes.rows[0].user_id !== userId) {
        const likerProfile = await db.query('SELECT name, avatar_url FROM profiles WHERE user_id = $1', [userId]);
        const name = likerProfile.rows[0]?.name || 'Alguém';
        const avatar = likerProfile.rows[0]?.avatar_url || '';
        await db.query(
          'INSERT INTO notifications (id, user_id, type, sender_name, sender_avatar, text, target_id, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [generateId(), postRes.rows[0].user_id, 'like', name, avatar, 'curtiu a sua publicação.', postId, false]
        );
      }
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alternar curtida' });
  }
});

// ==================== COMMENTS ROUTES ====================

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user.userId;

  if (!content) return res.status(400).json({ error: 'O conteúdo do comentário é obrigatório' });

  try {
    const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });

    const commentId = generateId();
    await db.query(
      'INSERT INTO comments (id, user_id, post_id, content) VALUES ($1, $2, $3, $4)',
      [commentId, userId, postId, content]
    );

    // Auto-create notification for the post owner if it's not the same user
    const postOwnerId = postRes.rows[0].user_id;
    if (postOwnerId !== userId) {
      const commenterProfile = await db.query('SELECT name, avatar_url FROM profiles WHERE user_id = $1', [userId]);
      const name = commenterProfile.rows[0]?.name || 'Alguém';
      const avatar = commenterProfile.rows[0]?.avatar_url || '';
      const snippet = content.length > 30 ? `${content.substring(0, 30)}...` : content;

      await db.query(
        'INSERT INTO notifications (id, user_id, type, sender_name, sender_avatar, text, target_id, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [generateId(), postOwnerId, 'comment', name, avatar, `comentou no seu post: "${snippet}"`, postId, false]
      );
    }

    res.status(201).json({ id: commentId, message: 'Comentário adicionado com sucesso' });
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// ==================== CHAT / CONVERSATIONS ROUTES ====================

app.get('/api/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const query = `
      SELECT c.id, c.last_message, c.last_time, c.created_at,
             CASE 
               WHEN c.user1_id = $1 THEN c.user2_id 
               ELSE c.user1_id 
             END as recipient_id,
             pr.name as recipient_name, pr.avatar_url as recipient_avatar
      FROM conversations c
      JOIN profiles pr ON pr.user_id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [userId]);

    const formatted = result.rows.map(row => ({
      id: row.id,
      userName: row.recipient_name,
      userAvatar: row.recipient_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      lastMessage: row.last_message || 'Iniciou uma conversa',
      lastTime: row.last_time || 'Agora',
      unreadCount: 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Erro ao listar conversas:', err);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { recipientId } = req.body;

  if (!recipientId) return res.status(400).json({ error: 'ID do destinatário é obrigatório' });
  if (userId === recipientId) return res.status(400).json({ error: 'Não é possível iniciar conversa com você mesmo' });

  try {
    const checkQuery = `
      SELECT id FROM conversations 
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
    `;
    const existing = await db.query(checkQuery, [userId, recipientId]);
    if (existing.rows.length > 0) {
      return res.json({ id: existing.rows[0].id });
    }

    const newId = generateId();
    await db.query(
      'INSERT INTO conversations (id, user1_id, user2_id) VALUES ($1, $2, $3)',
      [newId, userId, recipientId]
    );

    res.status(201).json({ id: newId });
  } catch (err) {
    console.error('Erro ao criar conversa:', err);
    res.status(500).json({ error: 'Erro ao iniciar conversa' });
  }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.userId;

  try {
    const convRes = await db.query('SELECT user1_id, user2_id FROM conversations WHERE id = $1', [conversationId]);
    if (convRes.rows.length === 0) return res.status(404).json({ error: 'Conversa não encontrada' });
    const { user1_id, user2_id } = convRes.rows[0];
    if (user1_id !== userId && user2_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    const messagesRes = await db.query(
      `SELECT m.id, m.sender_id, m.text, m.created_at, pr.name as sender_name
       FROM messages m
       JOIN profiles pr ON pr.user_id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    const formatted = messagesRes.rows.map(row => {
      const msgTime = new Date(row.created_at);
      const timeStr = `${msgTime.getHours().toString().padStart(2, '0')}:${msgTime.getMinutes().toString().padStart(2, '0')}`;

      return {
        id: row.id,
        sender: row.sender_name,
        text: row.text,
        timestamp: timeStr,
        isUser: row.sender_id === userId,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro ao carregar histórico de mensagens' });
  }
});

app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.userId;
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });

  try {
    const convRes = await db.query('SELECT user1_id, user2_id FROM conversations WHERE id = $1', [conversationId]);
    if (convRes.rows.length === 0) return res.status(404).json({ error: 'Conversa não encontrada' });
    const { user1_id, user2_id } = convRes.rows[0];
    if (user1_id !== userId && user2_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    const messageId = generateId();
    await db.query(
      'INSERT INTO messages (id, conversation_id, sender_id, text) VALUES ($1, $2, $3, $4)',
      [messageId, conversationId, userId, text]
    );

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    await db.query(
      'UPDATE conversations SET last_message = $1, last_time = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3',
      [text, timeStr, conversationId]
    );

    const recipientId = user1_id === userId ? user2_id : user1_id;
    const senderProfile = await db.query('SELECT name, avatar_url FROM profiles WHERE user_id = $1', [userId]);
    const senderName = senderProfile.rows[0]?.name || 'Alguém';
    const senderAvatar = senderProfile.rows[0]?.avatar_url || '';

    await db.query(
      'INSERT INTO notifications (id, user_id, type, sender_name, sender_avatar, text, target_id, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [generateId(), recipientId, 'message', senderName, senderAvatar, 'enviou uma nova mensagem direta.', conversationId, false]
    );

    res.status(201).json({ id: messageId, timestamp: timeStr });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ==================== NOTIFICATIONS ROUTES ====================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, type, sender_name as user, sender_avatar as "userAvatar", text, target_id as "targetId", created_at, is_read as "isRead" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    const formatted = result.rows.map(row => {
      const diffMs = Date.now() - new Date(row.created_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeStr = 'Agora';
      if (diffDays > 0) {
        timeStr = `${diffDays}d`;
      } else if (diffHours > 0) {
        timeStr = `${diffHours}h`;
      } else if (diffMins > 0) {
        timeStr = `${diffMins}m`;
      }

      return {
        id: row.id,
        type: row.type,
        user: row.user,
        userAvatar: row.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        text: row.text,
        targetId: row.targetId,
        timestamp: timeStr,
        isRead: row.isRead
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notificationId, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas' });
  }
});

// ==================== MEDIA UPLOAD ROUTE ====================

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const host = req.get('host');
  const protocol = req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor PostgreSQL Backend Pet-X rodando na porta ${PORT}`);
});

