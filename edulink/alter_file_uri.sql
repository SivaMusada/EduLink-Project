-- Fix file_uri column to support large base64-encoded file content
ALTER TABLE learning_materials MODIFY COLUMN file_uri LONGTEXT;
