const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('🌱 Populando o banco de dados do Pet-X com dados de teste/demonstração...');

  try {
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Criar Usuários Demo
    const users = [
      {
        id: 'usr_alice_01',
        email: 'alice@petx.com',
        name: 'Alice',
        username: 'alice.vet',
        bio: 'Veterinária e protetora de animais. Apaixonada por resgates e cuidados especiais 🐾',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Pinheiros',
        latitude: -23.561684,
        longitude: -46.690822,
        account_type: 'protetor',
        is_verified: true,
      },
      {
        id: 'usr_ong_patas',
        email: 'contato@ongpatas.org',
        name: 'ONG Patas Amigas',
        username: 'ongpatasamigas',
        bio: 'Resgatamos e reabilitamos animais em situação de risco. Ajude-nos a encontrar um lar! 🐶🐱',
        avatar_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Vila Mariana',
        latitude: -23.5898,
        longitude: -46.6346,
        account_type: 'ong',
        is_verified: true,
      },
      {
        id: 'usr_carlos_02',
        email: 'carlos@petx.com',
        name: 'Carlos Eduardo',
        username: 'carlos_tutor',
        bio: 'Tutor do Max e do Pipoca. Defensor da adoção responsável ❤️',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        city: 'Rio de Janeiro',
        state: 'RJ',
        neighborhood: 'Copacabana',
        latitude: -22.9698,
        longitude: -43.1868,
        account_type: 'tutor',
        is_verified: false,
      },

    ];

    for (const u of users) {
      // Upsert user
      await db.query(
        `INSERT INTO users (id, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        [u.id, u.email, passwordHash]
      );

      // Upsert profile
      await db.query(
        `INSERT INTO profiles (id, user_id, name, username, bio, avatar_url, city, state, neighborhood, latitude, longitude, account_type, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           username = EXCLUDED.username,
           bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           neighborhood = EXCLUDED.neighborhood,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude`,
        [
          `prof_${u.id}`,
          u.id,
          u.name,
          u.username,
          u.bio,
          u.avatar_url,
          u.city,
          u.state,
          u.neighborhood,
          u.latitude,
          u.longitude,
          u.account_type,
          u.is_verified,
        ]
      );
    }

    // 2. Criar Posts de Pets (Adoção, Perdido, Resgatado)
    const posts = [
      {
        id: 'post_pet_01',
        user_id: 'usr_ong_patas',
        type: 'adocao',
        content: '🐾 Thor procura um lar com muito amor! É um filhotão de 8 meses, porte médio, já castrado e vacinado. Super dócil com crianças e outros cães.',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Vila Mariana',
        latitude: -23.5898,
        longitude: -46.6346,
        is_approximate: true,
        likes_count: 24,
        images: [
          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        id: 'post_pet_02',
        user_id: 'usr_carlos_02',
        type: 'perdido',
        content: '🚨 URGENTE: Gatinha "Luna" desapareceu próximo à Av. Nossa Senhora de Copacabana. É dócil, cinza com manchas brancas, tem coleira vermelha com plaquinha. Por favor compartilhem!',
        city: 'Rio de Janeiro',
        state: 'RJ',
        neighborhood: 'Copacabana',
        latitude: -22.9698,
        longitude: -43.1868,
        is_approximate: false,
        likes_count: 38,
        images: [
          'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        id: 'post_pet_03',
        user_id: 'usr_alice_01',
        type: 'resgatado',
        content: '✨ Final feliz! Resgatamos este cãozinho assustado na Marginal Pinheiros hoje cedo. Já passou por consulta veterinária e agora está descansando e bem alimentado.',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Pinheiros',
        latitude: -23.561684,
        longitude: -46.690822,
        is_approximate: true,
        likes_count: 52,
        images: [
          'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80',
        ],
      },
      {
        id: 'post_pet_04',
        user_id: 'usr_ong_patas',
        type: 'adocao',
        content: '🐱 Duplinha inseparável! Fred & Mel têm 3 meses, vermifugados e muito brincalhões. Adoção conjunta preferencial para apartamentos telados.',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Moema',
        latitude: -23.6034,
        longitude: -46.6632,
        is_approximate: false,
        likes_count: 19,
        images: [
          'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
        ],
      },
    ];

    for (const p of posts) {
      await db.query(
        `INSERT INTO posts (id, user_id, type, content, latitude, longitude, city, state, neighborhood, is_approximate, likes_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           content = EXCLUDED.content,
           likes_count = EXCLUDED.likes_count`,
        [p.id, p.user_id, p.type, p.content, p.latitude, p.longitude, p.city, p.state, p.neighborhood, p.is_approximate, p.likes_count]
      );

      // Inserir imagens
      for (let i = 0; i < p.images.length; i++) {
        await db.query(
          `INSERT INTO post_images (id, post_id, image_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [`img_${p.id}_${i}`, p.id, p.images[i]]
        );
      }
    }

    // 3. Criar Conversas e Mensagens de Exemplo
    const convId = 'conv_demo_01';
    await db.query(
      `INSERT INTO conversations (id, user1_id, user2_id, last_message, last_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET last_message = EXCLUDED.last_message, last_time = EXCLUDED.last_time`,
      [convId, 'usr_alice_01', 'usr_ong_patas', 'Olá! Vi o Thor no feed de adoção e gostaria de saber mais!', '10:30']
    );

    await db.query(
      `INSERT INTO messages (id, conversation_id, sender_id, text)
       VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        'msg_demo_01', convId, 'usr_alice_01', 'Olá! Vi o Thor no feed de adoção e gostaria de saber mais!',
        'msg_demo_02', convId, 'usr_ong_patas', 'Olá alice! O Thor está disponível sim! Você tem outros animais em casa?'
      ]
    );


    console.log('✅ Base de demonstração populada com sucesso!');
    console.log('👤 Usuário de teste: alice@petx.com (Senha: 123456)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao popular banco de dados:', err);
    process.exit(1);
  }
}

seed();
