-- ============================================================
-- Como criar um novo professor a partir de agora
-- ============================================================
-- Importante: como a senha agora é guardada em hash, não dá mais
-- para criar professores direto pelo Table Editor (ele só aceita
-- valores literais, não consegue calcular o hash). A partir de
-- agora, use o SQL Editor com o comando abaixo.

insert into professores (nome, login, senha_hash, materia, curso_tecnico)
values (
    'Nome do Professor',
    'usuario@escola',
    extensions.crypt('12345678900', extensions.gen_salt('bf')), -- troque pelo CPF real (só números)
    'Nome da Matéria',
    false -- true se for do curso técnico
);
