import urllib.request
import urllib.error

supabase_url = "https://ctyzlvywuginxxrrgdsj.supabase.co"
supabase_key = "sb_publishable_3IA8UWmXJ7xxhEfmQUtRIw_yPS_FdtE"

upload_url = f"{supabase_url}/storage/v1/object/baseparse-assets/test.png"
req = urllib.request.Request(upload_url, data=b"test", method='POST')
req.add_header('apikey', supabase_key)
# Removed Authorization header
req.add_header('Content-Type', 'image/png')

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print("Error:", e)
