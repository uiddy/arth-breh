-- Execute no SQL Editor do projeto Supabase para habilitar as fotos adicionais.
-- A foto principal permanece em imagem_path; as fotos extras são opcionais.
ALTER TABLE public.obras
    ADD COLUMN IF NOT EXISTS imagem_verso_path text,
    ADD COLUMN IF NOT EXISTS imagem_textura_path text;

NOTIFY pgrst, 'reload schema';
