import uuid
from src.core.supabase import get_supabase_client

class AssetExtractor:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.bucket = "document-assets"
        
    def extract_and_upload(self, document_id: int, file_bytes: bytes, mime_type: str, asset_type: str) -> str:
        """
        Uploads a raw asset (image, audio, etc) to Supabase Storage and returns the storage_key.
        """
        extension = mime_type.split('/')[-1] if '/' in mime_type else 'bin'
        key = f"{document_id}/{asset_type}/{uuid.uuid4().hex}.{extension}"
        
        try:
            self.supabase.storage.from_(self.bucket).upload(
                file=file_bytes,
                path=key,
                file_options={"content-type": mime_type}
            )
        except Exception as e:
            # If the bucket doesn't exist, we might get an error, but let's try to proceed
            print(f"[AssetExtractor] Failed to upload {key}: {e}")
            
        return key

    def get_public_url(self, key: str) -> str:
        """
        Returns the public URL for an asset key.
        """
        try:
            res = self.supabase.storage.from_(self.bucket).get_public_url(key)
            return res
        except Exception as e:
            print(f"[AssetExtractor] Failed to get public URL for {key}: {e}")
            return ""
