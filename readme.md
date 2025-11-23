  -----**Como rodar**-----

Guia de Instalação e Teste Local do Projeto
Este projeto é composto por:
Backend Node.js com PostgreSQL
App mobile em React Native com Expo

 **Requisitos**

Node.js (v18+)
PostgreSQL instalado e rodando
Expo CLI (npm install -g expo-cli)
pgAdmin (opcional, para visualizar o banco)
Editor de código (VS Code recomendado)

 **Estrutura do Projeto**

Código
/backend         → API Node.js + PostgreSQL
/app             → App React Native com Expo
 Configuração do Backend

1. Instale as dependências

cmd
cd backend
npm install

2. Configure a conexão com o banco

No arquivo src/db.ts ou equivalente:

  import { Pool } from 'pg';

  export const pool = new Pool({
    user: 'seu_usuario',
    host: 'localhost',
    database: 'nome_do_banco',
    password: 'sua_senha',
    port: 5432,
  });

3. Inicie o servidor

cmd
npx tsx watch src/server.ts // Reinicia o servidor quando atualiza o código

Certifique-se de que o backend está escutando em 0.0.0.0:

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);

 **Configuração do App React Native**
 
1. Instale as dependências

cmd
cd app
npm install

2. Configure o IP da API
No arquivo components/Api.ts:

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://SEU_IP_LOCAL:3000',
});

export default api;
**Substitua SEU_IP_LOCAL pelo IP da máquina onde o backend está rodando. Use ipconfig no terminal para descobrir (ex: 192.168.0.105)**

 **Teste Local**
1. Inicie o backend

cmd
cd backend
npx tsx watch src/server.ts // Reinicia o servidor quando atualiza alguma coisa no código 

2. Inicie o app com Expo

cmd
cd app
npx expo start

**Escaneie o QR code com o Expo Go no celular**
**Certifique-se de que o celular está na mesma rede Wi-Fi que o computador**

 **Funcionalidades para Testar**

Cadastro de usuário

**Login**

Tela de perfil (editar nome, email, CPF)
Chat (envio de mensagens)
Feedback (estrelas + comentário)
Mapa

 **Verificação no Banco**

Use o pgAdmin ou terminal para verificar os dados:
  sql
    SELECT * FROM users;
    SELECT * FROM chat_messages;
    SELECT * FROM feedbacks;

 **Alternativa com ngrok (se rede local falhar)**

cmd
npm install -g ngrok
ngrok http 3000
Use o link gerado (https://abc123.ngrok.io) no Api.ts como baseURL.

###########################################################
###########################################################
 
 **Tutorial: Como usar PostgreSQL com pgAdmin (passo a passo)**
 
 1. Instalar PostgreSQL + pgAdmin

Windows
Acesse https://www.postgresql.org/download/windows
Baixe o instalador oficial
Durante a instalação:
  Escolha uma senha segura para o usuário postgres (guarde essa senha!)
  Instale também o pgAdmin
  Deixe a porta padrão: 5432

 2. Abrir o pgAdmin pela primeira vez

Abra o pgAdmin 4
Ele pedirá a senha do usuário postgres (aquela que você definiu)
Após login, você verá o painel com:
Servers → PostgreSQL 15 (ou versão instalada)

 3. Criar o banco de dados

Clique com o botão direito em Databases
Escolha Create → Database
Nomeie como: app_mobile
Clique em Save

 4. Criar as tabelas

Expanda app_mobile → Schemas → public → Tables
Clique com o botão direito em Tables → Query Tool
Cole o script SQL abaixo:

sql
-- 0) Tipo ENUM para tipo de rota
CREATE TYPE tipo_rota AS ENUM ('ida', 'volta');

-- 1) Tabela users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(20),
  foto_url VARCHAR(255),
  role VARCHAR(32) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) Tabela bus_routes (rotas de ônibus)
CREATE TABLE bus_routes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo tipo_rota NOT NULL,
  pontos JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) Tabela buses (opcional: veículos e vínculo com motorista)
CREATE TABLE buses (
  id BIGSERIAL PRIMARY KEY,
  placa VARCHAR(32),
  nome VARCHAR(100),
  driver_id INT REFERENCES users(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE,
  route_id INT REFERENCES bus_routes(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4) Tabela chat_messages (mensagens) com vínculo a rota e campos extras
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  mensagem TEXT NOT NULL,
  route_id INT REFERENCES bus_routes(id),
  foto_url VARCHAR(255),
  client_id VARCHAR(128),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5) Tabela bus_positions
CREATE TABLE bus_positions (
  id SERIAL PRIMARY KEY,
  bus_id BIGINT, -- pode referenciar buses.id se você quiser (fk opcional)
  route_id INT REFERENCES bus_routes(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6) Tabela histórica de posições (append-only)
CREATE TABLE bus_positions_history (
  id BIGSERIAL PRIMARY KEY,
  bus_id BIGINT,
  route_id INT REFERENCES bus_routes(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 7) user_route_searches (histórico de buscas de rota)
CREATE TABLE user_route_searches (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  route_id INT REFERENCES bus_routes(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8) user_favorite_routes (rotas favoritas, único por user+route)
CREATE TABLE user_favorite_routes (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  route_id INT REFERENCES bus_routes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, route_id)
);

-- 9) feedbacks
CREATE TABLE feedbacks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  estrelas INT CHECK (estrelas >= 1 AND estrelas <= 5),
  comentario TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10) password_reset_tokens
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);

-- 11) email_change_tokens
CREATE TABLE email_change_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_change_token 
ON email_change_tokens(token);

-- 12) Índices de apoio (recomendados para performance)
CREATE INDEX idx_chat_messages_route 
ON chat_messages(route_id);
CREATE INDEX idx_chat_messages_user 
ON chat_messages(user_id);

CREATE INDEX idx_bus_positions_bus_id 
ON bus_positions(bus_id);
CREATE INDEX idx_bus_positions_route_id 
ON bus_positions(route_id);
CREATE INDEX idx_bus_positions_updated_at 
ON bus_positions(updated_at);

CREATE INDEX idx_bp_hist_bus 
ON bus_positions_history(bus_id);
CREATE INDEX idx_bp_hist_route_time 
ON bus_positions_history(route_id, recorded_at DESC);

CREATE INDEX idx_user_route_searches_user 
ON user_route_searches(user_id);
CREATE INDEX idx_user_route_searches_route 
ON user_route_searches(route_id);

CREATE INDEX idx_user_favorite_routes_user 
ON user_favorite_routes(user_id);

-- Rota 1
INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Guapura - Rodoviária', 'ida', '[{"lat":-24.1961,"lng":-46.7750},{"lat":-24.1970,"lng":-46.7745},{"lat":-24.1980,"lng":-46.7740},{"lat":-24.1990,"lng":-46.7735},{"lat":-24.2000,"lng":-46.7730},{"lat":-24.2010,"lng":-46.7725},{"lat":-24.2020,"lng":-46.7720},{"lat":-24.2030,"lng":-46.7715},{"lat":-24.2040,"lng":-46.7710},{"lat":-24.2050,"lng":-46.7705}]');

INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Rodoviária - Guapura', 'volta', '[{"lat":-24.2050,"lng":-46.7705},{"lat":-24.2040,"lng":-46.7710},{"lat":-24.2030,"lng":-46.7715},{"lat":-24.2020,"lng":-46.7720},{"lat":-24.2010,"lng":-46.7725},{"lat":-24.2000,"lng":-46.7730},{"lat":-24.1990,"lng":-46.7735},{"lat":-24.1980,"lng":-46.7740},{"lat":-24.1970,"lng":-46.7745},{"lat":-24.1961,"lng":-46.7750}]');

-- Rota 2
INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Gaivotas - Centro', 'ida', '[{"lat":-24.1900,"lng":-46.7755},{"lat":-24.1910,"lng":-46.7750},{"lat":-24.1920,"lng":-46.7745},{"lat":-24.1930,"lng":-46.7740},{"lat":-24.1940,"lng":-46.7735},{"lat":-24.1950,"lng":-46.7730},{"lat":-24.1960,"lng":-46.7725},{"lat":-24.1970,"lng":-46.7720},{"lat":-24.1980,"lng":-46.7715},{"lat":-24.1990,"lng":-46.7710}]');

INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Centro - Gaivotas', 'volta', '[{"lat":-24.1990,"lng":-46.7710},{"lat":-24.1980,"lng":-46.7715},{"lat":-24.1970,"lng":-46.7720},{"lat":-24.1960,"lng":-46.7725},{"lat":-24.1950,"lng":-46.7730},{"lat":-24.1940,"lng":-46.7735},{"lat":-24.1930,"lng":-46.7740},{"lat":-24.1920,"lng":-46.7745},{"lat":-24.1910,"lng":-46.7750},{"lat":-24.1900,"lng":-46.7755}]');

-- Rota 3
INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Loty - Centro', 'ida', '[{"lat":-24.1850,"lng":-46.7800},{"lat":-24.1860,"lng":-46.7795},{"lat":-24.1870,"lng":-46.7790},{"lat":-24.1880,"lng":-46.7785},{"lat":-24.1890,"lng":-46.7780},{"lat":-24.1900,"lng":-46.7775},{"lat":-24.1910,"lng":-46.7770},{"lat":-24.1920,"lng":-46.7765},{"lat":-24.1930,"lng":-46.7760},{"lat":-24.1940,"lng":-46.7755}]');

INSERT INTO bus_routes (nome, tipo, pontos) VALUES
('Centro - Loty', 'volta', '[{"lat":-24.1940,"lng":-46.7755},{"lat":-24.1930,"lng":-46.7760},{"lat":-24.1920,"lng":-46.7765},{"lat":-24.1910,"lng":-46.7770},{"lat":-24.1900,"lng":-46.7775},{"lat":-24.1890,"lng":-46.7780},{"lat":-24.1880,"lng":-46.7785},{"lat":-24.1870,"lng":-46.7790},{"lat":-24.1860,"lng":-46.7795},{"lat":-24.1850,"lng":-46.7800}]');

INSERT INTO bus_positions (latitude, longitude) VALUES
(-24.1970, -46.7745),
(-24.1910, -46.7750),
(-24.1860, -46.7795);

SELECT id, nome, tipo, jsonb_array_length(pontos) AS qtd_pontos
FROM bus_routes;

SELECT * FROM bus_positions;

Clique em Run ▶️ para executar

 5. Configurar acesso no backend
No seu projeto Node.js, configure o arquivo db.ts ou equivalente:

  import { Pool } from 'pg';

  export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'app_mobile',
    password: 'SUA_SENHA',
    port: 5432,
  });
Substitua "SUA_SENHA" pela senha que você definiu na instalação

 6. Testar conexão

No terminal:

cmd
  npx tsx watch src/server.ts

Você deve ver:
  Código
    Servidor rodando na porta 3000
    Conectado ao PostgreSQL

 7. Visualizar dados no pgAdmin

Vá em Tables → users → View/Edit Data → All Rows
Você verá os usuários cadastrados
Faça o mesmo com chat_messages e feedbacks

 8. Dicas úteis

Para apagar tudo: DROP DATABASE app_mobile;
Para limpar uma tabela: TRUNCATE TABLE users RESTART IDENTITY CASCADE;
Para testar manualmente: use o botão de Query Tool para rodar comandos SQL