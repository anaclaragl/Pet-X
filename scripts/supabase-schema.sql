-- =======================================================
-- PET-X SUPABASE / POSTGRESQL SCHEMA
-- Execute este script no SQL Editor do seu projeto Supabase
-- =======================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (Tutores e ONGs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('fisica', 'ong')),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Postagens (Feed estilo X/Twitter)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('perdido', 'encontrado', 'ong', 'outro')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Imagens das Postagens
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Curtidas
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 6. Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- =======================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Perfis são visíveis por qualquer usuário"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Posts
CREATE POLICY "Posts são visíveis por todos"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem publicar posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Post Images
CREATE POLICY "Imagens de posts são visíveis por todos"
  ON public.post_images FOR SELECT USING (true);

CREATE POLICY "Criadores do post podem inserir imagens"
  ON public.post_images FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

-- Políticas para Likes
CREATE POLICY "Likes são visíveis por todos"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem curtir"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seu próprio like"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Comentários
CREATE POLICY "Comentários são visíveis por todos"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem comentar"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- BUCKETS DE STORAGE (Armazenamento de Fotos de Pets)
-- =======================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imagens de pets são públicas para leitura"
  ON storage.objects FOR SELECT USING (bucket_id = 'pet-photos');

CREATE POLICY "Usuários autenticados podem subir imagens"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');
