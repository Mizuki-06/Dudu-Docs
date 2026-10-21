const SUPABASE_URL = "https://xqgyzdezqemmjybntkpw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_a79jfX4a3xrGAClerGQitg_KWnJWduA";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);