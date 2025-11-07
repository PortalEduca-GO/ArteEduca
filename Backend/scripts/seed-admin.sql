DECLARE @id UNIQUEIDENTIFIER = NEWID();

INSERT INTO arteeduca.users (
    id,
    full_name,
    email,
    password_hash,
    cpf,
    cre,
    inep,
    app_role,
    available_roles,
    is_admin_account,
    is_active,
    data_json
)
VALUES (
    @id,
    N'Administrador Geral',
    N'admin@adm',
    N'$2a$10$bLKfNdKJUQeEjIqfCG7hN.EYnBFcXc8DCbd0XxxzRrDPbNLmaKQcO',
    N'00000000000',
    N'00000',
    N'00000000',
    N'admin',
    N'["admin","gestor","articulador","professor"]',
    1,
    1,
    N'{"seed":"default-admin","cre":"00000","inep":"00000000"}'
);

SELECT id, email, app_role
FROM arteeduca.users
WHERE id = @id;
