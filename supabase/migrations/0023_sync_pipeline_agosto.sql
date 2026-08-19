-- Actualización desde una nueva exportación del pipeline (Pipeline_Data_v1.0,
-- agosto 2026), comparada contra la carga original (supabase/seed/0001 y 0002).
-- Ejecutar UNA SOLA VEZ: no tiene protección contra duplicados si se corre
-- dos veces (insertaría a Dalila Gonzalez de nuevo).
--
-- Vacantes (Hiring Plan Services 2026): sin cambios en ninguna de las 69 filas,
-- no hay nada que hacer ahí.
--
-- Candidatos (Candidatosas): 1 candidata nueva y 26 con el feedback de la
-- entrevista de área completado o actualizado. El resto de las 258 filas que
-- matchean con la carga original no tuvo ningún cambio de valor.
--
-- 3 nombres del archivo nuevo (Lucas Encina, Sebastián/Sebastian Burella,
-- Gabriel Nuñez) están duplicados en la base (dos candidatos con el mismo
-- nombre cada uno) y no se pueden emparejar sin ambigüedad con la fila del
-- archivo — no se tocan; si hace falta actualizarlos hay que hacerlo a mano
-- desde la ficha, viendo cuál de los dos corresponde.

-- 1) Candidata nueva: Dalila Gonzalez
with nueva as (
  insert into candidatos (
    nombre, apellido, nombre_completo, linkedin_url, fecha_ingreso, estado,
    area, formacion_tecnica, anios_experiencia, experiencia_consultoria,
    nivel_ingles, stack_principal
  ) values (
    'Dalila', 'Gonzalez', 'Dalila Gonzalez',
    'https://www.linkedin.com/in/dalila-gonzalez/details/experience/', '2026-08-12', 'Continua en base',
    'Services', 'Finalizada', 5.0, true,
    'Advance', 'Python, SQL, BigQuery.
Power BI + DAX.
Tableau y Metabase.
Procesos de ETL y validación de datos.
Jira y Confluence para gestión, documentación y seguimiento de proyectos.'
  )
  returning id
)
insert into postulaciones (
  candidato_id, etapa_actual, tipo_candidato, expectativa_salarial,
  seniority_propuesto_hr, feedback_entrevista_hr, feedback_entrevista_area
)
select id, 'Sourcing', 'Qualer', '$3.500.000',
  'Sr', 'GO', 'Trayectoria: recorrido sólido en proyectos de Data y Analytics, con experiencia en diferentes industrias como Automotive, Retail y Oil & Gas. Pasó por General Motors, compañías vinculadas a IA.
Stack Tech principal:

Python, SQL, BigQuery.
Power BI + DAX.
Tableau y Metabase.
Procesos de ETL y validación de datos.
Jira y Confluence para gestión, documentación y seguimiento de proyectos.
Experiencia destacada:

General Motors: proyectos end-to-end para el área de Marketing, trabajando con extracciones, análisis de datos, Power BI y DAX.
Empresa de IA / Retail: trabajo con grandes volúmenes de datos y proyectos para clientes como YPF. Validación de datos con SQL y desarrollo de procesos propios de ETL en Python.
Proyecto para compañía española: procesamiento de datos y generación de outputs predictivos de ventas para diferentes marcas de Europa.
Howdy: ETL en BigQuery y Python, con visualización en Tableau y trabajo directo con perfiles C-Level.
Psi Mamoliti: análisis de costo de adquisición de clientes, utilizando Metabase y SQL. Además, tuvo un rol de mayor ownership, cercano a Product Owner, con dos desarrolladores a cargo.
A destacar: me parece interesante principalmente por la combinación entre experiencia técnica y exposición al negocio. No solo tiene recorrido en el ciclo completo del dato  (desde extracción y transformación hasta el análisis y la visualización), sino que también trabajó directamente con stakeholders y perfiles C-Level, tomando ownership sobre proyectos, ceremonias y gestión de tickets.

Nivel inglés: Avanzado
Ubicación: Belgrano, CABA. 
Disponibilidad: Inmediata
Licencias programadas: No'
from nueva;

-- 2) Feedback de entrevista de área completado/actualizado (26 candidatos).
-- Se actualiza la postulación del candidato solo cuando tiene exactamente
-- una (si tiene más de una, no hay forma de saber a cuál corresponde el
-- feedback sin ambigüedad, así que se avisa por NOTICE en vez de adivinar).
do $$
declare
  fila record;
  v_candidato_id uuid;
  v_count int;
  total_ok int := 0;
  total_saltado int := 0;
begin
  for fila in select * from (values
    ('Nicolás Guardo', 'Nicolás es Geólogo de formación, con una reconversión autodidacta hacia data en los últimos 4 años. Actualmente se desempeña en Accenture, donde viene consolidando experiencia en cloud, data engineering y primeros acercamientos a arquitectura de soluciones.
Su recorrido muestra muy buena capacidad de aprendizaje y adaptabilidad, especialmente en contextos de migración a cloud y entornos de datos en evolución. Cuenta con experiencia en proyectos para la industria de gas y banca.

Opera bajo marco Scrum utilizando Jira para seguimiento. Se describe ,y se lo ve, como un perfil metódico, ordenado y con buena autonomía en la ejecución.
Su foco está claramente puesto en backend y data pipelines, con menor recorrido en visualización.

Motivaciones y condiciones
Busca consolidar seniority técnico y fortalecer habilidades blandas. Le atraen especialmente los proyectos que combinen data con componente geoespacial.

Perfil con muy buena base en construcción y mindset de aprendizaje alto. Se lo ve curioso, adaptable y con buena lectura de riesgos en proyectos.
Hoy lo posiciono como SSR Adv con rápida proyección a SR.

No nos calza a nivel salarial para la banda actual. Sin embargo, es un perfil interesante para tener en radar por potencial de crecimiento.'),
    ('Lautaro Botta', 'Lautaro esta estudiando Lic en Informática. Es de La Plata. Es un Jr - Jr Adv con experienicia en base de datos, ETL y la parte viz.
No lo veo con fit qualer. Hablo mal de su anterior trabajo'),
    ('María Justina Moreno', 'Rosarina. Justina tiene expe construyendo soluciones BI end-to-end. Presenta un perfil hands-on con alta autonomía, habiendo trabajado tanto en empresas como en modalidad freelance, liderando iniciativas de datos desde la arquitectura hasta la visualización.
Actualmente en Nasini impulsa la adopción de una cultura data-driven, operando como referente única de BI y cubriendo el ciclo completo de datos.
En paralelo, mantiene actividad freelance desarrollando dashboards para consultoras y clientes como Rosario Bus, donde previamente lideró la migración de QlikView a Power BI.

Feedback Kar: Durante la entrevista se mostró predispuesta al cambio y con interés de sumarse a trabajr en equipo, ya que hoy esta trabajando de forma muy individual. 
 Tiene experiencia limitada en consultoría y recorrido acotado en liderazgo de equipos (tuvo personas a cargo en el pasado, pero no recientemente); no tiene conocimientos de KPI del negocio. Ingles intermedio.
Es qualer sin dudad, me gusto su energia y actitud'),
    ('Magalí Torres', '"Magali cuenta con experiencia en consultoría de datos, con un perfil orientado a BI. Actualmente trabaja en Prisma dentro del área de Gobierno de IT como única analista de datos del equipo, gestionando el end-to-end.
Previamente, en NTT Data se desempeñó como lead técnico-funcional, con exposición directa al cliente, participando en el relevamiento de requerimientos y en reuniones de seguimiento de avances. Adicionalmente, tuvo responsabilidad en el acompañamiento de perfiles a cargo de menor seniority, brindando feedback y soporte en la distribución de tareas.

Desde lo técnico, se mueve con solidez en Power BI (cuenta con certificación Microsoft), SQL y Alteryx, complementando con Power Apps y Power Automate para automatizaciones.

Es un perfil con buena base técnica en BI y experiencia real de liderazgo operativo de equipos chicos. Muestra criterio para el manejo de cliente y seguimiento de entregables. Como oportunidad de desarrollo, aún no tuvo responsabilidad directa sobre métricas del proyecto (GM, rentabilidad), aunque se muestra abierta y motivada a incorporarlas.

Hoy busca un rol lead más desafiante, con equipo a cargo, mayor involucramiento en gestión integral y exposición a negocio."'),
    ('Florencia Ortone', 'Cuenta con más de 4 años de experiencia en consultoría, trabajando para NTT Data con foco en el cliente Pan American Energy, donde se desempeña como especialista en Gobierno de Datos en un rol de acompañamiento end-to-end del proceso. Presenta un perfil híbrido, con buen equilibrio entre gestión de iniciativas, relacionamiento con cliente y ejecución técnica dentro del marco de data governance.

Actualmente participa en la migración progresiva hacia AWS y en la evolución de prácticas de gobierno, calidad y catalogación. Lidera un equipo de 2 perfiles en iniciativas transversales a gobierno, mostrando un estilo cercano basado en feedback constante, planificación y acompañamiento ante bloqueos. Tiene experiencia en seguimiento de performance y en ajustes de dinámica cuando detecta desvíos.

Puntos a tener en cuenta:
- Experiencia de liderazgo aún en escala chica
-Trayectoria concentrada principalmente en un solo cliente (PAE)

Motivación de cambio:
Busca mayor exposición a roles de seguimiento/gestión, crecimiento técnico (incluyendo IA) y mayor entendimiento de indicadores de negocio. Se muestra interesada en nuevos entornos y desafíos.'),
    ('Ezequiel Ferrario', 'Ezequiel se desempeña actualmente como Data Visualization Lead en Fresh BI, donde lleva más de 2 años y medio trabajando principalmente sobre el ecosistema Microsoft. Cuenta con un perfil con foco en Power BI end-to-end.
Hoy divide su rol entre desarrollo y liderazgo técnico transversal. Gestiona proyectos de BI de punta a punta (relevamiento, diseño, desarrollo, presentación, soporte y capacitación), y al mismo tiempo impulsa capacitaciones internas y coaching técnico para otros developers de la consultora.

Trabaja habitualmente de forma autónoma con clientes (muchas veces como único recurso BI), con buena exposición consultiva y manejo de expectativas.
Experiencia de liderazgo: no cuenta hoy con equipo formal a cargo, pero sí se posiciona como referente técnico, brindando coaching, definiendo lineamientos de visualización y acompañando a otros equipos.

Previamente, en NTT Data (proyecto PAE), tuvo una experiencia más directa de coordinación durante la construcción de un MVP.

Interés: continuar creciendo en liderazgo técnico dentro del ecosistema data y conocer nuevas tecnologias.

Perfil sólido en Data Visualization y consultoría BI, con muy buen dominio del stack Microsoft y madurez en el frente cliente.
Lo veo bien posicionado para roles Sr / Tech Lead en visualización.
Su experiencia es muy especializada en Power BI.'),
    ('María Belén Peralta', '"Belén se desempeña actualmente en Envolve Decision Science (consultora chica) en un rol híbrido que combina preventa técnica, planificación y gestión de proyectos. Participa activamente en la definición de estrategias de implementación junto al equipo comercial y hoy se posiciona como líder en distintos proyectos, con equipo a cargo. Presenta un perfil BI híbrido, equilibrando ejecución técnica y gestión.

Cuenta además con experiencia previa como lead en proyectos para Equifax y Accenture. Se mueve con buena madurez en entornos de consultoría y le ha tocado incorporarse a proyectos con fricciones con el cliente; según su relato, ha logrado recomponer la relación mediante mayor estructura, comunicación y visibilidad del avance.

Su base en BI es sólida. En Inteligencia Artificial se encuentra en fase de upskilling.

La veo con un muy buen frente consultivo, con adecuado manejo de stakeholders y equipos. Actualmente busca consolidar su rol de liderazgo, profundizar su crecimiento en IA y valora entornos con buen clima y oportunidades de desarrollo."'),
    ('Bruno Mahiques', 'Bruno es Ingeniero en Sistemas y actualmente cursa un posgrado en Ciencia de Datos.
Cuenta con +8 años de experiencia en BI, con recorrido en industrias como Oil & Gas, agro, auditoría, finanzas y HR. Se posiciona como un perfil híbrido, con sólida base técnica y experiencia en gestión.

A nivel liderazgo, coordinó equipos de hasta 5 personas manteniendo un rol hands-on. Tiene experiencia end-to-end en proyectos: participa desde el relevamiento con cliente y definición de arquitectura hasta la estimación y asignación de tareas.
Buen frente consultivo: compartió casos donde logró recomponer vínculos con clientes que venían con insatisfacción previa, apalancándose en ordenamiento de KPIs, mayor seguimiento y comunicación proactiva.'),
    ('Ingrid Vargas', 'Tiene exp en Ab Initio
No es para nada un perfil qualer. NO GO'),
    ('Nicolás Dejman', 'Muestra un perfil técnico-consultivo.
Experiencia de liderazgo: cuenta con una experiencia concreta liderando un squad de 3 personas en Power BI durante aproximadamente 6 meses. En ese contexto:
- Delegó tareas y planificó avances
- Lideró reuniones con cliente
- Acompañó técnicamente al equipo
- Impulsó capacitaciones internas

Está motivado por proyectos transversales al negocio donde pueda entender el impacto end-to-end y seguir creciendo en liderazgo técnico.

Perfil técnicamente sólido en Power BI, con primeras experiencias reales de liderazgo y buena madurez consultiva.
Lo veo hoy como un SSR+/SR inicial.
No lo veo con fit qualer'),
    ('Cecilia Paula Barrionuevo', '"Trabaja actualmente en Teleperformance, con foco principal en SQL Server y procesamiento de datos. Participa en el flujo end-to-end de integración y preparación de datos para reporting en Power BI.

Participa en el proceso end-to-end de datos, desde el levantamiento de requerimientos hasta la preparación de la información que alimenta los dashboards. En función de los indicadores que requieren los clientes, se encarga de procesar y estructurar los datos necesarios para los reportes.

Forma parte de un equipo de 5 analistas más un líder, donde trabajan de forma coordinada en la integración de datos. Si bien cada analista desarrolla sus procesos de manera independiente, alinean criterios de procesamiento y estructura de datos en equipo.

Dinámica de trabajo:
-Daily diaria para seguimiento de tareas
-Reuniones semanales o mensuales con clientes para revisar reportes, ajustar métricas o incorporar nuevos indicadores.

Ante bloqueos relacionados con faltante o inconsistencias en la información, coordina reuniones con el cliente para entender la disponibilidad del dato y definir alternativas para obtenerlo o reconstruirlo dentro del modelo.

Disponibilidad: podría ingresar de manera inmediata, aunque lo ideal para ella sería con una semana de preaviso.
Vacaciones: tiene 14 días ya planificados dentro de un mes.

Feedback Kar:
A mí me gustó mucho su perfil. La veo como Jr Initial, acostumbrada a trabajar con clientes y con dinámica de equipo. La veo adaptandose muy bien a nuestro ritmo."'),
    ('Ismael Flores', '"Es de La Rioja. Participó de nustras capacitaciones en 2024. Actualmente trabajando en datos mientras cursa Ingeniería en Sistemas. Inició su camino en datos en el 2023 luego de trabajar en otros rubros, formándose principalmente en Python y análisis de datos.
Realizó el bootcamp de Soy Henry con foco en Data Analytics y desarrolló proyectos propios vinculados a machine learning, entre ellos un proyecto de deep learning (“Cat Or Dog”) para clasificación de imágenes de perros y gatos. También exploró herramientas como YOLO para detección de objetos.

Actualmente trabaja en Tributo Simple (desde agosto 2024), donde participa en tareas de organización de datasets, monitoreo de métricas y reporting para áreas técnicas. Utiliza principalmente Looker Studio (adaptándose desde Power BI) y ha desarrollado más de 100 reportes para seguimiento de desempeño de equipos de ingeniería de datos y backend.

Muestra buena capacidad de aprendizaje, curiosidad técnica y autonomía, con interés en seguir creciendo en el área de datos. Lo veo en Quales. Me gustó mucho su perfil y ganas de desafiarse.'),
    ('Lucas Montenegro', 'Referido - Valentina Policardo'),
    ('Mauro Fantini', 'Referido - Lautaro Diharce'),
    ('Noelia Cualina', 'Referido - Lautaro Diharce'),
    ('Juan Ignacio Noto', 'Referido - Cliente'),
    ('Guido Tomasella', 'en Telecom participó en la construcción de equipos técnicos, sumando perfiles de Data Engineer, AI Engineer y Gobierno de Datos, y llegó a liderar un equipo de 15 personas, aunque aclaró que ocupar un rol de liderazgo no es excluyente para él, mostrándose abierto también a posiciones más operativas. En su empresa actual, que atravesó una transición de un esquema de servicios hacia un esquema de producto coincidiendo con el ingreso de una CDAO, trabajó en calidad de datos y definición de KPIs, y tuvo cierta exposición a la vertical de Data Science, incluyendo trabajo con agentes y herramientas internas. Respecto a Snowflake, su conocimiento es limitado: no manejó la plataforma en profundidad ni trabajó bajo modalidad de servicios sobre ella. En síntesis, sus áreas de experiencia declaradas son calidad de datos, IA y gobierno de datos.'),
    ('Amalia Galeano', 'En Naranja participó del relevamiento y catalogado de datos, y luego avanzó hacia la automatización de ese proceso, desarrollando un agente de catalogado capaz de inferir información de cada uno de los proyectos, trabajando sobre 5 CCoE. También estuvo a cargo de la migración a Collibra, controlando que todo el catalogado histórico se trasladara correctamente. Dentro del esquema Collibra-Snowflake, se encargaba de todos los refresh de Collibra y del pasaje a producción, además de capacitar a los data stewards. Realizó también una prueba de concepto (POC) con SageMaker, aunque remarcó que no es una herramienta amigable para el usuario final en comparación con Collibra u OvalEdge. Tiene conocimientos de DAMA, particularmente en RBAC, dueños de dominio y custodios de datos. Cuenta con certificaciones y manejo en SQL Server, MicroStrategy, Power BI y Business Objects, además de experiencia con Oracle P&L y Teradata.
En su paso por un banco, se desempeñó como Product Owner, trabajando junto a arquitectos de datos, un líder técnico, un analista de procesos y el área legal, en el marco de normativas del BCRA, con conexión vía API full REST. El equipo era reducido, de solo 3 personas, y utilizaban Watson (IBM) para catalogado y reglas de calidad. En Snowflake, sus tareas incluían revisión de tablas, trabajo en prelanding y producción, generación de perfilado de tablas, revisión de datos publicados, y propuesta de reglas de calidad utilizando Snowflake, Python y SQL.'),
    ('Mateo Santillan', 'experiencia reciente en Assurance, donde realizó un reemplazo de 3 meses en el área de IT. Al finalizar dicho reemplazo, recibió una propuesta para continuar en otra posición dentro de la compañía que no estaba alineada a su rol, por lo que decidió desistir. Su perfil está orientado a Soporte IT / Hands-on, con experiencia en mantenimiento, reparación, limpieza y armado de equipos, con una seniority Jr Advance. Cuenta con experiencia en soporte técnico N1/N2, resolución de incidentes, gestión de tickets mediante Jira (Kanban), altas y bajas de usuarios, preparación y entrega de laptops, administración de cuentas de Microsoft 365 y Google Workspace, y gestión de identidades (IDMS) y accesos.
En cuanto a conocimientos técnicos, maneja Windows 10 y 11, Windows Server (administración por interfaz gráfica), Active Directory (altas, bajas y modificaciones de usuarios), Microsoft Teams y Outlook, gestión de cuentas y contraseñas, campañas de phishing, y networking básico (switches y cableado). No tiene experiencia en OneDrive. Es estudiante de la Tecnicatura en Redes e Informática (Teclab), le restan dos finales para alcanzar el título intermedio y prevé graduarse en 2027. Por último, cuenta con inglés avanzado, habiendo trabajado con equipos de Estados Unidos.'),
    ('Sergio Sanchez', 'El candidato nos conocía previamente y solo le interesa avanzar en la búsqueda de Quales; no se encuentra en búsqueda activa ni en procesos paralelos.

 Reside en Villa Ortúzar, CABA. 

Actualmente también trabaja para un cliente de España (Adesso), por lo que ya maneja el cambio de horario/horario de verano que implica trabajar con Europa. Su nivel de inglés es Upper Intermediate, adquirido trabajando en proyectos globales.

Cuenta con más de 9 años de experiencia. Hoy se desempeña en Tech BI (consultora) como Data Analyst, donde recibe requerimientos de un backlog, los analiza y estima horas de desarrollo y tecnologías involucradas, trabajando con dos clientes financieros y un cliente de España. Se ocupa de la capa analítica, reportes en Power BI, gestión de licencias, configuración de gateway, entorno de producción y capa de consumo del data warehouse. En el proyecto de España trabaja con Tableau, conectando con Salesforce, modelando los datos para su consumo y desarrollando los reportes, además de enfocarse en entender a los usuarios y el negocio en profundidad.

Entre sus experiencias previas destaca:

Trenes Argentinos: rol más orientado a Analytics Engineer, con foco en aplicar buenas prácticas de performance sobre múltiples reportes, desarrollo de scripts en Python y reportes en Power BI. Lo considera su proyecto más desafiante por la complejidad de las queries y desarrollos.
Gobierno de la Ciudad: proyecto de políticas públicas orientado a educación, donde se construyeron escuelas en base a los datos relevados; es el proyecto que más disfrutó.
Santander: rol de Data Analyst orientado a cultura de datos, donde participó como speaker en auditorios, destacando sus habilidades comunicacionales para traducir conceptos técnicos a audiencias no técnicas.
Disponibilidad de ingreso: dos semanas de preaviso.
Licencias programadas: semana de navidad y año nuevo 2026.
Lucas Foresto:'),
    ('Lucas Foresto', 'Reside en Córdoba Capital. 

No tiene inconvenientes para trabajar en inglés y realizó un máster en España. 

Su fuerte es SQL, área en la que se metió de lleno y desarrolló mayor expertise.

En cuanto a su experiencia, en Naranja se desempeñó como Business Analyst,  trabajó en Data Products, y actualmente está en Bitso (exchange de criptomonedas), en un puesto orientado a Business Intelligence combinado con skills de Data Scientist, enfocado en banca y fintech. Allí trabaja para el equipo de producto, ayudando con dashboards, detección de insights, incentivando nuevas propuestas y modelado de datos.

Su fortaleza principal es SQL, aplicado a pipelines, análisis de datos, KPIs y queries (tanto sencillas como más complejas). Tiene manejo de Python, aunque en menor medida. Utiliza Looker, y previamente trabajó con Power BI, teniendo además un curso en dicha herramienta. También cuenta con experiencia en Databricks, en un proceso de migración. Maneja Jira y Confluence como herramientas de gestión.

Disponibilidad de ingreso: dos semanas de preaviso.
Licencias programadas: primera semana de septiembre de 2026.'),
    ('Martin  Mesaglio', 'Perfil: +3 años de experiencia trabajando con Snowflake, incluyendo migración de warehouse. Referente técnico en procesos batch y streaming. Experiencia en sector financiero, trabajando codo a codo con perfiles funcionales para entender reglas de negocio de modelado de datos.'),
    ('Noelia  Navarro', 'Perfil con buena capacidad de comunicación con cliente, con experiencia demostrada en consultoría donde interactuaba directamente con el negocio para entender y transmitir sus necesidades. Se la vio con un perfil funcional-técnico, siendo capaz tanto de dialogar con el cliente sobre el negocio como de desarrollar ella misma las soluciones (pantallas, cuadros de mando y parte de las operaciones), sin depender exclusivamente de otros roles para la ejecución.
Tiene background en consultoría donde se dedicó al desarrollo de cuadros de mando, trabajando junto a una persona encargada específicamente del mockup. Tiene experiencia además en un proyecto de ingeniería ELT para un banco, donde tuvo un rol de nexo funcional con el cliente y desarrolló trabajos sobre Teradata y tablas en Snowflake.'),
    ('Florencia Perez', 'Perfil con fuerte en consultoría: tiene facilidad para interactuar con el cliente, entender la necesidad detrás de cada pedido y escuchar activamente para identificar el verdadero punto de dolor antes de avanzar con el desarrollo. Denota saber, entender y traducir necesidades de negocio técnicamente y poder negociar con cliente.

En NTT Data se desempeñó en visualización de datos con Power BI, estando a cargo de todos los desarrollos para que el cliente (Pan American Energy) pudiera visualizar sus datos, interactuando directamente con ellos para entender por qué necesitaban cada dashboard. A nivel técnico, cuenta con experiencia en desarrollo de tableros en Power BI, modelado de datos, limpieza de datos y fórmulas DAX, además de definición de RLS para establecer qué datos podía visualizar cada colaborador según su perfil. Trabajó también con Databricks para la limpieza de datos, desarrollando código analítico y creación de vistas mediante SQL, con el objetivo de llevar a Power BI tablas ya limpias y mejorar así la performance general de los reportes. Toda la infraestructura del proyecto se encontraba en Azure, utilizando Data Lake y Data Factory para correr los pipelines correspondientes. Además, mantenía reuniones con VPs cada 3 meses para presentar avances.'),
    ('Fernando Burrone', 'Cencosud participó activamente en el change management hacia una cultura data driven, trabajando en el reporting del equipo comercial y en benchmarks contra el mercado. Arrancó trabajando con MicroStrategy, codo a codo con el área de Data Governance, optimizando el consumo de datos del servidor. Tiene fuerte orientación a la toma de decisiones basada en datos y un entendimiento profundo del negocio.

En cuanto a herramientas, maneja SQL Server y SQL, y hace un año que también viene trabajando con Python, incluyendo modelos de clasificación. Actualmente utiliza Copilot dentro del entorno Office, además de Claude y ChatGPT. Tiene experiencia con AWS y Teradata.'),
    ('Leandro  Pili', 'background en economía y arrancó su carrera como analista de datos y scraper. Actualmente está en Alter5, empresa de soluciones con IA, donde desarrolla utilizando agentes para programar. Uno de sus proyectos consistio en armar un sistema con un agente que busca noticias de energía renovable y genera una automatizacion de newlestter, conectando la API de Mailchimp. Trabaja principalmente en Python y Node, usando LangChain y LangGraph para extracción de datos, y maneja APIs con MongoDB y FastAPI. Tiene conocimiento de RAG a nivel de cursos y consulta de documentación.  Es un perfil Junior: le faltan conceptos técnicos más sólidos pero tiene conocociento en desarrollo de automatizaciones')
  ) as t(nombre_completo, feedback)
  loop
    select count(*) into v_count from candidatos
    where normalizar_nombre_para_match(nombre_completo) = normalizar_nombre_para_match(fila.nombre_completo);

    if v_count <> 1 then
      raise notice 'Salteado (% candidatos con ese nombre): %', v_count, fila.nombre_completo;
      total_saltado := total_saltado + 1;
      continue;
    end if;

    select id into v_candidato_id from candidatos
    where normalizar_nombre_para_match(nombre_completo) = normalizar_nombre_para_match(fila.nombre_completo);

    select count(*) into v_count from postulaciones where candidato_id = v_candidato_id;
    if v_count <> 1 then
      raise notice 'Salteado (% postulaciones, no 1): % (id %)', v_count, fila.nombre_completo, v_candidato_id;
      total_saltado := total_saltado + 1;
      continue;
    end if;

    update postulaciones set feedback_entrevista_area = fila.feedback
    where candidato_id = v_candidato_id;
    total_ok := total_ok + 1;
  end loop;

  raise notice '% actualizados, % salteados.', total_ok, total_saltado;
end $$;
