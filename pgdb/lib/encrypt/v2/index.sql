-- assumes func schema exists
\echo 'encrypt\v2'

create function func.aes_encrypt(ivkey bytea, what text)
  returns bytea
  language sql
as
$$
select encrypt_iv(
  decode(what, 'escape'),
  substring(ivkey::bytea, 1, 32),
  substring(ivkey::bytea, 33, 16),
  'AES'
  )
$$;

create function func.aes_encrypt(ivkey bytea, what numeric)
  returns bytea
  language sql
as
$$
select encrypt_iv(
  decode(what::text, 'escape'),
  substring(ivkey::bytea, 1, 32),
  substring(ivkey::bytea, 33, 16),
  'AES'
  )
$$;

create function func.aes_decrypt_to_text(ivkey bytea, what bytea)
  returns text
  language sql
as
$$
select encode(
  decrypt_iv(
    what,
    substring(ivkey::bytea, 1, 32),
    substring(ivkey::bytea, 33, 16),
    'AES'
    ),
  'escape')
$$;

create function func.aes_decrypt_to_numeric(ivkey bytea, what bytea)
  returns numeric
  language sql
as
$$
select encode(
  decrypt_iv(
    what,
    substring(ivkey::bytea, 1, 32),
    substring(ivkey::bytea, 33, 16),
    'AES'
    ),
  'escape') :: numeric
$$;
