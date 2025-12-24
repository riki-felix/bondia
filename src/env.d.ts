/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: import('@supabase/supabase-js').User;
    session?: import('@supabase/supabase-js').Session;
  }
}
