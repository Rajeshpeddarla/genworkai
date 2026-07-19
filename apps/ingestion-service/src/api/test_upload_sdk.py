from supabase import create_client, Client
import os

supabase_url = "https://ctyzlvywuginxxrrgdsj.supabase.co"
supabase_key = "sb_publishable_3IA8UWmXJ7xxhEfmQUtRIw_yPS_FdtE"

supabase: Client = create_client(supabase_url, supabase_key)

try:
    response = supabase.storage.from_("baseparse-assets").upload("test_sdk.png", b"test", {"content-type": "image/png"})
    print("Success:", response)
except Exception as e:
    print("Error:", e)
