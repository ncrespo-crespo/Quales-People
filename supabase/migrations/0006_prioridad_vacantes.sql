-- Prioridad de la búsqueda, a cargo del reclutador/admin.
alter table vacantes
  add column prioridad text not null default 'Media'
    check (prioridad in ('Alta', 'Media', 'Baja'));
