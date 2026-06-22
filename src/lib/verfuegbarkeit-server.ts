/**
 * Server-seitiges Laden der Verfügbarkeits-Konfiguration aus Supabase.
 * Getrennt von verfuegbarkeit.ts, damit der Supabase-Client NICHT ins
 * Client-Bundle gelangt (verfuegbarkeit.ts wird im Admin-Frontend importiert).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalisiere, type Verfuegbarkeit } from './verfuegbarkeit';

export async function ladeVerfuegbarkeit(supabase: SupabaseClient | null): Promise<Verfuegbarkeit> {
  if (!supabase) return normalisiere(null);
  const { data } = await supabase
    .from('einstellungen')
    .select('wert')
    .eq('schluessel', 'verfuegbarkeit')
    .maybeSingle<{ wert: Partial<Verfuegbarkeit> }>();
  return normalisiere(data?.wert);
}
