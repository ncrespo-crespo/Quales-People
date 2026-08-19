-- Cuando la postulación es de tipo "Freelance" (tipo_candidato), hace
-- falta saber de dónde viene ese freelance: mercado abierto, un
-- freelancer de la red de Elías, o de una agencia externa.
alter table postulaciones
  add column origen_freelance text
    check (origen_freelance in ('Mercado', 'Elías', 'Agencia'));
