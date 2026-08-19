-- Schema para o Sistema Brothers - Gestão de Manutenção
-- Este script é idempotente: pode ser executado várias vezes sem erro,
-- inclusive em bancos que já têm as tabelas criadas por uma versão anterior.

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS plano TEXT;

-- Código numérico de 6 dígitos exibido para o cliente (ex: 000500). É gerado
-- automaticamente por uma sequence própria (não reaproveita o SERIAL padrão
-- para não colidir com nenhuma outra coluna), começando em 500, e é único.
CREATE SEQUENCE IF NOT EXISTS public.clientes_codigo_seq START WITH 500;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS codigo INTEGER NOT NULL DEFAULT nextval('public.clientes_codigo_seq') UNIQUE;
ALTER SEQUENCE public.clientes_codigo_seq OWNED BY public.clientes.codigo;

-- 2. Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS public.equipamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS ambiente TEXT;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS btus INTEGER;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Código único do equipamento (ex: 000001), usado na etiqueta de identificação
-- impressa e fixada no equipamento (ver rota /etiqueta/$id no app).
CREATE SEQUENCE IF NOT EXISTS public.equipamentos_codigo_seq START WITH 1;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS codigo INTEGER NOT NULL DEFAULT nextval('public.equipamentos_codigo_seq') UNIQUE;
ALTER SEQUENCE public.equipamentos_codigo_seq OWNED BY public.equipamentos.codigo;

-- Todo equipamento cadastrado pelo próprio cliente fica pendente até um
-- técnico finalizar presencialmente (emitindo a etiqueta) — e um técnico
-- que cadastra em nome do cliente também precisa dessa confirmação, seja
-- pelo próprio cliente confirmando no app dele, seja por assinatura colhida
-- na hora (mesmo mecanismo usado na conclusão de OS, ver offline-sync.ts).
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS confirmado_cliente BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS confirmado_por TEXT;
ALTER TABLE public.equipamentos DROP CONSTRAINT IF EXISTS equipamentos_confirmado_por_check;
ALTER TABLE public.equipamentos ADD CONSTRAINT equipamentos_confirmado_por_check
  CHECK (confirmado_por IS NULL OR confirmado_por IN ('cliente', 'assinatura_tecnico'));
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS assinatura_url TEXT;

-- 3. Tabela de Técnicos
CREATE TABLE IF NOT EXISTS public.tecnicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  especialidade TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS area_atuacao TEXT;
ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Nível de privilégio do usuário dentro do app do técnico/admin. Não há
-- login próprio por papel ainda (ver política de RLS mais abaixo) — este
-- campo hoje serve para exibição e para as telas de administração saberem
-- quem é admin/supervisor/técnico de campo.
ALTER TABLE public.tecnicos ADD COLUMN IF NOT EXISTS nivel_privilegio TEXT NOT NULL DEFAULT 'Técnico';
ALTER TABLE public.tecnicos DROP CONSTRAINT IF EXISTS tecnicos_nivel_privilegio_check;
ALTER TABLE public.tecnicos ADD CONSTRAINT tecnicos_nivel_privilegio_check
  CHECK (nivel_privilegio IN ('Administrador', 'Supervisor', 'Técnico'));

-- 3.1 Novo modelo de usuários: users + profiles_cliente + profiles_tecnico
-- ---------------------------------------------------------------------
-- Unifica cliente/técnico/admin numa tabela `users` (1:1 com auth.users,
-- sem duplicar senha — o Supabase Auth já cuida disso) com um `role`, e
-- perfis específicos em tabelas separadas. Substitui `clientes` e
-- `tecnicos` como fonte de verdade do app a partir de agora; as tabelas
-- antigas são mantidas (não apagadas) para não perder histórico/rollback.
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('cliente', 'tecnico', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  role public.user_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles_cliente (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  codigo INTEGER NOT NULL DEFAULT nextval('public.clientes_codigo_seq') UNIQUE,
  endereco TEXT,
  plano TEXT
);

CREATE TABLE IF NOT EXISTS public.profiles_tecnico (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  especialidade TEXT,
  crea TEXT,
  cpf TEXT,
  area_atuacao TEXT,
  disponibilidade TEXT,
  nivel_privilegio TEXT NOT NULL DEFAULT 'Técnico',
  ativo BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.profiles_tecnico DROP CONSTRAINT IF EXISTS profiles_tecnico_nivel_privilegio_check;
ALTER TABLE public.profiles_tecnico ADD CONSTRAINT profiles_tecnico_nivel_privilegio_check
  CHECK (nivel_privilegio IN ('Administrador', 'Supervisor', 'Técnico'));

-- Convites de equipe: o app só tem a chave `anon` do Supabase, que não
-- consegue criar login para terceiros (isso exige a service role, num
-- backend). Então o admin pré-cadastra um convite por e-mail com os dados
-- e o nível de privilégio; quando essa pessoa cria a própria conta (tela
-- /cadastro, com o mesmo e-mail), o convite é consumido automaticamente e
-- vira um `profiles_tecnico` de verdade, em vez de um `profiles_cliente`.
CREATE TABLE IF NOT EXISTS public.convites_tecnico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT,
  especialidade TEXT,
  crea TEXT,
  area_atuacao TEXT,
  nivel_privilegio TEXT NOT NULL DEFAULT 'Técnico',
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.convites_tecnico DROP CONSTRAINT IF EXISTS convites_tecnico_nivel_privilegio_check;
ALTER TABLE public.convites_tecnico ADD CONSTRAINT convites_tecnico_nivel_privilegio_check
  CHECK (nivel_privilegio IN ('Administrador', 'Supervisor', 'Técnico'));

-- Migra os clientes já cadastrados (que já têm login) para o novo modelo.
INSERT INTO public.users (id, nome, email, telefone, role, created_at)
SELECT user_id, nome, email, telefone, 'cliente', created_at
FROM public.clientes
WHERE user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles_cliente (user_id, codigo, endereco, plano)
SELECT user_id, codigo, endereco, plano
FROM public.clientes
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- `equipamentos.cliente_id` apontava para `clientes.id` (PK própria da
-- tabela antiga). No novo modelo o cliente É o usuário autenticado, então
-- a FK passa a apontar direto para `users.id` (= auth.uid()). Migra os
-- valores antes de trocar a constraint.
--
-- IMPORTANTE: este bloco só pode rodar UMA VEZ. Ele é guardado por um
-- `IF NOT EXISTS (... FK já aponta pra users ...)` porque, sem essa guarda,
-- rodar o script de novo (ele é idempotente em todo o resto) comparava
-- `cliente_id` (já migrado, contém auth.uid()) com `clientes.id` (não bate
-- mais) e zerava `cliente_id` de todos os equipamentos na segunda execução.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_class frel ON frel.oid = con.confrelid
    WHERE con.conname = 'equipamentos_cliente_id_fkey'
      AND rel.relname = 'equipamentos'
      AND frel.relname = 'users'
  ) THEN
    EXECUTE 'ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS cliente_user_id UUID';
    EXECUTE 'UPDATE public.equipamentos e SET cliente_user_id = c.user_id FROM public.clientes c WHERE e.cliente_id = c.id AND e.cliente_user_id IS NULL';

    -- Políticas de execuções anteriores deste script dependem da coluna
    -- cliente_id — precisam cair antes de trocá-la (são recriadas mais abaixo).
    EXECUTE 'DROP POLICY IF EXISTS "Cliente vê e edita seus próprios equipamentos" ON public.equipamentos';
    EXECUTE 'DROP POLICY IF EXISTS "Cliente vê e edita suas próprias ordens de serviço" ON public.ordens_servico';

    EXECUTE 'ALTER TABLE public.equipamentos DROP CONSTRAINT IF EXISTS equipamentos_cliente_id_fkey';
    EXECUTE 'ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS cliente_id';
    EXECUTE 'ALTER TABLE public.equipamentos RENAME COLUMN cliente_user_id TO cliente_id';
    EXECUTE 'ALTER TABLE public.equipamentos ADD CONSTRAINT equipamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.users(id) ON DELETE CASCADE';
  END IF;
END $$;

-- 4. Tabela de Ordens de Serviço (OS)
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os SERIAL,
  equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Aberto' NOT NULL, -- Ex: Aberto, Em Andamento, Concluído, Cancelado
  descricao_problema TEXT NOT NULL,
  servico_realizado TEXT,
  valor NUMERIC(10, 2),
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  data_saida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS numero_os SERIAL;

-- Confirmação de finalização (final ou parcial) do atendimento. Pode vir do
-- próprio cliente confirmando no app dele, ou de uma assinatura colhida no
-- app do técnico (usado quando o sinal de internet está ruim: a assinatura
-- é só um desenho, funciona offline, e o envio/upload pode ficar pendente
-- até a conexão voltar — ver fila local em src/lib/brothers/offline-sync.ts).
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS confirmado_cliente BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS confirmado_por TEXT;
ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_confirmado_por_check;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_confirmado_por_check
  CHECK (confirmado_por IS NULL OR confirmado_por IN ('cliente', 'assinatura_tecnico'));
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS assinatura_url TEXT;

-- Segurança (Row Level Security - RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites_tecnico ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (de versões anteriores do schema, incluindo as
-- permissivas "Permitir tudo para todos...") antes de recriar as atuais.
DROP POLICY IF EXISTS "Permitir tudo para todos em clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir tudo para todos em equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Permitir tudo para todos em tecnicos" ON public.tecnicos;
DROP POLICY IF EXISTS "Permitir tudo para todos em ordens_servico" ON public.ordens_servico;
DROP POLICY IF EXISTS "Cliente vê e edita seu próprio registro" ON public.clientes;
DROP POLICY IF EXISTS "Cliente vê e edita seus próprios equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver técnicos" ON public.tecnicos;
DROP POLICY IF EXISTS "Cliente vê e edita suas próprias ordens de serviço" ON public.ordens_servico;

-- Cada usuário autenticado só enxerga e altera o próprio cliente e os dados
-- (equipamentos, chamados) associados a ele. Técnicos são visíveis para
-- qualquer usuário autenticado (necessário para exibir o técnico designado).
CREATE POLICY "Cliente vê e edita seu próprio registro" ON public.clientes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cliente_id agora É o auth.uid() do dono (ver migração da FK acima).
CREATE POLICY "Cliente vê e edita seus próprios equipamentos" ON public.equipamentos
  FOR ALL USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "Usuários autenticados podem ver técnicos" ON public.tecnicos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cliente vê e edita suas próprias ordens de serviço" ON public.ordens_servico
  FOR ALL USING (
    equipamento_id IN (SELECT id FROM public.equipamentos WHERE cliente_id = auth.uid())
  ) WITH CHECK (
    equipamento_id IN (SELECT id FROM public.equipamentos WHERE cliente_id = auth.uid())
  );

-- O app do técnico (/tecnico) ainda não tem login/perfil próprio: ele é
-- acessado com a mesma sessão do cliente logado. Sem uma política extra, o
-- técnico só enxergaria os próprios chamados dele (RLS de "Cliente vê e edita
-- seu(s) X" acima). Como não há papéis (roles) reais ainda, liberamos leitura
-- de tudo para qualquer usuário autenticado — e permissão para o técnico
-- atualizar o status/serviço realizado de qualquer ordem de serviço.
-- OBS: quando o app do técnico ganhar login próprio, troque `auth.role() =
-- 'authenticated'` por uma checagem real de papel (ex: tabela de staff).
DROP POLICY IF EXISTS "Equipe pode ver todos os clientes" ON public.clientes;
DROP POLICY IF EXISTS "Equipe pode ver todos os equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Equipe pode cadastrar equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Equipe pode atualizar equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Equipe pode ver todas as ordens de serviço" ON public.ordens_servico;
DROP POLICY IF EXISTS "Equipe pode atualizar ordens de serviço" ON public.ordens_servico;
DROP POLICY IF EXISTS "Equipe pode cadastrar técnicos" ON public.tecnicos;

CREATE POLICY "Equipe pode ver todos os clientes" ON public.clientes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Equipe pode ver todos os equipamentos" ON public.equipamentos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permite que o técnico cadastre equipamentos em nome do cliente (ex:
-- achou um equipamento não cadastrado durante a visita).
CREATE POLICY "Equipe pode cadastrar equipamentos" ON public.equipamentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permite que o técnico finalize presencialmente (confirmação + assinatura)
-- um equipamento, inclusive um que o próprio cliente cadastrou sozinho.
CREATE POLICY "Equipe pode atualizar equipamentos" ON public.equipamentos
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Permite que a tela /cadastro-tecnico crie novos registros de equipe
-- (mesma ressalva acima: sem papéis reais ainda, qualquer autenticado pode).
CREATE POLICY "Equipe pode cadastrar técnicos" ON public.tecnicos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Equipe pode ver todas as ordens de serviço" ON public.ordens_servico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Equipe pode atualizar ordens de serviço" ON public.ordens_servico
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- RLS do novo modelo de usuários. Cada pessoa vê/edita seu próprio
-- registro; qualquer autenticado pode ver os demais (mesma lógica de
-- "equipe compartilha visão" já usada acima, sem papéis reais ainda).
DROP POLICY IF EXISTS "Usuário vê e edita seu próprio registro" ON public.users;
DROP POLICY IF EXISTS "Equipe pode ver todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Cliente vê e edita seu próprio perfil" ON public.profiles_cliente;
DROP POLICY IF EXISTS "Equipe pode ver perfis de clientes" ON public.profiles_cliente;
DROP POLICY IF EXISTS "Técnico vê e edita seu próprio perfil" ON public.profiles_tecnico;
DROP POLICY IF EXISTS "Equipe pode ver perfis de técnicos" ON public.profiles_tecnico;
DROP POLICY IF EXISTS "Equipe pode criar convites" ON public.convites_tecnico;
DROP POLICY IF EXISTS "Equipe pode ver convites" ON public.convites_tecnico;
DROP POLICY IF EXISTS "Usuário consome seu próprio convite" ON public.convites_tecnico;

CREATE POLICY "Usuário vê e edita seu próprio registro" ON public.users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Equipe pode ver todos os usuários" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cliente vê e edita seu próprio perfil" ON public.profiles_cliente
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Equipe pode ver perfis de clientes" ON public.profiles_cliente
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Técnico vê e edita seu próprio perfil" ON public.profiles_tecnico
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Equipe pode ver perfis de técnicos" ON public.profiles_tecnico
  FOR SELECT USING (auth.role() = 'authenticated');

-- Convites: qualquer autenticado (hoje, sem papéis reais) pode criar/ver;
-- a própria pessoa convidada pode marcar o convite como usado ao aceitá-lo.
CREATE POLICY "Equipe pode criar convites" ON public.convites_tecnico
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Equipe pode ver convites" ON public.convites_tecnico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuário consome seu próprio convite" ON public.convites_tecnico
  FOR UPDATE USING (email = (auth.jwt() ->> 'email')) WITH CHECK (email = (auth.jwt() ->> 'email'));

-- Bucket público para as fotos dos equipamentos cadastrados pelo usuário
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipamentos', 'equipamentos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Leitura pública das fotos de equipamentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem enviar fotos de equipamentos" ON storage.objects;

CREATE POLICY "Leitura pública das fotos de equipamentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'equipamentos');

CREATE POLICY "Usuários autenticados podem enviar fotos de equipamentos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'equipamentos' AND auth.role() = 'authenticated');

-- Bucket para as assinaturas colhidas na conclusão do atendimento (final ou
-- parcial), tanto pelo próprio cliente quanto pelo técnico em campo.
INSERT INTO storage.buckets (id, name, public)
VALUES ('assinaturas', 'assinaturas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Leitura pública das assinaturas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem enviar assinaturas" ON storage.objects;

CREATE POLICY "Leitura pública das assinaturas" ON storage.objects
  FOR SELECT USING (bucket_id = 'assinaturas');

CREATE POLICY "Usuários autenticados podem enviar assinaturas" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assinaturas' AND auth.role() = 'authenticated');
