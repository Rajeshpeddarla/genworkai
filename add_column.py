from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv("apps/web/.env.local")
engine = create_engine(os.environ["POSTGRES_CONNECTION_STRING"])
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE document_chunks ADD COLUMN assets JSON;"))
        conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Error: {e}")
