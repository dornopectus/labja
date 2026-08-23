-- Lista todas as turmas cadastradas — olha se tem "3º C" duplicada
-- com grafia levemente diferente (acento, espaço, maiúscula/minúscula)
select id, nome from turmas order by nome;
